[CmdletBinding()]
param(
  [string]$ImageName = "rail-react",
  [string]$Tag = "latest",
  [string]$ContainerName = "rail-react-web",
  [string]$BindAddress = "127.0.0.1",
  [switch]$NoCache,
  [switch]$SkipRun
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
Assert-Command "yarn"

$scriptDir = Split-Path -Parent $PSCommandPath
$projectRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$dockerfilePath = Join-Path $scriptDir "Dockerfile"
$nginxConfigPath = Join-Path $scriptDir "nginx.conf"
$distPath = Join-Path $projectRoot "dist"
$dotEnvPath = Join-Path $projectRoot ".env"
$fullImageName = "$ImageName`:$Tag"

if (-not (Test-Path -LiteralPath $dockerfilePath)) {
  throw "Missing deploy Dockerfile at '$dockerfilePath'."
}
if (-not (Test-Path -LiteralPath $nginxConfigPath)) {
  throw "Missing Nginx config at '$nginxConfigPath'."
}

Write-Step "Running yarn build ..."
Push-Location $projectRoot
try {
  & yarn build
  if ($LASTEXITCODE -ne 0) {
    throw "yarn build failed."
  }
} finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath $distPath)) {
  throw "Build completed but dist folder was not found at '$distPath'."
}

$buildArgs = @("build", "--tag", $fullImageName, "--file", $dockerfilePath)
if ($NoCache) {
  $buildArgs += "--no-cache"
}
$buildArgs += $projectRoot

Write-Step "Building Docker image $fullImageName ..."
& docker @buildArgs
if ($LASTEXITCODE -ne 0) {
  throw "Docker build failed."
}

Write-Step "Image build complete."

if ($SkipRun) {
  Write-Step "Container run skipped by request."
  return
}

if (-not (Test-Path -LiteralPath $dotEnvPath)) {
  throw "Missing .env in project root. Deployment port is resolved from .env."
}

$hostPort = Resolve-HostPortFromDotEnv -DotEnvPath $dotEnvPath
$existingContainer = ([string](& docker ps -a --filter "name=^${ContainerName}$" --format "{{.Names}}" 2>$null)).Trim()
if ($existingContainer -eq $ContainerName) {
  Write-Step "Removing existing container '$ContainerName' ..."
  & docker rm -f $ContainerName | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to remove existing container '$ContainerName'."
  }
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

$runArgs = @(
  "run",
  "-d",
  "--name", $ContainerName,
  "--restart", "unless-stopped",
  "-p", $portBinding,
  $fullImageName
)

Write-Step "Starting container '$ContainerName' on http://${displayHost}:$hostPort ..."
$containerId = ([string](& docker @runArgs)).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerId)) {
  throw "Failed to start container '$ContainerName'."
}

Write-Step "Deployment successful. App URL: http://${displayHost}:$hostPort"
