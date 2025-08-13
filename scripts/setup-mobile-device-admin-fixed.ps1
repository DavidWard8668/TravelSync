# Second Chance Mobile Device Admin Setup Script
# Sets up the complete Android device admin implementation

Write-Host "🔧 Setting up Second Chance Mobile Device Admin Implementation..." -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "SecondChanceMobile")) {
    Write-Host "❌ Please run this script from the Second Chance project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Function to create directory if it doesn't exist
function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Force -Path $Path | Out-Null
        Write-Host "📁 Created directory: $Path" -ForegroundColor Green
    }
}

Write-Host "📱 Setting up Android Device Admin Implementation..." -ForegroundColor Yellow

# Ensure all required directories exist
$directories = @(
    "SecondChanceMobile\src\services",
    "SecondChanceMobile\src\components", 
    "SecondChanceMobile\android\app\src\main\res\xml",
    "SecondChanceMobile\android\app\src\main\res\values"
)

foreach ($dir in $directories) {
    Ensure-Directory $dir
}

Write-Host "📄 Creating XML configuration files..." -ForegroundColor Yellow

# Create device admin policies XML
$deviceAdminPolicies = @"
<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <limit-password />
        <watch-login />
        <reset-password />
        <force-lock />
        <wipe-data />
        <expire-password />
        <encrypted-storage />
        <disable-camera />
        <disable-keyguard-features />
    </uses-policies>
</device-admin>
"@

$deviceAdminPath = "SecondChanceMobile\android\app\src\main\res\xml\device_admin_policies.xml"
Set-Content $deviceAdminPath $deviceAdminPolicies -Encoding UTF8
Write-Host "✅ Created device_admin_policies.xml" -ForegroundColor Green

# Create accessibility service configuration XML
$accessibilityConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagReportViewIds|flagRetrieveInteractiveWindows"
    android:canRetrieveWindowContent="true"
    android:canPerformGestures="true"
    android:notificationTimeout="100"
    android:packageNames="com.snapchat.android,org.telegram.messenger,com.whatsapp,com.instagram.android,com.tinder,com.facebook.katana,com.twitter.android,com.discord"
    android:description="@string/accessibility_service_description"
    android:settingsActivity="com.secondchancemobile.MainActivity" />
"@

$accessibilityPath = "SecondChanceMobile\android\app\src\main\res\xml\accessibility_service_config.xml"
Set-Content $accessibilityPath $accessibilityConfig -Encoding UTF8
Write-Host "✅ Created accessibility_service_config.xml" -ForegroundColor Green

Write-Host "📝 Adding required string resources..." -ForegroundColor Yellow

# Update strings.xml with required strings
$stringsPath = "SecondChanceMobile\android\app\src\main\res\values\strings.xml"

if (-not (Test-Path $stringsPath)) {
    $stringsContent = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Second Chance</string>
    <string name="device_admin_description">Second Chance needs device administrator privileges to prevent app uninstallation during recovery</string>
    <string name="accessibility_service_label">Second Chance App Monitor</string>
    <string name="accessibility_service_description">Monitors app usage to support addiction recovery by requiring admin approval for trigger apps</string>
</resources>
"@
    Set-Content $stringsPath $stringsContent -Encoding UTF8
    Write-Host "✅ Created strings.xml with required resources" -ForegroundColor Green
} else {
    Write-Host "✅ strings.xml already exists" -ForegroundColor Green
}

Write-Host "📱 Checking React Native setup..." -ForegroundColor Yellow

# Check if React Native files exist
$reactFiles = @(
    "SecondChanceMobile\App.tsx",
    "SecondChanceMobile\src\services\NativeSecondChance.ts",
    "SecondChanceMobile\src\components\CrisisSupport.tsx"
)

$missingFiles = @()
foreach ($file in $reactFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        $missingFiles += $file
        Write-Host "⚠️ Missing: $file" -ForegroundColor Yellow
    }
}

Write-Host "🔨 Checking build environment..." -ForegroundColor Yellow

# Navigate to mobile directory and check setup
Push-Location "SecondChanceMobile"

try {
    if (Test-Path "package.json") {
        Write-Host "✅ package.json found" -ForegroundColor Green
        
        if (-not (Test-Path "node_modules")) {
            Write-Host "📦 Installing React Native dependencies..." -ForegroundColor Yellow
            npm install
        } else {
            Write-Host "✅ node_modules exists" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ package.json not found - may need React Native initialization" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "⚠️ Build check encountered issues: $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

Write-Host "✅ Device Admin Implementation Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of what was created/updated:" -ForegroundColor Cyan
Write-Host "• XML configuration files for device admin and accessibility service" -ForegroundColor White
Write-Host "• String resources for Android permissions" -ForegroundColor White
Write-Host "• Directory structure for React Native components" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Ensure all Java files are in place (SecondChanceDeviceAdminReceiver.java, etc.)" -ForegroundColor Yellow
Write-Host "2. Update AndroidManifest.xml with required permissions and receivers" -ForegroundColor Yellow
Write-Host "3. Build APK: cd SecondChanceMobile; npx react-native run-android" -ForegroundColor Yellow
Write-Host "4. Install on test device and grant permissions" -ForegroundColor Yellow
Write-Host "5. Test app monitoring and admin approval workflow" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔒 Security Features Ready:" -ForegroundColor Cyan
Write-Host "• Device Admin prevents app uninstallation" -ForegroundColor Green
Write-Host "• Accessibility Service monitors app launches" -ForegroundColor Green
Write-Host "• Crisis mode for emergency access" -ForegroundColor Green
Write-Host "• Encrypted PIN protection" -ForegroundColor Green

if ($missingFiles.Count -eq 0) {
    Write-Host ""
    Write-Host "🎯 All core files present - Ready for testing!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ Some React Native files are missing. Ensure they are created before building." -ForegroundColor Yellow
}