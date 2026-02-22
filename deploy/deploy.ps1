[CmdletBinding()]
param(
  [string]$ImageName = "rail-react",
  [string]$Tag = "latest",
  [string]$ContainerName = "rail-react-web",
  [switch]$NoCache,
  [switch]$SkipRun,
  [switch]$PruneDanglingImages
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

  $excludeDirectories = @(".git", "node_modules", "dist", "__pycache__")
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
  ) + $excludeDirectories

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
if (-not (Test-Path -LiteralPath $dotEnvPath)) {
  throw "Missing .env in project root. Deployment port is resolved from .env."
}
if (-not (Test-Path -LiteralPath $dockerfilePath)) {
  throw "Missing deploy Dockerfile at '$dockerfilePath'."
}
if (-not (Test-Path -LiteralPath $nginxConfigPath)) {
  throw "Missing Nginx config at '$nginxConfigPath'."
}

$hostPort = Resolve-HostPortFromDotEnv -DotEnvPath $dotEnvPath

$fullImageName = "$ImageName`:$Tag"

$tempContext = $null
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

  $buildArgs = @("build", "--pull", "--tag", $fullImageName, "--file", $contextDockerfilePath)
  if ($NoCache) {
    $buildArgs += "--no-cache"
  }
  $buildArgs += $tempContext

  Write-Step "Building image $fullImageName ..."
  & docker @buildArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Docker build failed."
  }

  Write-Step "Build complete."

  if (-not $SkipRun) {
    $existingContainer = (& docker ps -a --filter "name=^${ContainerName}$" --format "{{.Names}}").Trim()
    if ($existingContainer -eq $ContainerName) {
      Write-Step "Removing existing container '$ContainerName' ..."
      & docker rm -f $ContainerName | Out-Null
      if ($LASTEXITCODE -ne 0) {
        throw "Failed to remove existing container '$ContainerName'."
      }
    }

    $runArgs = @(
      "run",
      "-d",
      "--name", $ContainerName,
      "--restart", "unless-stopped",
      "--read-only",
      "--tmpfs", "/var/cache/nginx:rw,size=64m",
      "--tmpfs", "/var/run:rw,size=1m",
      "--tmpfs", "/var/log/nginx:rw,size=16m",
      "-p", "${hostPort}:80",
      $fullImageName
    )

    Write-Step "Starting container '$ContainerName' on http://localhost:$hostPort ..."
    $containerId = (& docker @runArgs).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerId)) {
      throw "Failed to start container '$ContainerName'."
    }

    Start-Sleep -Seconds 2
    $containerState = (& docker inspect --format "{{.State.Status}}" $ContainerName).Trim()
    if ($containerState -ne "running") {
      & docker logs --tail 50 $ContainerName
      throw "Container '$ContainerName' is not running (state: $containerState)."
    }

    Write-Step "Deployment successful. App URL: http://localhost:$hostPort"
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
} finally {
  if ($null -ne $tempContext -and (Test-Path -LiteralPath $tempContext)) {
    Remove-Item -LiteralPath $tempContext -Recurse -Force
  }

  $env:DOCKER_BUILDKIT = $previousBuildKit
}
