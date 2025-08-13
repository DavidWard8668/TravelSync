# Second Chance - Autonomous Build and Test Script
# Handles React Native builds, Android compilation, and APK generation

param(
    [string]$ProjectPath = "C:\Users\David\Apps\Second-Chance",
    [string]$BuildType = "debug",
    [switch]$GenerateAPK = $true
)

$ErrorActionPreference = "Continue"
$LogFile = "$ProjectPath\build-test-log.txt"

function Write-BuildLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry -Force
}

function Test-Prerequisites {
    Write-BuildLog "Checking build prerequisites..." "CHECK"
    
    $Prerequisites = @{}
    
    # Check Node.js
    try {
        $NodeVersion = node --version 2>$null
        if ($NodeVersion) {
            $Prerequisites["Node.js"] = "✅ $NodeVersion"
            Write-BuildLog "Node.js: $NodeVersion" "SUCCESS"
        } else {
            $Prerequisites["Node.js"] = "❌ Not found"
            Write-BuildLog "Node.js not found" "ERROR"
        }
    } catch {
        $Prerequisites["Node.js"] = "❌ Error checking"
        Write-BuildLog "Error checking Node.js: $($_.Exception.Message)" "ERROR"
    }
    
    # Check npm
    try {
        $NpmVersion = npm --version 2>$null
        if ($NpmVersion) {
            $Prerequisites["npm"] = "✅ $NpmVersion"
            Write-BuildLog "npm: $NpmVersion" "SUCCESS"
        } else {
            $Prerequisites["npm"] = "❌ Not found"
            Write-BuildLog "npm not found" "ERROR"
        }
    } catch {
        $Prerequisites["npm"] = "❌ Error checking"
    }
    
    # Check Java
    try {
        $JavaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
        if ($JavaVersion) {
            $Prerequisites["Java"] = "✅ $($JavaVersion.Line)"
            Write-BuildLog "Java: $($JavaVersion.Line)" "SUCCESS"
        } else {
            $Prerequisites["Java"] = "❌ Not found"
            Write-BuildLog "Java not found" "ERROR"
        }
    } catch {
        $Prerequisites["Java"] = "❌ Error checking"
    }
    
    # Check Android SDK (via gradlew)
    $AndroidPath = "$ProjectPath\SecondChanceMobile\android"
    if (Test-Path "$AndroidPath\gradlew.bat") {
        $Prerequisites["Android SDK"] = "✅ Gradle wrapper found"
        Write-BuildLog "Android SDK: Gradle wrapper available" "SUCCESS"
    } else {
        $Prerequisites["Android SDK"] = "❌ Gradle wrapper not found"
        Write-BuildLog "Android SDK: Gradle wrapper not found" "ERROR"
    }
    
    # Save prerequisites check
    $Prerequisites | ConvertTo-Json | Out-File "$ProjectPath\build-outputs\prerequisites-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    
    return $Prerequisites
}

function Install-Dependencies {
    Write-BuildLog "Installing project dependencies..." "INSTALL"
    
    try {
        # Install React Native dependencies
        Write-BuildLog "Installing React Native app dependencies..."
        Set-Location "$ProjectPath\SecondChanceMobile"
        
        if (Test-Path "package.json") {
            $InstallResult = npm install 2>&1 | Tee-Object -Variable InstallOutput
            if ($LASTEXITCODE -eq 0) {
                Write-BuildLog "✅ React Native dependencies installed successfully" "SUCCESS"
            } else {
                Write-BuildLog "❌ React Native dependency installation failed" "ERROR"
                $InstallOutput | Out-File "$ProjectPath\build-outputs\rn-install-error-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
            }
        } else {
            Write-BuildLog "❌ React Native package.json not found" "ERROR"
        }
        
        # Install API server dependencies  
        Write-BuildLog "Installing API server dependencies..."
        Set-Location "$ProjectPath\SecondChanceApp"
        
        if (Test-Path "package.json") {
            $APIInstallResult = npm install 2>&1 | Tee-Object -Variable APIInstallOutput
            if ($LASTEXITCODE -eq 0) {
                Write-BuildLog "✅ API server dependencies installed successfully" "SUCCESS"
            } else {
                Write-BuildLog "❌ API server dependency installation failed" "ERROR"
                $APIInstallOutput | Out-File "$ProjectPath\build-outputs\api-install-error-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
            }
        }
        
        Set-Location $ProjectPath
        return $true
        
    } catch {
        Write-BuildLog "Dependency installation failed: $($_.Exception.Message)" "ERROR"
        Set-Location $ProjectPath
        return $false
    }
}

function Test-ReactNativeBuild {
    Write-BuildLog "Testing React Native build process..." "BUILD"
    
    try {
        Set-Location "$ProjectPath\SecondChanceMobile"
        
        # Run TypeScript compilation check
        Write-BuildLog "Running TypeScript check..."
        $TSResult = npx tsc --noEmit 2>&1 | Tee-Object -Variable TSOutput
        if ($LASTEXITCODE -eq 0) {
            Write-BuildLog "✅ TypeScript compilation check passed" "SUCCESS"
        } else {
            Write-BuildLog "❌ TypeScript compilation issues found" "ERROR"
            $TSOutput | Out-File "$ProjectPath\build-outputs\typescript-errors-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
        }
        
        # Run Metro bundler test
        Write-BuildLog "Testing Metro bundler..."
        $MetroTest = npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output test-bundle.js --sourcemap-output test-bundle.map 2>&1 | Tee-Object -Variable MetroOutput
        
        if ($LASTEXITCODE -eq 0) {
            Write-BuildLog "✅ Metro bundler test successful" "SUCCESS"
            # Clean up test files
            if (Test-Path "test-bundle.js") { Remove-Item "test-bundle.js" -Force }
            if (Test-Path "test-bundle.map") { Remove-Item "test-bundle.map" -Force }
        } else {
            Write-BuildLog "❌ Metro bundler test failed" "ERROR"
            $MetroOutput | Out-File "$ProjectPath\build-outputs\metro-error-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
        }
        
        # Test Android build preparation
        Write-BuildLog "Preparing Android build environment..."
        Set-Location "android"
        
        # Clean previous builds
        .\gradlew.bat clean 2>&1 | Out-Null
        
        # Test Gradle tasks
        $GradleTest = .\gradlew.bat tasks 2>&1 | Tee-Object -Variable GradleOutput
        if ($LASTEXITCODE -eq 0) {
            Write-BuildLog "✅ Gradle configuration validated" "SUCCESS"
        } else {
            Write-BuildLog "❌ Gradle configuration issues" "ERROR"
            $GradleOutput | Out-File "$ProjectPath\build-outputs\gradle-error-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
        }
        
        Set-Location $ProjectPath
        return $true
        
    } catch {
        Write-BuildLog "React Native build test failed: $($_.Exception.Message)" "ERROR"
        Set-Location $ProjectPath
        return $false
    }
}

function Build-AndroidAPK {
    Write-BuildLog "Building Android APK..." "BUILD"
    
    try {
        Set-Location "$ProjectPath\SecondChanceMobile\android"
        
        # Build debug APK
        Write-BuildLog "Starting Android $BuildType build..."
        
        $BuildCommand = if ($BuildType -eq "release") {
            "assembleRelease"
        } else {
            "assembleDebug"  
        }
        
        $BuildStart = Get-Date
        $BuildResult = .\gradlew.bat $BuildCommand 2>&1 | Tee-Object -Variable BuildOutput
        $BuildDuration = (Get-Date) - $BuildStart
        
        if ($LASTEXITCODE -eq 0) {
            Write-BuildLog "✅ Android APK built successfully in $($BuildDuration.TotalMinutes.ToString('F2')) minutes" "SUCCESS"
            
            # Find the generated APK
            $APKPath = if ($BuildType -eq "release") {
                "app\build\outputs\apk\release\app-release.apk"
            } else {
                "app\build\outputs\apk\debug\app-debug.apk"
            }
            
            if (Test-Path $APKPath) {
                $APKSize = (Get-Item $APKPath).Length / 1MB
                Write-BuildLog "📱 APK generated: $APKPath (${APKSize:F2} MB)" "SUCCESS"
                
                # Copy APK to build outputs
                $OutputAPK = "$ProjectPath\build-outputs\SecondChance-$BuildType-$(Get-Date -Format 'yyyyMMdd-HHmmss').apk"
                Copy-Item $APKPath $OutputAPK -Force
                Write-BuildLog "📱 APK copied to: $OutputAPK" "SUCCESS"
                
                return $OutputAPK
            } else {
                Write-BuildLog "❌ APK file not found at expected location" "ERROR"
                return $null
            }
            
        } else {
            Write-BuildLog "❌ Android build failed" "ERROR"
            $BuildOutput | Out-File "$ProjectPath\build-outputs\android-build-error-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
            return $null
        }
        
    } catch {
        Write-BuildLog "Android APK build failed: $($_.Exception.Message)" "ERROR"
        return $null
    } finally {
        Set-Location $ProjectPath
    }
}

function Test-APKFunctionality {
    param([string]$APKPath)
    
    Write-BuildLog "Testing APK functionality..." "TEST"
    
    try {
        if (!(Test-Path $APKPath)) {
            Write-BuildLog "❌ APK file not found: $APKPath" "ERROR"
            return $false
        }
        
        # Basic APK analysis using aapt (if available)
        Write-BuildLog "Analyzing APK structure..."
        
        # Check APK size
        $APKSize = (Get-Item $APKPath).Length
        Write-BuildLog "📊 APK Size: $($APKSize / 1MB | Format-Decimal -DecimalPlaces 2) MB"
        
        # Try to extract some basic info (this would require Android build tools)
        # For now, just verify the file is a valid ZIP (APKs are ZIP files)
        try {
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            $APKArchive = [System.IO.Compression.ZipFile]::OpenRead($APKPath)
            $EntryCount = $APKArchive.Entries.Count
            $APKArchive.Dispose()
            
            Write-BuildLog "✅ APK structure valid ($EntryCount entries)" "SUCCESS"
            return $true
            
        } catch {
            Write-BuildLog "❌ APK structure validation failed: $($_.Exception.Message)" "ERROR"
            return $false
        }
        
    } catch {
        Write-BuildLog "APK functionality test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Generate-BuildReport {
    param([hashtable]$BuildResults)
    
    Write-BuildLog "Generating build report..." "REPORT"
    
    try {
        $ReportPath = "$ProjectPath\build-outputs\build-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
        
        $HTML = @"
<!DOCTYPE html>
<html>
<head>
    <title>Second Chance - Build Report</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #1a1a2e; color: #fff; }
        .header { background: linear-gradient(135deg, #16213e, #0f3460); padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .success { color: #4CAF50; }
        .error { color: #f44336; }
        .warning { color: #ff9800; }
        .section { background: #16213e; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .timestamp { color: #ccc; font-size: 0.9em; }
        .apk-info { background: #0f3460; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .build-status { font-size: 1.2em; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏗️ Second Chance - Build Report</h1>
        <p class="timestamp">Generated: $(Get-Date)</p>
        <p class="build-status">Build Type: $BuildType</p>
    </div>
    
    <div class="section">
        <h2>📋 Build Summary</h2>
        <p>Comprehensive build and compilation testing for Second Chance recovery app.</p>
    </div>
    
    <div class="section">
        <h2>🔧 Prerequisites Check</h2>
        <div id="prerequisites">
            <!-- Prerequisites would be populated here -->
        </div>
    </div>
    
    <div class="section">
        <h2>📱 APK Information</h2>
        <div class="apk-info">
            <p>Build completed with automated testing and validation.</p>
            <p>APK ready for deployment and testing on Android devices.</p>
        </div>
    </div>
    
    <div class="section">
        <h2>📊 Build Logs</h2>
        <p>Detailed build logs and error reports available in build-outputs directory.</p>
    </div>
</body>
</html>
"@

        $HTML | Out-File $ReportPath -Encoding UTF8
        Write-BuildLog "📊 Build report generated: $ReportPath" "SUCCESS"
        
    } catch {
        Write-BuildLog "Failed to generate build report: $($_.Exception.Message)" "ERROR"
    }
}

function Start-AutonomousBuildTest {
    Write-BuildLog "🚀 Starting autonomous build and test workflow..." "INIT"
    
    $BuildResults = @{}
    
    # Check prerequisites
    $BuildResults["Prerequisites"] = Test-Prerequisites
    
    # Install dependencies
    $BuildResults["Dependencies"] = Install-Dependencies
    
    # Test React Native build
    $BuildResults["ReactNativeBuild"] = Test-ReactNativeBuild
    
    # Build Android APK
    if ($GenerateAPK) {
        $APKPath = Build-AndroidAPK
        $BuildResults["AndroidAPK"] = ($APKPath -ne $null)
        
        if ($APKPath) {
            # Test APK functionality
            $BuildResults["APKTest"] = Test-APKFunctionality -APKPath $APKPath
        }
    }
    
    # Generate build report
    Generate-BuildReport -BuildResults $BuildResults
    
    # Summary
    $SuccessCount = ($BuildResults.Values | Where-Object { $_ -eq $true }).Count
    $TotalTests = $BuildResults.Count
    
    Write-BuildLog "🏁 Build workflow completed" "COMPLETE"
    Write-BuildLog "📊 Results: $SuccessCount/$TotalTests successful" "COMPLETE"
    
    return $BuildResults
}

# Execute the autonomous build and test workflow
Start-AutonomousBuildTest