<#
.SYNOPSIS
    Build the production images locally and deploy them to the VPS.

.DESCRIPTION
    Images are built here and shipped over SSH because web/next.config.js is gitignored,
    so the server cannot build from a clone. The server only needs docker-compose.yml,
    .env (APP_KEY, DB_PASSWORD, ...) and web/.env (AI keys) in $RemoteDir; the env files
    are created once by hand and never touched by this script.

.EXAMPLE
    .\deploy.ps1                 # build + deploy web and api
    .\deploy.ps1 -Service web    # frontend only (much faster upload)
    .\deploy.ps1 -SkipBuild      # re-ship the images that are already built
#>
param(
    [ValidateSet('all', 'web', 'api')]
    [string]$Service = 'all',
    [string]$Server = 'personal@139.190.101.245',
    [string]$RemoteDir = 'telaahkarier',
    [string]$Url = 'https://telaahkarier.com',
    [switch]$SkipBuild,
    [switch]$SkipMigrate
)

Set-Location $PSScriptRoot

$services = if ($Service -eq 'all') { @('api', 'web') } else { @($Service) }
$images = $services | ForEach-Object { "gemastik-$_`:latest" }
$ssh = @('-o', 'BatchMode=yes', '-o', 'ServerAliveInterval=15', $Server)

function Step($message) { Write-Host "`n==> $message" -ForegroundColor Cyan }

function Assert-Ok($what) {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $what (exit $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
}

Step 'Checking Docker and the server'
docker version --format 'local docker {{.Server.Version}}'
Assert-Ok 'local Docker is not running'
ssh @ssh "cd $RemoteDir && test -f .env && test -f web/.env && echo 'server env files present'"
Assert-Ok "cannot reach $Server, or $RemoteDir/.env and $RemoteDir/web/.env are missing"

if (-not $SkipBuild) {
    Step "Building $($services -join ', ')"
    # docker-compose.yml requires these to parse; the real values live in the server's .env
    if (-not $env:APP_KEY) { $env:APP_KEY = 'build-only' }
    if (-not $env:DB_PASSWORD) { $env:DB_PASSWORD = 'build-only' }
    foreach ($s in $services) {
        docker compose -p gemastik build $s
        Assert-Ok "build of $s"
    }
}

Step "Uploading $($images -join ', ')"
# cmd does the piping: a PowerShell 5.1 pipeline would corrupt the binary tar stream
cmd /c "docker save $($images -join ' ') | ssh -C -o BatchMode=yes -o ServerAliveInterval=15 $Server sudo docker load"
Assert-Ok 'image upload'

Step 'Starting containers'
scp -q -o BatchMode=yes docker-compose.yml "${Server}:$RemoteDir/docker-compose.yml"
Assert-Ok 'copy of docker-compose.yml'
ssh @ssh "cd $RemoteDir && sudo docker compose up -d --no-build $($services -join ' ')"
Assert-Ok 'docker compose up'

if ($services -contains 'api' -and -not $SkipMigrate) {
    Step 'Running migrations'
    ssh @ssh "cd $RemoteDir && sleep 5 && sudo docker compose exec -T api php artisan migrate --force"
    Assert-Ok 'migrations'
}

ssh @ssh "cd $RemoteDir && sudo docker compose ps --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'"

Step "Verifying $Url"
Start-Sleep -Seconds 3
$failed = $false

try {
    $page = Invoke-WebRequest "$Url/login" -UseBasicParsing -TimeoutSec 30
    Write-Host "GET  /login           -> $($page.StatusCode)"
} catch {
    Write-Host "GET  /login           -> $($_.Exception.Message)" -ForegroundColor Red
    $failed = $true
}

# Bad credentials must come back as 422 from Laravel: proves web -> api -> postgres
try {
    Invoke-WebRequest "$Url/api/auth/login" -Method Post -ContentType 'application/json' `
        -Body '{"email":"deploy-check@example.com","password":"wrong"}' -UseBasicParsing -TimeoutSec 30 | Out-Null
    $status = 200
} catch {
    $status = [int]$_.Exception.Response.StatusCode
}
Write-Host "POST /api/auth/login  -> $status (expected 422)"
if ($status -ne 422) { $failed = $true }

if ($failed) {
    # Old images are left on the server (untagged) so a rollback is still possible
    Write-Host "`nDeployed, but verification FAILED" -ForegroundColor Red
    exit 1
}

Step 'Cleaning up old images on the server'
ssh @ssh "sudo docker image prune -f | tail -1"
Write-Host "`nDeployed and verified: $Url" -ForegroundColor Green
