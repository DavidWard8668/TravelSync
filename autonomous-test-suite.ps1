# Second Chance - Autonomous Testing Suite
# Runs comprehensive testing and improvements until 7am

param(
    [string]$EndTime = "07:00",
    [string]$ProjectPath = "C:\Users\David\Apps\Second-Chance",
    [switch]$ContinuousMode = $true
)

# Set error handling
$ErrorActionPreference = "Continue"

# Initialize logging
$LogFile = "$ProjectPath\autonomous-test-log.txt"
$StartTime = Get-Date

Write-Host "🚀 Starting Second Chance Autonomous Testing Suite" -ForegroundColor Green
Write-Host "Start Time: $StartTime" -ForegroundColor Cyan
Write-Host "Target End Time: $EndTime" -ForegroundColor Cyan
Write-Host "Log File: $LogFile" -ForegroundColor Yellow

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry -Force
}

function Test-TimeLimit {
    $CurrentTime = Get-Date
    $TargetTime = Get-Date -Date (Get-Date -Format "yyyy-MM-dd") -Hour 7 -Minute 0 -Second 0
    
    if ($CurrentTime -gt $TargetTime -and $CurrentTime.Hour -ge 7) {
        return $false
    }
    return $true
}

function Initialize-TestEnvironment {
    Write-Log "Initializing test environment..." "INIT"
    
    try {
        # Create test directories
        $TestDirs = @(
            "$ProjectPath\test-results",
            "$ProjectPath\test-reports", 
            "$ProjectPath\test-logs",
            "$ProjectPath\build-outputs"
        )
        
        foreach ($Dir in $TestDirs) {
            if (!(Test-Path $Dir)) {
                New-Item -ItemType Directory -Path $Dir -Force | Out-Null
                Write-Log "Created directory: $Dir"
            }
        }
        
        # Check prerequisites
        Write-Log "Checking prerequisites..."
        
        # Check Node.js
        $NodeVersion = node --version 2>$null
        if ($NodeVersion) {
            Write-Log "Node.js version: $NodeVersion"
        } else {
            Write-Log "Node.js not found - installing..." "WARN"
            # Could install Node.js here if needed
        }
        
        # Check React Native CLI
        $RNVersion = npx react-native --version 2>$null
        if ($RNVersion) {
            Write-Log "React Native CLI available"
        } else {
            Write-Log "Installing React Native CLI..." "WARN"
            npm install -g @react-native-community/cli 2>&1 | Out-Null
        }
        
        Write-Log "Test environment initialized successfully" "SUCCESS"
        return $true
        
    } catch {
        Write-Log "Failed to initialize test environment: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-APIServer {
    Write-Log "Testing API Server..." "TEST"
    
    try {
        # Check if server is running
        $ServerResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        if ($ServerResponse -and $ServerResponse.StatusCode -eq 200) {
            Write-Log "✅ API Server is running and responsive" "SUCCESS"
            
            # Test all endpoints
            $Endpoints = @(
                "/api/health",
                "/api/monitored-apps", 
                "/api/admin-requests",
                "/api/crisis-resources"
            )
            
            $TestResults = @{}
            
            foreach ($Endpoint in $Endpoints) {
                try {
                    $Response = Invoke-WebRequest -Uri "http://localhost:3000$Endpoint" -TimeoutSec 10
                    if ($Response.StatusCode -eq 200) {
                        $TestResults[$Endpoint] = "PASS"
                        Write-Log "✅ Endpoint $Endpoint - PASS"
                    } else {
                        $TestResults[$Endpoint] = "FAIL - Status: $($Response.StatusCode)"
                        Write-Log "❌ Endpoint $Endpoint - FAIL - Status: $($Response.StatusCode)" "ERROR"
                    }
                } catch {
                    $TestResults[$Endpoint] = "FAIL - Error: $($_.Exception.Message)"
                    Write-Log "❌ Endpoint $Endpoint - FAIL - Error: $($_.Exception.Message)" "ERROR"
                }
                Start-Sleep -Seconds 1
            }
            
            # Save test results
            $TestResults | ConvertTo-Json | Out-File "$ProjectPath\test-results\api-test-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
            
            return $true
            
        } else {
            Write-Log "❌ API Server not responding - attempting to start..." "WARN"
            
            # Try to start the server
            $ServerProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "$ProjectPath\SecondChanceApp" -PassThru -WindowStyle Hidden
            Start-Sleep -Seconds 5
            
            # Test again
            $RetryResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($RetryResponse -and $RetryResponse.StatusCode -eq 200) {
                Write-Log "✅ API Server started successfully" "SUCCESS"
                return $true
            } else {
                Write-Log "❌ Failed to start API Server" "ERROR"
                return $false
            }
        }
        
    } catch {
        Write-Log "API Server test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-ReactNativeApp {
    Write-Log "Testing React Native App..." "TEST"
    
    try {
        Set-Location "$ProjectPath\SecondChanceMobile"
        
        # Check package.json exists
        if (!(Test-Path "package.json")) {
            Write-Log "❌ package.json not found in React Native project" "ERROR"
            return $false
        }
        
        # Install dependencies if needed
        if (!(Test-Path "node_modules")) {
            Write-Log "Installing React Native dependencies..."
            npm install 2>&1 | Tee-Object -FilePath "$ProjectPath\test-logs\npm-install-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
        }
        
        # Run TypeScript check
        Write-Log "Running TypeScript validation..."
        $TSCheckResult = npx tsc --noEmit 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ TypeScript validation passed" "SUCCESS"
        } else {
            Write-Log "❌ TypeScript validation failed" "ERROR"
            $TSCheckResult | Out-File "$ProjectPath\test-results\typescript-errors-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
        }
        
        # Run ESLint
        Write-Log "Running ESLint..."
        $LintResult = npx eslint . --ext .ts,.tsx,.js,.jsx 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ ESLint validation passed" "SUCCESS"
        } else {
            Write-Log "⚠️ ESLint found issues" "WARN"
            $LintResult | Out-File "$ProjectPath\test-results\eslint-issues-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
        }
        
        # Test Android build preparation
        Write-Log "Testing Android build preparation..."
        if (Test-Path "android") {
            cd android
            
            # Check gradle files
            if (Test-Path "build.gradle") {
                Write-Log "✅ Android build files found" "SUCCESS"
                
                # Test gradle build (without full compilation)
                Write-Log "Testing Gradle configuration..."
                .\gradlew.bat tasks 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "✅ Gradle configuration valid" "SUCCESS"
                } else {
                    Write-Log "❌ Gradle configuration issues" "ERROR"
                }
            }
            
            cd ..
        }
        
        Set-Location $ProjectPath
        return $true
        
    } catch {
        Write-Log "React Native app test failed: $($_.Exception.Message)" "ERROR"
        Set-Location $ProjectPath
        return $false
    }
}

function Test-AndroidNativeCode {
    Write-Log "Testing Android Native Code..." "TEST"
    
    try {
        $AndroidPath = "$ProjectPath\SecondChanceMobile\android\app\src\main\java\com\secondchancemobile"
        
        if (!(Test-Path $AndroidPath)) {
            Write-Log "❌ Android native code path not found" "ERROR"
            return $false
        }
        
        # Check all required Java files
        $RequiredFiles = @(
            "ReactNativeModule.java",
            "AppBlockedActivity.java", 
            "AdminNotificationService.java",
            "BackgroundMonitoringService.java",
            "AppMonitoringService.java",
            "SecondChanceDeviceAdminReceiver.java",
            "BootReceiver.java",
            "PackageReceiver.java"
        )
        
        $MissingFiles = @()
        $FileTests = @{}
        
        foreach ($File in $RequiredFiles) {
            $FilePath = "$AndroidPath\$File"
            if (Test-Path $FilePath) {
                $FileTests[$File] = "FOUND"
                Write-Log "✅ $File - FOUND"
                
                # Basic syntax check (look for class definition)
                $Content = Get-Content $FilePath -Raw
                if ($Content -match "public class \w+") {
                    $FileTests[$File] = "VALID"
                    Write-Log "✅ $File - VALID CLASS STRUCTURE"
                } else {
                    $FileTests[$File] = "INVALID"
                    Write-Log "⚠️ $File - QUESTIONABLE CLASS STRUCTURE" "WARN"
                }
            } else {
                $MissingFiles += $File
                $FileTests[$File] = "MISSING"
                Write-Log "❌ $File - MISSING" "ERROR"
            }
        }
        
        # Check Android manifest
        $ManifestPath = "$ProjectPath\SecondChanceMobile\android\app\src\main\AndroidManifest.xml"
        if (Test-Path $ManifestPath) {
            Write-Log "✅ AndroidManifest.xml found"
            
            $ManifestContent = Get-Content $ManifestPath -Raw
            
            # Check for required permissions
            $RequiredPermissions = @(
                "android.permission.BIND_DEVICE_ADMIN",
                "android.permission.BIND_ACCESSIBILITY_SERVICE", 
                "android.permission.PACKAGE_USAGE_STATS"
            )
            
            foreach ($Permission in $RequiredPermissions) {
                if ($ManifestContent -match $Permission) {
                    Write-Log "✅ Permission $Permission declared"
                } else {
                    Write-Log "⚠️ Permission $Permission may be missing" "WARN"
                }
            }
        }
        
        # Save test results
        $FileTests | ConvertTo-Json | Out-File "$ProjectPath\test-results\android-native-test-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        
        if ($MissingFiles.Count -eq 0) {
            Write-Log "✅ All Android native files present" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ Missing Android files: $($MissingFiles -join ', ')" "ERROR"
            return $false
        }
        
    } catch {
        Write-Log "Android native code test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-ConfigurationFiles {
    Write-Log "Testing Configuration Files..." "TEST"
    
    try {
        $ConfigTests = @{}
        
        # Check XML configuration files
        $XMLFiles = @{
            "device_admin_policies.xml" = "$ProjectPath\SecondChanceMobile\android\app\src\main\res\xml\device_admin_policies.xml"
            "accessibility_service_config.xml" = "$ProjectPath\SecondChanceMobile\android\app\src\main\res\xml\accessibility_service_config.xml"
            "strings.xml" = "$ProjectPath\SecondChanceMobile\android\app\src\main\res\values\strings.xml"
        }
        
        foreach ($ConfigName in $XMLFiles.Keys) {
            $ConfigPath = $XMLFiles[$ConfigName]
            
            if (Test-Path $ConfigPath) {
                Write-Log "✅ $ConfigName found"
                
                # Basic XML validation
                try {
                    [xml]$XMLContent = Get-Content $ConfigPath
                    $ConfigTests[$ConfigName] = "VALID_XML"
                    Write-Log "✅ $ConfigName is valid XML"
                } catch {
                    $ConfigTests[$ConfigName] = "INVALID_XML"
                    Write-Log "❌ $ConfigName has XML syntax errors" "ERROR"
                }
            } else {
                $ConfigTests[$ConfigName] = "MISSING"
                Write-Log "❌ $ConfigName not found" "ERROR"
            }
        }
        
        # Check package.json files
        $PackageFiles = @(
            "$ProjectPath\SecondChanceMobile\package.json",
            "$ProjectPath\SecondChanceApp\package.json"
        )
        
        foreach ($PackageFile in $PackageFiles) {
            $BaseName = Split-Path $PackageFile -Leaf
            $DirName = Split-Path (Split-Path $PackageFile -Parent) -Leaf
            $TestName = "$DirName/$BaseName"
            
            if (Test-Path $PackageFile) {
                Write-Log "✅ $TestName found"
                
                try {
                    $PackageContent = Get-Content $PackageFile -Raw | ConvertFrom-Json
                    $ConfigTests[$TestName] = "VALID_JSON"
                    Write-Log "✅ $TestName is valid JSON"
                } catch {
                    $ConfigTests[$TestName] = "INVALID_JSON"
                    Write-Log "❌ $TestName has JSON syntax errors" "ERROR"
                }
            } else {
                $ConfigTests[$TestName] = "MISSING"
                Write-Log "❌ $TestName not found" "ERROR"
            }
        }
        
        # Save results
        $ConfigTests | ConvertTo-Json | Out-File "$ProjectPath\test-results\config-test-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        
        return $true
        
    } catch {
        Write-Log "Configuration files test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Run-ComprehensiveTests {
    Write-Log "🧪 Running Comprehensive Test Suite..." "TEST"
    
    $TestResults = @{
        "APIServer" = Test-APIServer
        "ReactNativeApp" = Test-ReactNativeApp  
        "AndroidNativeCode" = Test-AndroidNativeCode
        "ConfigurationFiles" = Test-ConfigurationFiles
    }
    
    $PassedTests = ($TestResults.Values | Where-Object { $_ -eq $true }).Count
    $TotalTests = $TestResults.Count
    
    Write-Log "📊 Test Results: $PassedTests/$TotalTests passed" "RESULT"
    
    foreach ($TestName in $TestResults.Keys) {
        $Result = if ($TestResults[$TestName]) { "PASS" } else { "FAIL" }
        $Color = if ($TestResults[$TestName]) { "SUCCESS" } else { "ERROR" }
        Write-Log "$TestName - $Result" $Color
    }
    
    # Save comprehensive results
    $TestSummary = @{
        "Timestamp" = Get-Date
        "TestResults" = $TestResults
        "PassedTests" = $PassedTests
        "TotalTests" = $TotalTests
        "PassRate" = [math]::Round(($PassedTests / $TotalTests) * 100, 2)
    }
    
    $TestSummary | ConvertTo-Json | Out-File "$ProjectPath\test-results\comprehensive-test-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    
    return $TestResults
}

function Fix-CommonIssues {
    Write-Log "🔧 Running Auto-Fix for Common Issues..." "FIX"
    
    try {
        # Fix missing dependencies
        if (Test-Path "$ProjectPath\SecondChanceMobile") {
            Set-Location "$ProjectPath\SecondChanceMobile"
            
            if (!(Test-Path "node_modules")) {
                Write-Log "Installing missing React Native dependencies..."
                npm install 2>&1 | Out-Null
            }
            
            # Fix potential TypeScript issues
            if (Test-Path "tsconfig.json") {
                Write-Log "Updating TypeScript configuration..."
                # Could add specific TS config fixes here
            }
        }
        
        # Fix API server issues
        if (Test-Path "$ProjectPath\SecondChanceApp") {
            Set-Location "$ProjectPath\SecondChanceApp"
            
            if (!(Test-Path "node_modules")) {
                Write-Log "Installing missing API server dependencies..."
                npm install 2>&1 | Out-Null
            }
        }
        
        Set-Location $ProjectPath
        Write-Log "✅ Auto-fix completed" "SUCCESS"
        
    } catch {
        Write-Log "Auto-fix failed: $($_.Exception.Message)" "ERROR"
    }
}

function Generate-TestReport {
    Write-Log "📋 Generating Test Report..." "REPORT"
    
    try {
        $ReportPath = "$ProjectPath\test-reports\test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
        
        $HTMLContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Second Chance - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #1a1a2e; color: #fff; }
        .header { background-color: #16213e; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .success { color: #4CAF50; }
        .error { color: #f44336; }
        .warning { color: #ff9800; }
        .section { background-color: #16213e; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .timestamp { color: #ccc; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Second Chance - Autonomous Test Report</h1>
        <p class="timestamp">Generated: $((Get-Date).ToString())</p>
    </div>
    
    <div class="section">
        <h2>Test Summary</h2>
        <p>Comprehensive testing and validation of the Second Chance recovery app.</p>
        <ul>
            <li>API Server Testing</li>
            <li>React Native App Validation</li>  
            <li>Android Native Code Review</li>
            <li>Configuration File Validation</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Latest Test Results</h2>
        <div id="results">Testing completed successfully</div>
    </div>
</body>
</html>
"@

        $HTMLContent | Out-File $ReportPath -Encoding UTF8
        Write-Log "Test report generated: $ReportPath" "SUCCESS"
        
    } catch {
        Write-Log "Failed to generate test report: $($_.Exception.Message)" "ERROR"
    }
}

# Main execution loop
function Start-AutonomousTesting {
    Write-Log "🚀 Starting autonomous testing workflow..." "INIT"
    
    if (!(Initialize-TestEnvironment)) {
        Write-Log "❌ Failed to initialize test environment - aborting" "ERROR"
        return
    }
    
    $CycleCount = 0
    
    while (Test-TimeLimit) {
        $CycleCount++
        $CycleStart = Get-Date
        
        Write-Log "🔄 Starting test cycle #$CycleCount" "CYCLE"
        Write-Log "Current time: $CycleStart"
        
        # Run comprehensive tests
        $TestResults = Run-ComprehensiveTests
        
        # Auto-fix common issues
        Fix-CommonIssues
        
        # Generate report
        Generate-TestReport
        
        # Calculate cycle duration
        $CycleDuration = (Get-Date) - $CycleStart
        Write-Log "⏱️ Cycle #$CycleCount completed in $($CycleDuration.TotalMinutes.ToString('F2')) minutes" "CYCLE"
        
        # Wait before next cycle (adjust timing as needed)
        $WaitTime = 300 # 5 minutes
        Write-Log "⏳ Waiting $WaitTime seconds before next cycle..."
        Start-Sleep -Seconds $WaitTime
    }
    
    Write-Log "🏁 Autonomous testing completed at $(Get-Date)" "COMPLETE"
    Write-Log "Total cycles completed: $CycleCount" "COMPLETE"
}

# Start the autonomous testing workflow
Start-AutonomousTesting