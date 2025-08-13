# Second Chance Recovery App - Test Automation Script
# Comprehensive testing with crisis support focus

param(
    [string]$TestType = "all",
    [switch]$CI,
    [switch]$Coverage,
    [switch]$Verbose,
    [switch]$CrisisOnly,
    [switch]$PrivacyOnly,
    [switch]$OfflineOnly,
    [switch]$NoRetry,
    [string]$Browser = "chromium",
    [string]$Device = "desktop"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogsPath = Join-Path $ProjectRoot "logs"
$TestResultsPath = Join-Path $ProjectRoot "test-results"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "🏥 SECOND CHANCE - TEST AUTOMATION" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Ensure logs directory exists
if (!(Test-Path $LogsPath)) {
    New-Item -ItemType Directory -Path $LogsPath -Force | Out-Null
}

function Write-TestLog {
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
        "CRITICAL" { Write-Host $LogEntry -ForegroundColor Magenta }
        default { Write-Host $LogEntry -ForegroundColor White }
    }
    
    $LogFile = Join-Path $LogsPath "test-automation-$(Get-Date -Format 'yyyy-MM-dd').log"
    Add-Content -Path $LogFile -Value $LogEntry
}

function Test-Prerequisites {
    Write-TestLog "🔍 Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        Write-TestLog "✅ Node.js version: $nodeVersion"
    } catch {
        Write-TestLog "❌ Node.js not found" "ERROR"
        return $false
    }
    
    # Check npm dependencies
    if (!(Test-Path (Join-Path $ProjectRoot "node_modules"))) {
        Write-TestLog "❌ Dependencies not installed. Run setup-automation.ps1 first." "ERROR"
        return $false
    }
    
    # Check Playwright browsers
    try {
        npx playwright --version | Out-Null
        Write-TestLog "✅ Playwright available"
    } catch {
        Write-TestLog "❌ Playwright not properly installed" "ERROR"
        return $false
    }
    
    return $true
}

function Start-DevServer {
    Write-TestLog "🚀 Starting development server..."
    
    Push-Location $ProjectRoot
    try {
        # Check if server is already running
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
            Write-TestLog "✅ Development server already running"
            return $true
        } catch {
            # Server not running, start it
        }
        
        # Start server in background
        $serverJob = Start-Job -ScriptBlock {
            Set-Location $using:ProjectRoot
            npm run dev
        }
        
        # Wait for server to start
        $maxAttempts = 30
        $attempt = 0
        
        do {
            Start-Sleep -Seconds 2
            $attempt++
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
                Write-TestLog "✅ Development server started successfully"
                return $serverJob
            } catch {
                if ($attempt -ge $maxAttempts) {
                    Write-TestLog "❌ Failed to start development server after $maxAttempts attempts" "ERROR"
                    Stop-Job $serverJob -Force
                    Remove-Job $serverJob -Force
                    return $false
                }
            }
        } while ($true)
        
    } finally {
        Pop-Location
    }
}

function Run-UnitTests {
    Write-TestLog "🧪 Running unit tests..."
    
    Push-Location $ProjectRoot
    try {
        $command = if ($Coverage) { "test:coverage" } else { "test:run" }
        
        npm run $command
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Unit tests passed" "SUCCESS"
            return $true
        } else {
            Write-TestLog "❌ Unit tests failed" "ERROR"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Run-TypeChecking {
    Write-TestLog "📝 Running TypeScript type checking..."
    
    Push-Location $ProjectRoot
    try {
        npm run typecheck
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Type checking passed" "SUCCESS"
            return $true
        } else {
            Write-TestLog "❌ Type checking failed" "ERROR"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Run-Linting {
    Write-TestLog "🔍 Running ESLint..."
    
    Push-Location $ProjectRoot
    try {
        npm run lint
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Linting passed" "SUCCESS"
            return $true
        } else {
            Write-TestLog "⚠️ Linting issues found" "WARN"
            return $true  # Don't fail build on linting issues
        }
    } finally {
        Pop-Location
    }
}

function Run-CrisisTests {
    Write-TestLog "🚨 Running crisis support tests..." "CRITICAL"
    
    Push-Location $ProjectRoot
    try {
        $playwrightArgs = @(
            "npx", "playwright", "test",
            "tests/e2e/01-crisis-support.e2e.ts",
            "--project=$Browser"
        )
        
        if ($CI) {
            $playwrightArgs += "--reporter=html,json,junit"
        }
        
        if (!$NoRetry) {
            $playwrightArgs += "--retries=2"
        }
        
        & $playwrightArgs[0] @($playwrightArgs[1..($playwrightArgs.Length-1)])
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Crisis support tests passed" "SUCCESS"
            return $true
        } else {
            Write-TestLog "❌ Crisis support tests failed - CRITICAL ISSUE!" "CRITICAL"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Run-PrivacyTests {
    Write-TestLog "🔒 Running privacy and authentication tests..."
    
    Push-Location $ProjectRoot
    try {
        $playwrightArgs = @(
            "npx", "playwright", "test",
            "tests/e2e/02-user-auth.e2e.ts",
            "--project=$Browser"
        )
        
        if ($CI) {
            $playwrightArgs += "--reporter=html,json,junit"
        }
        
        & $playwrightArgs[0] @($playwrightArgs[1..($playwrightArgs.Length-1)])
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Privacy tests passed" "SUCCESS"
            return $true
        } else {
            Write-TestLog "❌ Privacy tests failed" "ERROR"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Run-RecoveryTests {
    Write-TestLog "💚 Running recovery tracking tests..."
    
    Push-Location $ProjectRoot
    try {
        $playwrightArgs = @(
            "npx", "playwright", "test",
            "tests/e2e/03-recovery-tracking.e2e.ts",
            "--project=$Browser"
        )
        
        if ($CI) {
            $playwrightArgs += "--reporter=html,json,junit"
        }
        
        & $playwrightArgs[0] @($playwrightArgs[1..($playwrightArgs.Length-1)])
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Recovery tracking tests passed" "SUCCESS"
            return $true
        } else {
            Write-TestLog "❌ Recovery tracking tests failed" "ERROR"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Run-OfflineTests {
    Write-TestLog "📱 Running offline functionality tests..."
    
    Push-Location $ProjectRoot
    try {
        $playwrightArgs = @(
            "npx", "playwright", "test",
            "tests/offline/",
            "--project=$Browser"
        )
        
        if ($CI) {
            $playwrightArgs += "--reporter=html,json,junit"
        }
        
        & $playwrightArgs[0] @($playwrightArgs[1..($playwrightArgs.Length-1)])
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Offline tests passed" "SUCCESS"
            return $true
        } else {
            Write-TestLog "❌ Offline tests failed" "ERROR"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Run-MobileTests {
    Write-TestLog "📱 Running mobile-specific tests..."
    
    Push-Location $ProjectRoot
    try {
        npm run test:e2e:mobile
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Mobile tests passed" "SUCCESS"
            return $true
        } else {
            Write-TestLog "❌ Mobile tests failed" "ERROR"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Run-PerformanceTests {
    Write-TestLog "⚡ Running performance tests..."
    
    Push-Location $ProjectRoot
    try {
        npm run test:performance
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✅ Performance tests passed" "SUCCESS"
            return $true
        } else {
            Write-TestLog "⚠️ Performance issues detected" "WARN"
            return $true  # Don't fail build on performance issues
        }
    } finally {
        Pop-Location
    }
}

function Generate-TestReport {
    Write-TestLog "📊 Generating test report..."
    
    $reportData = @{
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        testType = $TestType
        browser = $Browser
        device = $Device
        environment = if ($CI) { "CI" } else { "Local" }
        results = @{}
    }
    
    # Collect test results from various sources
    $reportsDir = Join-Path $ProjectRoot "test-results"
    if (Test-Path $reportsDir) {
        $reportFiles = Get-ChildItem -Path $reportsDir -Filter "*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
        
        foreach ($file in $reportFiles) {
            try {
                $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
                $reportData.results[$file.BaseName] = $content
            } catch {
                Write-TestLog "⚠️ Could not parse report file: $($file.Name)" "WARN"
            }
        }
    }
    
    # Save consolidated report
    $consolidatedReport = Join-Path $LogsPath "test-report-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').json"
    $reportData | ConvertTo-Json -Depth 10 | Set-Content -Path $consolidatedReport
    
    Write-TestLog "📄 Test report saved: $consolidatedReport"
}

function Show-TestSummary {
    param([hashtable]$Results)
    
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "📊 TEST EXECUTION SUMMARY" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    
    $totalTests = 0
    $passedTests = 0
    $criticalFailures = 0
    
    foreach ($test in $Results.Keys) {
        $status = if ($Results[$test]) { "✅ PASSED" } else { "❌ FAILED" }
        $color = if ($Results[$test]) { "Green" } else { "Red" }
        
        Write-Host "$test : $status" -ForegroundColor $color
        
        $totalTests++
        if ($Results[$test]) { $passedTests++ }
        if ($test -eq "Crisis Tests" -and !$Results[$test]) { $criticalFailures++ }
    }
    
    Write-Host ""
    Write-Host "Total Tests: $totalTests" -ForegroundColor White
    Write-Host "Passed: $passedTests" -ForegroundColor Green
    Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor Red
    
    if ($criticalFailures -gt 0) {
        Write-Host ""
        Write-Host "🚨 CRITICAL FAILURES DETECTED!" -ForegroundColor Magenta
        Write-Host "Crisis support features are not working properly!" -ForegroundColor Magenta
    }
    
    Write-Host ""
    Write-Host "📈 Reports available in:" -ForegroundColor Cyan
    Write-Host "• Playwright: ./playwright-report/index.html" -ForegroundColor White
    Write-Host "• Coverage: ./coverage/index.html" -ForegroundColor White
    Write-Host "• Logs: ./logs/" -ForegroundColor White
}

# Main execution
try {
    Write-TestLog "🚀 Starting Second Chance test automation..."
    Write-TestLog "Test Type: $TestType, Browser: $Browser, Device: $Device"
    
    if (!(Test-Prerequisites)) {
        throw "Prerequisites not met"
    }
    
    $serverJob = $null
    if (!$CI) {
        $serverJob = Start-DevServer
        if (!$serverJob) {
            throw "Failed to start development server"
        }
    }
    
    $testResults = @{}
    
    try {
        # Run tests based on parameters
        if ($CrisisOnly) {
            $testResults["Crisis Tests"] = Run-CrisisTests
        } elseif ($PrivacyOnly) {
            $testResults["Privacy Tests"] = Run-PrivacyTests
        } elseif ($OfflineOnly) {
            $testResults["Offline Tests"] = Run-OfflineTests
        } else {
            # Run comprehensive test suite
            switch ($TestType.ToLower()) {
                "unit" {
                    $testResults["Unit Tests"] = Run-UnitTests
                }
                "e2e" {
                    $testResults["Crisis Tests"] = Run-CrisisTests
                    $testResults["Privacy Tests"] = Run-PrivacyTests
                    $testResults["Recovery Tests"] = Run-RecoveryTests
                }
                "mobile" {
                    $testResults["Crisis Tests"] = Run-CrisisTests
                    $testResults["Mobile Tests"] = Run-MobileTests
                }
                "performance" {
                    $testResults["Performance Tests"] = Run-PerformanceTests
                }
                default {
                    # Run all tests
                    $testResults["Type Checking"] = Run-TypeChecking
                    $testResults["Linting"] = Run-Linting
                    $testResults["Unit Tests"] = Run-UnitTests
                    $testResults["Crisis Tests"] = Run-CrisisTests
                    $testResults["Privacy Tests"] = Run-PrivacyTests
                    $testResults["Recovery Tests"] = Run-RecoveryTests
                    if (!$CI) {
                        $testResults["Offline Tests"] = Run-OfflineTests
                        $testResults["Performance Tests"] = Run-PerformanceTests
                    }
                }
            }
        }
        
        Generate-TestReport
        Show-TestSummary -Results $testResults
        
        # Determine overall success
        $allPassed = $testResults.Values -notcontains $false
        $criticalPassed = $testResults["Crisis Tests"] -ne $false
        
        if (!$criticalPassed) {
            Write-TestLog "❌ CRITICAL: Crisis support tests failed!" "CRITICAL"
            exit 2  # Special exit code for critical failures
        } elseif (!$allPassed) {
            Write-TestLog "⚠️ Some tests failed, but crisis support is working" "WARN"
            exit 1
        } else {
            Write-TestLog "✅ All tests passed successfully!" "SUCCESS"
            exit 0
        }
        
    } finally {
        # Cleanup
        if ($serverJob) {
            Write-TestLog "🛑 Stopping development server..."
            Stop-Job $serverJob -Force -ErrorAction SilentlyContinue
            Remove-Job $serverJob -Force -ErrorAction SilentlyContinue
        }
    }
    
} catch {
    Write-TestLog "❌ Test automation failed: $($_.Exception.Message)" "ERROR"
    Write-Host "❌ Test automation failed. Check logs for details." -ForegroundColor Red
    exit 1
}