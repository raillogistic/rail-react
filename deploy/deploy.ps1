[CmdletBinding()]
param(
  [string]$ImageName = "rail-react",
  [string]$Tag = "latest",
  [string]$ContainerName = "rail-react-web",
  [string]$BindAddress = "127.0.0.1",
  [ValidateRange(1, 3600)]
  [int]$HealthTimeoutSeconds = 60,
  [string]$NodeImage,
  [string]$NginxImage,
  [switch]$NoCache,
  [switch]$SkipRun,
  [switch]$PruneDanglingImages,
  [switch]$PullBaseImages
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[deploy] $Message" -ForegroundColor Cyan
}

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found in PATH."
  }
}

function Copy-BuildContext {
  param(
    [string]$Source,
    [string]$Destination
  )

  $excludeDirectories = @(
    ".git",
    "node_modules",
    "dist",
    "__pycache__",
    ".ruff_cache",
    ".pytest_cache",
    ".venv"
  )
  $excludeFiles = @(
    ".env",
    ".env.*",
    "*.log",
    "*.tmp"
  )

  $robocopyArgs = @(
    $Source,
    $Destination,
    "/MIR",
    "/R:2",
    "/W:1",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS",
    "/NP",
    "/XD"
  ) + $excludeDirectories + @(
    "/XF"
  ) + $excludeFiles

  & robocopy @robocopyArgs | Out-Null
  $robocopyExitCode = $LASTEXITCODE

  if ($robocopyExitCode -gt 7) {
    throw "Failed to prepare Docker context (robocopy exit code: $robocopyExitCode)."
  }
}

function Get-DotEnvValue {
  param(
    [string]$FilePath,
    [string[]]$Keys
  )

  $lookup = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  foreach ($key in $Keys) {
    [void]$lookup.Add($key)
  }

  foreach ($rawLine in Get-Content -LiteralPath $FilePath) {
    $line = $rawLine.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
      continue
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -lt 1) {
      continue
    }

    $name = $line.Substring(0, $separatorIndex).Trim()
    if (-not $lookup.Contains($name)) {
      continue
    }

    $value = $line.Substring($separatorIndex + 1).Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      if ($value.Length -ge 2) {
        $value = $value.Substring(1, $value.Length - 2)
      }
    }
    return $value
  }

  return $null
}

function Resolve-HostPortFromDotEnv {
  param([string]$DotEnvPath)

  $portValue = Get-DotEnvValue -FilePath $DotEnvPath -Keys @(
    "RAIL_REACT_PORT",
    "FRONTEND_PORT",
    "HOST_PORT",
    "PORT"
  )

  if ([string]::IsNullOrWhiteSpace($portValue)) {
    Write-Warning "No port key found in .env. Expected one of: RAIL_REACT_PORT, FRONTEND_PORT, HOST_PORT, PORT. Falling back to 8080."
    return 8080
  }

  [int]$parsedPort = 0
  if (-not [int]::TryParse($portValue, [ref]$parsedPort) -or $parsedPort -lt 1 -or $parsedPort -gt 65535) {
    throw "Invalid port value '$portValue' in .env. Use an integer between 1 and 65535."
  }

  return $parsedPort
}

function Get-ContainerByName {
  param([string]$Name)
  $output = & docker ps -a --filter "name=^${Name}$" --format "{{.Names}}" 2>$null
  return ([string]$output).Trim()
}

function Remove-ContainerIfExists {
  param([string]$Name)

  $existingContainer = Get-ContainerByName -Name $Name
  if ($existingContainer -eq $Name) {
    & docker rm -f $Name | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to remove container '$Name'."
    }
  }
}

function Get-ContainerState {
  param([string]$Name)
  $output = & docker inspect --format "{{.State.Status}}" $Name 2>$null
  return ([string]$output).Trim()
}

function Get-ContainerHealthStatus {
  param([string]$Name)
  $output = & docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $Name 2>$null
  return ([string]$output).Trim()
}

function Wait-ForContainerReady {
  param(
    [string]$Name,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $state = "unknown"
  $health = "unknown"

  while ((Get-Date) -lt $deadline) {
    $state = Get-ContainerState -Name $Name
    if ([string]::IsNullOrWhiteSpace($state)) {
      Start-Sleep -Seconds 1
      continue
    }

    $health = Get-ContainerHealthStatus -Name $Name
    if ([string]::IsNullOrWhiteSpace($health)) {
      $health = "unknown"
    }

    if ($state -eq "running" -and ($health -eq "healthy" -or $health -eq "none")) {
      return
    }

    if ($state -eq "exited" -or $state -eq "dead") {
      throw "Container '$Name' terminated early (state: $state, health: $health)."
    }

    Start-Sleep -Seconds 1
  }

  throw "Timed out waiting for container '$Name' readiness (state: $state, health: $health)."
}

function Get-RunArgs {
  param(
    [string]$Name,
    [string]$Image,
    [string]$PortBinding,
    [string]$RestartPolicy = "unless-stopped"
  )

  $args = @(
    "run",
    "-d",
    "--name", $Name,
    "--restart", $RestartPolicy,
    "--read-only",
    "--tmpfs", "/var/cache/nginx:rw,size=64m",
    "--tmpfs", "/var/run:rw,size=1m",
    "--tmpfs", "/var/log/nginx:rw,size=16m"
  )

  if (-not [string]::IsNullOrWhiteSpace($PortBinding)) {
    $args += @("-p", $PortBinding)
  }

  $args += $Image
  return $args
}

Assert-Command "docker"
Assert-Command "robocopy"

try {
  & docker info | Out-Null
} catch {
  throw "Docker daemon is not reachable. Start Docker Desktop (or Docker service) and try again."
}

$scriptDir = Split-Path -Parent $PSCommandPath
$projectRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$lockFilePath = Join-Path $projectRoot "package-lock.json"
$dotEnvPath = Join-Path $projectRoot ".env"
$dockerfilePath = Join-Path $scriptDir "Dockerfile"
$nginxConfigPath = Join-Path $scriptDir "nginx.conf"

if (-not (Test-Path -LiteralPath $lockFilePath)) {
  throw "Missing package-lock.json. This deploy script expects npm lockfile for deterministic builds."
}
if (-not (Test-Path -LiteralPath $dockerfilePath)) {
  throw "Missing deploy Dockerfile at '$dockerfilePath'."
}
if (-not (Test-Path -LiteralPath $nginxConfigPath)) {
  throw "Missing Nginx config at '$nginxConfigPath'."
}

$hostPort = $null
if (-not $SkipRun) {
  if (-not (Test-Path -LiteralPath $dotEnvPath)) {
    throw "Missing .env in project root. Deployment port is resolved from .env."
  }
  $hostPort = Resolve-HostPortFromDotEnv -DotEnvPath $dotEnvPath
}

$fullImageName = "$ImageName`:$Tag"

$tempContext = $null
$candidateContainerName = "$ContainerName-candidate-" + [Guid]::NewGuid().ToString("N").Substring(0, 8)
$previousContainerImage = $null
$removedExistingContainer = $false
$deployedContainer = $false
$previousBuildKit = $env:DOCKER_BUILDKIT

try {
  $tempContext = Join-Path $env:TEMP ("rail-react-docker-context-" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $tempContext -Force | Out-Null

  Write-Step "Preparing lean Docker build context..."
  Copy-BuildContext -Source $projectRoot -Destination $tempContext

  $env:DOCKER_BUILDKIT = "1"
  $contextDockerfilePath = Join-Path $tempContext "deploy\Dockerfile"
  if (-not (Test-Path -LiteralPath $contextDockerfilePath)) {
    throw "Dockerfile not found in build context at '$contextDockerfilePath'."
  }

  $buildArgs = @("build", "--tag", $fullImageName, "--file", $contextDockerfilePath)
  if ($PullBaseImages) {
    $buildArgs += "--pull"
  }
  if ($NoCache) {
    $buildArgs += "--no-cache"
  }
  if (-not [string]::IsNullOrWhiteSpace($NodeImage)) {
    $buildArgs += @("--build-arg", "NODE_IMAGE=$NodeImage")
  }
  if (-not [string]::IsNullOrWhiteSpace($NginxImage)) {
    $buildArgs += @("--build-arg", "NGINX_IMAGE=$NginxImage")
  }
  $buildArgs += $tempContext

  Write-Step "Building image $fullImageName ..."
  & docker @buildArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Docker build failed."
  }

  Write-Step "Build complete."

  if (-not $SkipRun) {
    $existingContainer = Get-ContainerByName -Name $ContainerName
    if ($existingContainer -eq $ContainerName) {
      $previousContainerImage = ([string](& docker inspect --format "{{.Config.Image}}" $ContainerName)).Trim()
      if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($previousContainerImage)) {
        throw "Failed to determine image for existing container '$ContainerName'."
      }
    }

    Write-Step "Starting candidate container '$candidateContainerName' for readiness validation ..."
    $candidateRunArgs = Get-RunArgs -Name $candidateContainerName -Image $fullImageName -PortBinding "" -RestartPolicy "no"
    $candidateId = ([string](& docker @candidateRunArgs)).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($candidateId)) {
      throw "Failed to start candidate container '$candidateContainerName'."
    }

    try {
      Wait-ForContainerReady -Name $candidateContainerName -TimeoutSeconds $HealthTimeoutSeconds
    } catch {
      & docker logs --tail 50 $candidateContainerName
      throw
    }

    Write-Step "Candidate image is healthy."

    if ($existingContainer -eq $ContainerName) {
      Write-Step "Removing existing container '$ContainerName' ..."
      Remove-ContainerIfExists -Name $ContainerName
      $removedExistingContainer = $true
    }

    $portBinding = if ([string]::IsNullOrWhiteSpace($BindAddress) -or $BindAddress -eq "0.0.0.0") {
      "${hostPort}:80"
    } else {
      "${BindAddress}:${hostPort}:80"
    }

    $displayHost = if ([string]::IsNullOrWhiteSpace($BindAddress) -or $BindAddress -eq "0.0.0.0" -or $BindAddress -eq "127.0.0.1") {
      "localhost"
    } else {
      $BindAddress
    }

    $runArgs = Get-RunArgs -Name $ContainerName -Image $fullImageName -PortBinding $portBinding
    Write-Step "Starting container '$ContainerName' on http://${displayHost}:$hostPort ..."
    $containerId = ([string](& docker @runArgs)).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerId)) {
      throw "Failed to start container '$ContainerName'."
    }

    try {
      Wait-ForContainerReady -Name $ContainerName -TimeoutSeconds $HealthTimeoutSeconds
    } catch {
      & docker logs --tail 50 $ContainerName
      throw
    }

    $deployedContainer = $true
    Write-Step "Deployment successful. App URL: http://${displayHost}:$hostPort"
  } else {
    Write-Step "Build finished. Container run was skipped by request."
  }

  if ($PruneDanglingImages) {
    Write-Step "Pruning dangling images ..."
    & docker image prune -f --filter "dangling=true" | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to prune dangling images."
    }
  }
} catch {
  if (-not $SkipRun -and -not $deployedContainer -and $removedExistingContainer -and -not [string]::IsNullOrWhiteSpace($previousContainerImage)) {
    Write-Warning "Deployment failed after removing '$ContainerName'. Attempting rollback to image '$previousContainerImage' ..."

    try {
      Remove-ContainerIfExists -Name $ContainerName

      $rollbackPortBinding = if ([string]::IsNullOrWhiteSpace($BindAddress) -or $BindAddress -eq "0.0.0.0") {
        "${hostPort}:80"
      } else {
        "${BindAddress}:${hostPort}:80"
      }

      $rollbackArgs = Get-RunArgs -Name $ContainerName -Image $previousContainerImage -PortBinding $rollbackPortBinding
      $rollbackContainerId = ([string](& docker @rollbackArgs)).Trim()
      if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($rollbackContainerId)) {
        throw "Failed to start rollback container '$ContainerName'."
      }

      Wait-ForContainerReady -Name $ContainerName -TimeoutSeconds $HealthTimeoutSeconds
      Write-Warning "Rollback succeeded. Previous deployment has been restored."
    } catch {
      Write-Warning "Rollback failed: $($_.Exception.Message)"
    }
  }

  throw
} finally {
  if (-not [string]::IsNullOrWhiteSpace($candidateContainerName)) {
    & docker rm -f $candidateContainerName 2>$null | Out-Null
  }

  if ($null -ne $tempContext -and (Test-Path -LiteralPath $tempContext)) {
    Remove-Item -LiteralPath $tempContext -Recurse -Force
  }

  $env:DOCKER_BUILDKIT = $previousBuildKit
}
