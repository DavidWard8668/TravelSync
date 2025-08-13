# MOBILE QUICK START - SECOND CHANCE APP
# Complete React Native setup and development for addiction recovery support app

param(
    [Parameter(Mandatory=$false)]
    [string]$AppName = "Second Chance",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectName = "second-chance",
    
    [string]$Platform = "both" # "android", "ios", "both"
)

Write-Host "📱 SECOND CHANCE MOBILE APP - QUICK START" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 App: $AppName" -ForegroundColor Cyan
Write-Host "📁 Project: $projectName" -ForegroundColor Cyan
Write-Host "🔧 Platform: $Platform" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking mobile development prerequisites..." -ForegroundColor Yellow

$prerequisites = @(
    @{name="Node.js"; cmd="node --version"; install="https://nodejs.org/"},
    @{name="npm"; cmd="npm --version"; install="Comes with Node.js"},
    @{name="Git"; cmd="git --version"; install="https://git-scm.com/"},
    @{name="React Native CLI"; cmd="npx react-native --version"; install="npx react-native-cli"},
    @{name="Android Studio"; cmd="adb --version"; install="https://developer.android.com/studio"; optional=$true},
    @{name="Xcode"; cmd="xcodebuild -version"; install="Mac App Store"; optional=$true}
)

$allGood = $true
$missingRequired = @()

foreach ($prereq in $prerequisites) {
    try {
        $version = Invoke-Expression $prereq.cmd 2>$null
        Write-Host "   ✅ $($prereq.name): Found" -ForegroundColor Green
    } catch {
        if ($prereq.optional) {
            Write-Host "   ⚠️ $($prereq.name): Optional, not found" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ $($prereq.name): Required but not found" -ForegroundColor Red
            $missingRequired += $prereq
            $allGood = $false
        }
    }
}

if (-not $allGood) {
    Write-Host ""
    Write-Host "❌ Missing required prerequisites. Please install:" -ForegroundColor Red
    foreach ($missing in $missingRequired) {
        Write-Host "   - $($missing.name): $($missing.install)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "After installing, run this script again." -ForegroundColor Yellow
    exit 1
}

# Create project directory
Write-Host ""
Write-Host "📁 Creating project structure..." -ForegroundColor Yellow
$projectPath = "C:\Users\David\Development\mobile-autonomous-apps\$(Get-Date -Format 'yyyy-MM-dd')-$projectName"

if (Test-Path $projectPath) {
    Write-Host "   Project directory already exists: $projectPath" -ForegroundColor Yellow
    $response = Read-Host "   Overwrite? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "   Exiting..." -ForegroundColor Gray
        exit 0
    }
    Remove-Item -Path $projectPath -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $projectPath
Set-Location $projectPath

# Run the autonomous setup
Write-Host "🔧 Running mobile autonomous setup..." -ForegroundColor Yellow
if (Test-Path "C:\Users\David\Apps\Second-Chance\mobile-autonomous-setup.ps1") {
    & "C:\Users\David\Apps\Second-Chance\mobile-autonomous-setup.ps1"
} else {
    Write-Host "   ⚠️ Autonomous setup script not found, continuing with manual setup..." -ForegroundColor Yellow
}

# Initialize React Native project
Write-Host ""
Write-Host "⚛️ Creating React Native project..." -ForegroundColor Yellow

$initCommand = "npx react-native init SecondChanceApp --template react-native-template-typescript"
Write-Host "   Running: $initCommand" -ForegroundColor Gray

try {
    Invoke-Expression $initCommand
    Set-Location "SecondChanceApp"
    Write-Host "   ✅ React Native project created" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to create React Native project: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Copy templates and configurations
Write-Host ""
Write-Host "📋 Setting up Second Chance specific features..." -ForegroundColor Yellow

# Copy the main app component
if (Test-Path "C:\Users\David\Apps\Second-Chance\templates\SecondChanceApp.tsx") {
    Copy-Item "C:\Users\David\Apps\Second-Chance\templates\SecondChanceApp.tsx" -Destination "src\App.tsx" -Force
    Write-Host "   ✅ Second Chance app component installed" -ForegroundColor Green
    
    # Create src directory if it doesn't exist
    if (-not (Test-Path "src")) {
        New-Item -ItemType Directory -Force -Path "src"
        Move-Item "App.tsx" "src\App.tsx" -Force
    }
}

# Copy Supabase configuration
if (Test-Path "C:\Users\David\Apps\Second-Chance\templates\lib\supabase.ts") {
    New-Item -ItemType Directory -Force -Path "src\lib"
    Copy-Item "C:\Users\David\Apps\Second-Chance\templates\lib\supabase.ts" -Destination "src\lib\supabase.ts" -Force
    Write-Host "   ✅ Supabase configuration installed" -ForegroundColor Green
}

# Copy environment template
if (Test-Path "C:\Users\David\Apps\Second-Chance\templates\.env.template") {
    Copy-Item "C:\Users\David\Apps\Second-Chance\templates\.env.template" -Destination ".env" -Force
    Write-Host "   ✅ Environment configuration template installed" -ForegroundColor Green
}

# Install required dependencies
Write-Host ""
Write-Host "📦 Installing Second Chance dependencies..." -ForegroundColor Yellow

$dependencies = @(
    "@react-navigation/native",
    "@react-navigation/stack",
    "@react-navigation/bottom-tabs",
    "@supabase/supabase-js",
    "react-native-url-polyfill",
    "@react-native-async-storage/async-storage",
    "react-native-screens",
    "react-native-safe-area-context",
    "react-native-gesture-handler",
    "react-native-reanimated",
    "react-native-vector-icons",
    "react-native-device-info",
    "react-native-permissions",
    "react-native-push-notification",
    "react-native-config",
    "react-native-keychain",
    "react-native-biometrics",
    "@react-native-firebase/app",
    "@react-native-firebase/analytics",
    "@react-native-firebase/crashlytics",
    "@sentry/react-native"
)

$devDependencies = @(
    "@testing-library/react-native",
    "@testing-library/jest-native",
    "detox",
    "@types/react-native-vector-icons"
)

Write-Host "   Installing production dependencies..." -ForegroundColor Gray
$depString = $dependencies -join " "
try {
    & npm install $depString.Split(' ')
    Write-Host "   ✅ Production dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Some dependencies may have failed to install" -ForegroundColor Yellow
}

Write-Host "   Installing development dependencies..." -ForegroundColor Gray
$devDepString = $devDependencies -join " "
try {
    & npm install --save-dev $devDepString.Split(' ')
    Write-Host "   ✅ Development dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Some dev dependencies may have failed to install" -ForegroundColor Yellow
}

# Configure React Native dependencies
Write-Host ""
Write-Host "⚙️ Configuring native dependencies..." -ForegroundColor Yellow

# iOS configuration (if on macOS)
if (-not $IsWindows -and (Test-Path "ios")) {
    Write-Host "   Installing iOS pods..." -ForegroundColor Gray
    Set-Location ios
    & pod install
    Set-Location ..
    Write-Host "   ✅ iOS pods installed" -ForegroundColor Green
}

# Android configuration
if (Test-Path "android") {
    Write-Host "   Configuring Android permissions..." -ForegroundColor Gray
    
    $androidManifest = "android\app\src\main\AndroidManifest.xml"
    if (Test-Path $androidManifest) {
        $manifestContent = Get-Content $androidManifest -Raw
        
        # Add required permissions for Second Chance app
        $permissions = @(
            '<uses-permission android:name="android.permission.INTERNET" />',
            '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
            '<uses-permission android:name="android.permission.VIBRATE" />',
            '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
            '<uses-permission android:name="android.permission.WAKE_LOCK" />',
            '<uses-permission android:name="android.permission.USE_BIOMETRIC" />',
            '<uses-permission android:name="android.permission.USE_FINGERPRINT" />',
            '<uses-permission android:name="com.android.vending.BILLING" />'
        )
        
        foreach ($permission in $permissions) {
            if ($manifestContent -notmatch [regex]::Escape($permission)) {
                $manifestContent = $manifestContent -replace '(<manifest[^>]*>)', "`$1`n    $permission"
            }
        }
        
        $manifestContent | Out-File $androidManifest -Encoding UTF8
        Write-Host "   ✅ Android permissions configured" -ForegroundColor Green
    }
}

# Copy testing scripts
Write-Host ""
Write-Host "🧪 Setting up testing environment..." -ForegroundColor Yellow

if (Test-Path "C:\Users\David\Apps\Second-Chance\scripts\mobile-testing.ps1") {
    Copy-Item "C:\Users\David\Apps\Second-Chance\scripts\mobile-testing.ps1" -Destination "scripts\test.ps1" -Force
    Write-Host "   ✅ Testing scripts installed" -ForegroundColor Green
}

if (Test-Path "C:\Users\David\Apps\Second-Chance\scripts\mobile-deploy.ps1") {
    Copy-Item "C:\Users\David\Apps\Second-Chance\scripts\mobile-deploy.ps1" -Destination "scripts\deploy.ps1" -Force
    Write-Host "   ✅ Deployment scripts installed" -ForegroundColor Green
}

# Create database schema
Write-Host ""
Write-Host "🗄️ Setting up database..." -ForegroundColor Yellow

if (Test-Path "C:\Users\David\Apps\Second-Chance\templates\supabase\schema.sql") {
    New-Item -ItemType Directory -Force -Path "supabase"
    Copy-Item "C:\Users\David\Apps\Second-Chance\templates\supabase\schema.sql" -Destination "supabase\schema.sql" -Force
    Write-Host "   ✅ Database schema ready" -ForegroundColor Green
    Write-Host "   📝 Run this SQL in your Supabase dashboard to create the database structure" -ForegroundColor Cyan
}

# Initialize git repository
Write-Host ""
Write-Host "📚 Initializing version control..." -ForegroundColor Yellow

try {
    & git init
    & git branch -M main
    & git add .
    & git commit -m "Initial commit: Second Chance mobile app setup - Features: React Native with TypeScript, Supabase backend, Admin oversight system, App monitoring, Push notifications, Biometric auth, Recovery resources - Generated with Claude Code autonomous mobile setup"
    
    Write-Host "   ✅ Git repository initialized" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Git initialization failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Create quick development scripts
Write-Host ""
Write-Host "🚀 Creating development shortcuts..." -ForegroundColor Yellow

$startScript = @"
# Second Chance Development Start Script
Write-Host "📱 Starting Second Chance development environment..." -ForegroundColor Green

# Start Metro bundler
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Android if available
if (Get-Command "adb" -ErrorAction SilentlyContinue) {
    Write-Host "🤖 Starting Android app..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run android" -WindowStyle Normal
}

# Start iOS if on macOS
if (-not `$IsWindows -and (Get-Command "xcrun" -ErrorAction SilentlyContinue)) {
    Write-Host "📱 Starting iOS app..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run ios" -WindowStyle Normal
}

Write-Host ""
Write-Host "🎉 Second Chance development environment is starting!" -ForegroundColor Green
Write-Host "   📱 Make sure you have an emulator/simulator running" -ForegroundColor Cyan
Write-Host "   🔧 Edit .env file with your Supabase credentials" -ForegroundColor Cyan
Write-Host "   🗄️ Run the SQL schema in your Supabase dashboard" -ForegroundColor Cyan
"@

$startScript | Out-File "start-dev.ps1" -Encoding UTF8

# Final setup
Write-Host ""
Write-Host "✅ SECOND CHANCE MOBILE APP SETUP COMPLETE!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Project Location: $projectPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Configure your environment:" -ForegroundColor White
Write-Host "      - Edit .env file with your Supabase credentials" -ForegroundColor Gray
Write-Host "      - Run supabase/schema.sql in your Supabase dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Start development:" -ForegroundColor White
Write-Host "      .\start-dev.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Run tests:" -ForegroundColor White
Write-Host "      .\scripts\test.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Deploy when ready:" -ForegroundColor White
Write-Host "      .\scripts\deploy.ps1 -Platform both -Environment production" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 SECOND CHANCE APP FEATURES:" -ForegroundColor Yellow
Write-Host "   📱 Cross-platform mobile app (iOS & Android)" -ForegroundColor White
Write-Host "   👥 Admin oversight system for accountability" -ForegroundColor White
Write-Host "   🔍 Real-time app monitoring (Snapchat, Telegram, etc.)" -ForegroundColor White
Write-Host "   🚨 Instant admin alerts for risky app usage" -ForegroundColor White
Write-Host "   ✅ Permission-based app access control" -ForegroundColor White
Write-Host "   📊 Progress tracking and analytics" -ForegroundColor White
Write-Host "   🆘 Integrated crisis support resources" -ForegroundColor White
Write-Host "   🔐 Secure biometric authentication" -ForegroundColor White
Write-Host "   📱 Push notifications for accountability" -ForegroundColor White
Write-Host ""
Write-Host "💪 Ready to help people on their recovery journey!" -ForegroundColor Green

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Create React Native setup script for Second Chance app", "status": "completed"}, {"id": "2", "content": "Create mobile-specific templates and configurations", "status": "completed"}, {"id": "3", "content": "Add mobile testing and deployment scripts", "status": "completed"}]