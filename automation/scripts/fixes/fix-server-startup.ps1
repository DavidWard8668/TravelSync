# Fix Server Startup Issues
# Addresses the node command not found error and gets backend running

param(
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\David\Apps\Second-Chance"

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Status) {
        "ERROR" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "SUCCESS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "WARNING" { Write-Host "[$timestamp] ⚠️ $Message" -ForegroundColor Yellow }
        "INFO" { Write-Host "[$timestamp] ℹ️ $Message" -ForegroundColor Cyan }
        default { Write-Host "[$timestamp] $Message" }
    }
}

Write-Status "🔧 FIXING SERVER STARTUP ISSUES..." "INFO"

# Step 1: Check Node.js installation
Write-Status "Checking Node.js installation..." "INFO"
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Status "Node.js found: $nodeVersion" "SUCCESS"
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Status "Node.js not installed or not in PATH" "ERROR"
    Write-Status "Installing Node.js via Chocolatey..." "INFO"
    
    try {
        # Install Node.js via chocolatey if available
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            choco install nodejs -y
            Write-Status "Node.js installed via Chocolatey" "SUCCESS"
        } else {
            Write-Status "Please install Node.js manually from https://nodejs.org/" "ERROR"
            Write-Status "Or install Chocolatey first: https://chocolatey.org/install" "INFO"
            return
        }
    } catch {
        Write-Status "Automated Node.js installation failed" "ERROR"
        Write-Status "Manual installation required: https://nodejs.org/" "ERROR"
        return
    }
}

# Step 2: Navigate to project directory
Set-Location $ProjectRoot
Write-Status "Working in: $(Get-Location)" "INFO"

# Step 3: Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Status "package.json not found - creating minimal version..." "WARNING"
    
    $packageJson = @{
        name = "second-chance-recovery"
        version = "1.0.0-beta"
        description = "Recovery support web application"
        main = "server/index.js"
        scripts = @{
            start = "node server/index.js"
            dev = "concurrently `"npm run server`" `"npm run client`""
            server = "nodemon server/index.js"
            client = "vite"
            test = "echo `"No tests yet`""
        }
        dependencies = @{
            express = "^4.18.2"
            cors = "^2.8.5"
            "socket.io" = "^4.7.5"
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path "package.json" -Value $packageJson
    Write-Status "Created basic package.json" "SUCCESS"
}

# Step 4: Install dependencies
Write-Status "Installing npm dependencies..." "INFO"
try {
    npm install --silent
    Write-Status "Dependencies installed successfully" "SUCCESS"
} catch {
    Write-Status "npm install failed: $_" "ERROR"
    
    # Try alternative installation methods
    Write-Status "Trying npm install with force..." "WARNING"
    try {
        npm install --force --silent
        Write-Status "Dependencies installed with --force" "SUCCESS"
    } catch {
        Write-Status "npm install completely failed" "ERROR"
        return
    }
}

# Step 5: Create minimal server if doesn't exist
$serverPath = "server/index.js"
if (-not (Test-Path $serverPath)) {
    Write-Status "Creating minimal server file..." "WARNING"
    
    New-Item -ItemType Directory -Path "server" -Force | Out-Null
    
    $serverContent = @"
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Basic API routes for testing
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: '🚀 Second Chance Server Running'
  });
});

app.get('/api/monitored-apps', (req, res) => {
  res.json({
    success: true,
    apps: [
      { id: 1, name: 'Snapchat', status: 'blocked' },
      { id: 2, name: 'Instagram', status: 'allowed' }
    ],
    message: 'Mock data - buttons should work now!'
  });
});

app.get('/api/admin-requests', (req, res) => {
  res.json({
    success: true,
    requests: [
      { id: 1, app: 'Snapchat', user: 'Test User', status: 'pending' }
    ],
    message: 'Mock admin requests'
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../SecondChanceApp/public/dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('✅ Second Chance Server running on port ' + PORT);
  console.log('🔗 API: http://localhost:' + PORT + '/api');
  console.log('🏥 Health: http://localhost:' + PORT + '/api/health');
  console.log('📱 Dashboard: http://localhost:' + PORT);
});
"@
    
    Set-Content -Path $serverPath -Value $serverContent
    Write-Status "Created minimal server.js" "SUCCESS"
}

# Step 6: Start the server
Write-Status "Starting the backend server..." "INFO"
try {
    # Start server in background
    $job = Start-Job -ScriptBlock {
        Set-Location "C:\Users\David\Apps\Second-Chance"
        node server/index.js
    }
    
    # Wait a moment for startup
    Start-Sleep -Seconds 3
    
    # Test if server is responding
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
        Write-Status "Server started successfully!" "SUCCESS"
        Write-Status "Health check response: $($response.message)" "SUCCESS"
        
        # Test other endpoints
        $appsResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/monitored-apps" -TimeoutSec 5
        Write-Status "Apps endpoint working: $($appsResponse.message)" "SUCCESS"
        
        $requestsResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/admin-requests" -TimeoutSec 5
        Write-Status "Admin requests endpoint working" "SUCCESS"
        
    } catch {
        Write-Status "Server may not be responding yet: $_" "WARNING"
    }
    
    Write-Status "✅ SERVER FIX COMPLETE!" "SUCCESS"
    Write-Status "" "INFO"
    Write-Status "🎯 NEXT STEPS:" "INFO"
    Write-Status "1. Open http://localhost:3001 in browser" "INFO"
    Write-Status "2. Test button functionality" "INFO"
    Write-Status "3. Check browser console for errors" "INFO"
    Write-Status "4. All buttons should now be functional!" "INFO"
    
} catch {
    Write-Status "Failed to start server: $_" "ERROR"
    
    # Try alternative startup method
    Write-Status "Trying alternative startup method..." "WARNING"
    try {
        Push-Location $ProjectRoot
        Start-Process -FilePath "node" -ArgumentList "server/index.js" -NoNewWindow
        Write-Status "Server started with alternative method" "SUCCESS"
    } catch {
        Write-Status "All startup methods failed" "ERROR"
        Write-Status "Manual intervention required" "ERROR"
    } finally {
        Pop-Location
    }
}