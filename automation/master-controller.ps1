# Second Chance Master Automation Controller
# Single Claude instance can trigger any script/test through this controller

param(
    [Parameter(Position=0)]
    [string]$Command = "status",
    
    [Parameter(Position=1)]
    [string[]]$Args = @()
)

$ErrorActionPreference = "Stop"
$script:ProjectRoot = "C:\Users\David\Apps\Second-Chance"
$script:LogFile = "$ProjectRoot\automation\automation.log"

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $script:LogFile -Value $logEntry
    
    switch ($Level) {
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $Message -ForegroundColor Green }
        "INFO" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message }
    }
}

# Command registry
$Commands = @{
    # Setup commands
    "setup" = {
        Write-Log "🔧 Running complete setup..." "INFO"
        & "$ProjectRoot\automation\scripts\setup\full-setup.ps1"
    }
    
    "install" = {
        Write-Log "📦 Installing dependencies..." "INFO"
        & "$ProjectRoot\automation\scripts\setup\install-dependencies.ps1"
    }
    
    # Development commands
    "start" = {
        Write-Log "🚀 Starting all services..." "INFO"
        & "$ProjectRoot\automation\scripts\development\start-all.ps1"
    }
    
    "start-backend" = {
        Write-Log "🔧 Starting backend server..." "INFO"
        & "$ProjectRoot\automation\scripts\development\start-backend.ps1"
    }
    
    "start-frontend" = {
        Write-Log "🎨 Starting frontend..." "INFO"
        & "$ProjectRoot\automation\scripts\development\start-frontend.ps1"
    }
    
    # Testing commands
    "test" = {
        Write-Log "🧪 Running all tests..." "INFO"
        & "$ProjectRoot\automation\scripts\testing\run-all-tests.ps1"
    }
    
    "test-buttons" = {
        Write-Log "🔘 Testing button functionality..." "INFO"
        & "$ProjectRoot\automation\scripts\testing\test-buttons.ps1"
    }
    
    "test-api" = {
        Write-Log "🔗 Testing API endpoints..." "INFO"
        & "$ProjectRoot\automation\scripts\testing\test-api-endpoints.ps1"
    }
    
    "test-e2e" = {
        Write-Log "🎯 Running E2E tests..." "INFO"
        & "$ProjectRoot\automation\scripts\testing\run-e2e-tests.ps1"
    }
    
    # Monitoring commands
    "status" = {
        Write-Log "📊 Checking project status..." "INFO"
        & "$ProjectRoot\automation\scripts\monitoring\status-check.ps1"
    }
    
    "health" = {
        Write-Log "💚 Running health checks..." "INFO"
        & "$ProjectRoot\automation\scripts\monitoring\health-check.ps1"
    }
    
    "logs" = {
        Write-Log "📜 Showing recent logs..." "INFO"
        Get-Content $script:LogFile -Tail 50
    }
    
    # Fix commands
    "fix-buttons" = {
        Write-Log "🔧 Fixing button functionality..." "WARNING"
        & "$ProjectRoot\automation\scripts\fixes\fix-button-handlers.ps1"
    }
    
    "fix-server" = {
        Write-Log "🔧 Fixing server issues..." "WARNING"
        & "$ProjectRoot\automation\scripts\fixes\fix-server-startup.ps1"
    }
    
    # Build & Deploy
    "build" = {
        Write-Log "🏗️ Building production version..." "INFO"
        & "$ProjectRoot\automation\scripts\deployment\build-production.ps1"
    }
    
    "deploy" = {
        Write-Log "🚀 Deploying to production..." "INFO"
        & "$ProjectRoot\automation\scripts\deployment\deploy-web.ps1"
    }
    
    # Utility commands
    "clean" = {
        Write-Log "🧹 Cleaning project..." "INFO"
        Remove-Item -Path "$ProjectRoot\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "$ProjectRoot\dist" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "$ProjectRoot\build" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Log "✅ Project cleaned" "SUCCESS"
    }
    
    "reset" = {
        Write-Log "🔄 Resetting to clean state..." "WARNING"
        & "$ProjectRoot\automation\scripts\utility\reset-project.ps1"
    }
    
    "watch" = {
        Write-Log "👁️ Starting file watcher..." "INFO"
        & "$ProjectRoot\automation\scripts\development\watch-changes.ps1"
    }
    
    # Beta preparation
    "beta-ready" = {
        Write-Log "🎯 Checking beta readiness..." "INFO"
        & "$ProjectRoot\automation\scripts\deployment\beta-readiness-check.ps1"
    }
}

# Help command
if ($Command -eq "help" -or $Command -eq "?") {
    Write-Host ""
    Write-Host "Second Chance Automation Controller" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\master-controller.ps1 <command> [args]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available Commands:" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Setup & Installation:" -ForegroundColor Cyan
    Write-Host "    setup          - Run complete project setup"
    Write-Host "    install        - Install all dependencies"
    Write-Host ""
    Write-Host "  Development:" -ForegroundColor Cyan
    Write-Host "    start          - Start all services (backend + frontend)"
    Write-Host "    start-backend  - Start backend server only"
    Write-Host "    start-frontend - Start frontend only"
    Write-Host "    watch          - Watch for file changes"
    Write-Host ""
    Write-Host "  Testing:" -ForegroundColor Cyan
    Write-Host "    test           - Run all tests"
    Write-Host "    test-buttons   - Test button functionality"
    Write-Host "    test-api       - Test API endpoints"
    Write-Host "    test-e2e       - Run E2E tests"
    Write-Host ""
    Write-Host "  Monitoring:" -ForegroundColor Cyan
    Write-Host "    status         - Check project status"
    Write-Host "    health         - Run health checks"
    Write-Host "    logs           - Show recent logs"
    Write-Host ""
    Write-Host "  Fixes:" -ForegroundColor Cyan
    Write-Host "    fix-buttons    - Fix non-functional buttons"
    Write-Host "    fix-server     - Fix server startup issues"
    Write-Host ""
    Write-Host "  Deployment:" -ForegroundColor Cyan
    Write-Host "    build          - Build production version"
    Write-Host "    deploy         - Deploy to production"
    Write-Host "    beta-ready     - Check beta readiness"
    Write-Host ""
    Write-Host "  Utility:" -ForegroundColor Cyan
    Write-Host "    clean          - Clean build artifacts"
    Write-Host "    reset          - Reset to clean state"
    Write-Host "    help           - Show this help"
    Write-Host ""
    exit 0
}

# Execute command
if ($Commands.ContainsKey($Command)) {
    try {
        Write-Log "Executing command: $Command" "INFO"
        & $Commands[$Command]
        Write-Log "Command completed: $Command" "SUCCESS"
    }
    catch {
        Write-Log "Command failed: $Command - $_" "ERROR"
        exit 1
    }
}
else {
    Write-Log "Unknown command: $Command" "ERROR"
    Write-Host "Run .\master-controller.ps1 help for available commands" -ForegroundColor Yellow
    exit 1
}