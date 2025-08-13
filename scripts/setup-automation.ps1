# Second Chance Recovery App - Automation Setup Script
# Configures comprehensive testing and monitoring infrastructure

param(
    [switch]$SkipInstall,
    [switch]$Verbose,
    [string]$Environment = "development"
)

$ErrorActionPreference = "Stop"

# Script configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogsPath = Join-Path $ProjectRoot "logs"
$TestResultsPath = Join-Path $ProjectRoot "test-results"
$CoverageePath = Join-Path $ProjectRoot "coverage"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "🏥 SECOND CHANCE AUTOMATION SETUP" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

function Write-LogEntry {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $LogEntry -ForegroundColor Red }
        "WARN" { Write-Host $LogEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $LogEntry -ForegroundColor Green }
        default { Write-Host $LogEntry -ForegroundColor White }
    }
    
    # Also log to file
    if (!(Test-Path $LogsPath)) {
        New-Item -ItemType Directory -Path $LogsPath -Force | Out-Null
    }
    $LogFile = Join-Path $LogsPath "setup-$(Get-Date -Format 'yyyy-MM-dd').log"
    Add-Content -Path $LogFile -Value $LogEntry
}

function Test-NodeInstallation {
    try {
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        
        if ($nodeVersion -and $npmVersion) {
            Write-LogEntry "✅ Node.js $nodeVersion and npm $npmVersion detected" "SUCCESS"
            return $true
        }
    } catch {
        Write-LogEntry "❌ Node.js or npm not found" "ERROR"
        return $false
    }
}

function Initialize-Directories {
    Write-LogEntry "📁 Initializing directory structure..."
    
    $Directories = @(
        $LogsPath,
        $TestResultsPath,
        $CoverageePath,
        (Join-Path $ProjectRoot "allure-results"),
        (Join-Path $ProjectRoot "playwright-report"),
        (Join-Path $ProjectRoot "tests\unit"),
        (Join-Path $ProjectRoot "tests\e2e"),
        (Join-Path $ProjectRoot "tests\visual-regression"),
        (Join-Path $ProjectRoot "tests\performance"),
        (Join-Path $ProjectRoot "tests\crisis-support"),
        (Join-Path $ProjectRoot "tests\privacy"),
        (Join-Path $ProjectRoot "tests\offline"),
        (Join-Path $ProjectRoot "src\test")
    )
    
    foreach ($Dir in $Directories) {
        if (!(Test-Path $Dir)) {
            New-Item -ItemType Directory -Path $Dir -Force | Out-Null
            Write-LogEntry "📂 Created directory: $Dir"
        }
    }
    
    Write-LogEntry "✅ Directory structure initialized" "SUCCESS"
}

function Install-Dependencies {
    if ($SkipInstall) {
        Write-LogEntry "⏭️ Skipping dependency installation" "WARN"
        return
    }
    
    Write-LogEntry "📦 Installing project dependencies..."
    
    Push-Location $ProjectRoot
    try {
        # Clean install
        if (Test-Path "node_modules") {
            Write-LogEntry "🧹 Cleaning existing node_modules..."
            Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
        }
        
        if (Test-Path "package-lock.json") {
            Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
        }
        
        # Install dependencies
        Write-LogEntry "📥 Installing npm dependencies..."
        npm install
        
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
        
        # Install Playwright browsers
        Write-LogEntry "🎭 Installing Playwright browsers..."
        npx playwright install
        
        if ($LASTEXITCODE -ne 0) {
            throw "Playwright browser installation failed"
        }
        
        Write-LogEntry "✅ Dependencies installed successfully" "SUCCESS"
        
    } catch {
        Write-LogEntry "❌ Dependency installation failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Pop-Location
    }
}

function Setup-EnvironmentConfig {
    Write-LogEntry "⚙️ Setting up environment configuration..."
    
    $EnvFile = Join-Path $ProjectRoot ".env.local"
    $EnvContent = @"
# Second Chance Recovery App - Local Environment Configuration
NODE_ENV=$Environment
VITE_APP_NAME=Second Chance Recovery
VITE_APP_VERSION=1.0.0-beta

# Crisis Support Configuration
VITE_CRISIS_HOTLINE_US=988
VITE_CRISIS_TEXT_US=741741
VITE_CRISIS_CHAT_URL=https://suicidepreventionlifeline.org/chat/

# Security and Privacy
VITE_ENCRYPTION_ENABLED=true
VITE_PRIVACY_MODE=strict
VITE_ANONYMOUS_MODE=true

# Monitoring and Analytics
VITE_SYNTHETIC_MONITORING=true
VITE_ERROR_REPORTING=true
VITE_PERFORMANCE_MONITORING=true

# Testing Configuration
VITE_TEST_MODE=false
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false

# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Offline Support
VITE_OFFLINE_SUPPORT=true
VITE_SW_ENABLED=true
"@
    
    if (!(Test-Path $EnvFile)) {
        Set-Content -Path $EnvFile -Value $EnvContent -Encoding UTF8
        Write-LogEntry "📄 Created .env.local file"
    } else {
        Write-LogEntry "📄 .env.local already exists, skipping..."
    }
}

function Setup-GitHooks {
    Write-LogEntry "🪝 Setting up Git hooks..."
    
    $HooksDir = Join-Path $ProjectRoot ".git\hooks"
    if (!(Test-Path $HooksDir)) {
        Write-LogEntry "⚠️ Git repository not found, skipping hooks setup" "WARN"
        return
    }
    
    # Pre-commit hook
    $PreCommitHook = Join-Path $HooksDir "pre-commit"
    $PreCommitContent = @"
#!/bin/sh
# Second Chance Recovery App - Pre-commit hook

echo "🏥 Second Chance - Running pre-commit checks..."

# Run linting
echo "📝 Running linter..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Commit aborted."
    exit 1
fi

# Run type checking
echo "🔍 Running type checker..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "❌ Type checking failed. Commit aborted."
    exit 1
fi

# Run unit tests
echo "🧪 Running unit tests..."
npm run test:run
if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed. Commit aborted."
    exit 1
fi

echo "✅ All pre-commit checks passed!"
"@
    
    Set-Content -Path $PreCommitHook -Value $PreCommitContent -Encoding UTF8
    
    # Make executable (if on Unix-like system)
    if ($PSVersionTable.Platform -eq "Unix") {
        chmod +x $PreCommitHook
    }
    
    Write-LogEntry "✅ Git hooks configured" "SUCCESS"
}

function Test-Installation {
    Write-LogEntry "🧪 Testing installation..."
    
    Push-Location $ProjectRoot
    try {
        # Test TypeScript compilation
        Write-LogEntry "📝 Testing TypeScript compilation..."
        npm run typecheck
        
        if ($LASTEXITCODE -ne 0) {
            Write-LogEntry "❌ TypeScript compilation failed" "ERROR"
            return $false
        }
        
        # Test linting
        Write-LogEntry "🔍 Testing ESLint configuration..."
        npm run lint
        
        if ($LASTEXITCODE -ne 0) {
            Write-LogEntry "⚠️ Linting issues found, but continuing..." "WARN"
        }
        
        # Test unit test runner
        Write-LogEntry "🧪 Testing unit test configuration..."
        npm run test:run
        
        if ($LASTEXITCODE -ne 0) {
            Write-LogEntry "⚠️ Some unit tests failed, but setup is functional" "WARN"
        }
        
        # Test Playwright installation
        Write-LogEntry "🎭 Testing Playwright installation..."
        npx playwright --version
        
        if ($LASTEXITCODE -ne 0) {
            Write-LogEntry "❌ Playwright test failed" "ERROR"
            return $false
        }
        
        Write-LogEntry "✅ Installation tests completed successfully" "SUCCESS"
        return $true
        
    } catch {
        Write-LogEntry "❌ Installation test failed: $($_.Exception.Message)" "ERROR"
        return $false
    } finally {
        Pop-Location
    }
}

function Generate-RunScripts {
    Write-LogEntry "📜 Generating automation run scripts..."
    
    # Test automation script
    $TestScript = Join-Path $ProjectRoot "run-all-tests.ps1"
    $TestScriptContent = @"
# Second Chance Recovery App - Comprehensive Test Runner
param([switch]`$CI, [switch]`$Coverage, [switch]`$Verbose)

`$ErrorActionPreference = "Continue"
Write-Host "🏥 SECOND CHANCE - COMPREHENSIVE TESTING" -ForegroundColor Cyan

# Unit Tests
Write-Host "🧪 Running unit tests..." -ForegroundColor Yellow
if (`$Coverage) {
    npm run test:coverage
} else {
    npm run test:run
}

# Type Checking
Write-Host "📝 Running type checker..." -ForegroundColor Yellow
npm run typecheck

# Linting
Write-Host "🔍 Running linter..." -ForegroundColor Yellow
npm run lint

# E2E Tests
Write-Host "🎭 Running E2E tests..." -ForegroundColor Yellow
if (`$CI) {
    npm run test:e2e:critical
} else {
    npm run test:e2e
}

# Performance Tests
Write-Host "⚡ Running performance tests..." -ForegroundColor Yellow
npm run test:performance

Write-Host "✅ All tests completed!" -ForegroundColor Green
"@
    
    Set-Content -Path $TestScript -Value $TestScriptContent -Encoding UTF8
    
    # Synthetic monitoring script
    $MonitoringScript = Join-Path $ProjectRoot "start-monitoring.ps1"
    $MonitoringScriptContent = @"
# Second Chance Recovery App - Start Monitoring
Write-Host "🏥 Starting Second Chance synthetic monitoring..." -ForegroundColor Cyan

Push-Location "`$PSScriptRoot"
try {
    node scripts\synthetic-monitoring.js start
} finally {
    Pop-Location
}
"@
    
    Set-Content -Path $MonitoringScript -Value $MonitoringScriptContent -Encoding UTF8
    
    Write-LogEntry "✅ Run scripts generated" "SUCCESS"
}

function Show-Summary {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "🎉 SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "• Run tests: .\run-all-tests.ps1" -ForegroundColor White
    Write-Host "• Start monitoring: .\start-monitoring.ps1" -ForegroundColor White
    Write-Host "• Start development: npm run dev" -ForegroundColor White
    Write-Host "• Run crisis tests: npm run test:crisis" -ForegroundColor White
    Write-Host "• View logs: Get-Content logs\setup-*.log" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 AVAILABLE TEST COMMANDS:" -ForegroundColor Yellow
    Write-Host "• npm run test:e2e:critical - Critical user journeys" -ForegroundColor White
    Write-Host "• npm run test:crisis - Crisis support features" -ForegroundColor White
    Write-Host "• npm run test:privacy - Privacy and security tests" -ForegroundColor White
    Write-Host "• npm run test:offline - Offline functionality tests" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Synthetic monitoring: http://localhost:3000/monitoring" -ForegroundColor Cyan
    Write-Host "📈 Test reports: ./playwright-report/index.html" -ForegroundColor Cyan
}

# Main execution
try {
    Write-LogEntry "🚀 Starting Second Chance automation setup..."
    
    if (!(Test-NodeInstallation)) {
        throw "Node.js installation required"
    }
    
    Initialize-Directories
    Setup-EnvironmentConfig
    Install-Dependencies
    Setup-GitHooks
    Generate-RunScripts
    
    if (Test-Installation) {
        Show-Summary
        Write-LogEntry "✅ Setup completed successfully!" "SUCCESS"
    } else {
        Write-LogEntry "⚠️ Setup completed with warnings. Check logs for details." "WARN"
    }
    
} catch {
    Write-LogEntry "❌ Setup failed: $($_.Exception.Message)" "ERROR"
    Write-Host "❌ Setup failed. Check logs for details." -ForegroundColor Red
    exit 1
}