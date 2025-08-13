# Second Chance - Master Monitor
# Monitors all autonomous processes and provides comprehensive status

$ProjectPath = "C:\Users\David\Apps\Second-Chance"
$MonitorLog = "$ProjectPath\master-monitor.log"
$StartTime = Get-Date

function Write-Monitor($Message) {
    $Time = Get-Date -Format "HH:mm:ss"
    $Entry = "[$Time] MONITOR: $Message"
    Write-Host $Entry -ForegroundColor Cyan
    Add-Content -Path $MonitorLog -Value $Entry
}

function Get-ProcessStatus {
    # Check if various log files are being updated (indicating active processes)
    $Processes = @{}
    
    # Check robust testing
    $TestLog = "$ProjectPath\robust-test.log"
    if (Test-Path $TestLog) {
        $TestLogTime = (Get-Item $TestLog).LastWriteTime
        $Processes.Testing = @{
            Active = ((Get-Date) - $TestLogTime).TotalMinutes -lt 10
            LastUpdate = $TestLogTime
            LogFile = "robust-test.log"
        }
    }
    
    # Check build process
    $BuildLog = "$ProjectPath\build-log.txt"
    if (Test-Path $BuildLog) {
        $BuildLogTime = (Get-Item $BuildLog).LastWriteTime
        $Processes.Building = @{
            Active = ((Get-Date) - $BuildLogTime).TotalMinutes -lt 35
            LastUpdate = $BuildLogTime
            LogFile = "build-log.txt"
        }
    }
    
    # Check API server
    try {
        $APIResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        $Processes.APIServer = @{
            Active = $true
            Status = "Running"
            Response = $APIResponse
        }
    } catch {
        $Processes.APIServer = @{
            Active = $false
            Status = "Not responding"
            Error = $_.Exception.Message
        }
    }
    
    return $Processes
}

function Get-ProjectStatus {
    $Status = @{}
    
    # Count files created
    $FileCount = @{
        JavaFiles = (Get-ChildItem "$ProjectPath\SecondChanceMobile\android\app\src\main\java\com\secondchancemobile" -Filter "*.java" -ErrorAction SilentlyContinue).Count
        ConfigFiles = (Get-ChildItem "$ProjectPath\SecondChanceMobile\android\app\src\main\res" -Filter "*.xml" -Recurse -ErrorAction SilentlyContinue).Count
        TestReports = if (Test-Path "$ProjectPath\test-results") { (Get-ChildItem "$ProjectPath\test-results" -ErrorAction SilentlyContinue).Count } else { 0 }
        BuildOutputs = if (Test-Path "$ProjectPath\build-outputs") { (Get-ChildItem "$ProjectPath\build-outputs" -ErrorAction SilentlyContinue).Count } else { 0 }
        APKs = if (Test-Path "$ProjectPath\apks") { (Get-ChildItem "$ProjectPath\apks" -Filter "*.apk" -ErrorAction SilentlyContinue).Count } else { 0 }
    }
    
    $Status.Files = $FileCount
    
    # Check project structure
    $Structure = @{
        APIServer = Test-Path "$ProjectPath\SecondChanceApp\server.js"
        ReactNativeApp = Test-Path "$ProjectPath\SecondChanceMobile\App.tsx"
        AndroidManifest = Test-Path "$ProjectPath\SecondChanceMobile\android\app\src\main\AndroidManifest.xml"
        NativeModules = Test-Path "$ProjectPath\SecondChanceMobile\android\app\src\main\java\com\secondchancemobile\ReactNativeModule.java"
    }
    
    $Status.Structure = $Structure
    
    return $Status
}

function Generate-StatusReport {
    $Processes = Get-ProcessStatus
    $ProjectStatus = Get-ProjectStatus
    
    Write-Monitor "=== AUTONOMOUS WORKFLOW STATUS ==="
    
    # Process status
    foreach ($ProcessName in $Processes.Keys) {
        $Process = $Processes[$ProcessName]
        $StatusText = if ($Process.Active) { "ACTIVE" } else { "INACTIVE" }
        $Color = if ($Process.Active) { "Green" } else { "Yellow" }
        
        Write-Host "  $ProcessName : $StatusText" -ForegroundColor $Color
        
        if ($Process.LastUpdate) {
            $MinutesAgo = [math]::Round(((Get-Date) - $Process.LastUpdate).TotalMinutes, 1)
            Write-Monitor "    Last update: $MinutesAgo minutes ago"
        }
    }
    
    # Project status
    Write-Monitor "=== PROJECT STATUS ==="
    Write-Monitor "Files created:"
    foreach ($FileType in $ProjectStatus.Files.Keys) {
        Write-Monitor "  $FileType : $($ProjectStatus.Files[$FileType])"
    }
    
    Write-Monitor "Structure validation:"
    foreach ($Component in $ProjectStatus.Structure.Keys) {
        $Status = if ($ProjectStatus.Structure[$Component]) { "✓" } else { "✗" }
        Write-Monitor "  $Component : $Status"
    }
    
    # Calculate uptime
    $Uptime = (Get-Date) - $StartTime
    Write-Monitor "Total uptime: $($Uptime.ToString())"
    
    return @{
        Processes = $Processes
        Project = $ProjectStatus
        Uptime = $Uptime
    }
}

function Create-DashboardHTML {
    param($Status)
    
    $DashboardPath = "$ProjectPath\dashboard.html"
    
    $HTML = @"
<!DOCTYPE html>
<html>
<head>
    <title>Second Chance - Autonomous Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a2e; color: #fff; margin: 20px; }
        .header { background: linear-gradient(135deg, #16213e, #0f3460); padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center; }
        .section { background: #16213e; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .status-card { background: #0f3460; padding: 15px; border-radius: 8px; }
        .active { border-left: 4px solid #4CAF50; }
        .inactive { border-left: 4px solid #ff9800; }
        .metric { font-size: 2em; font-weight: bold; text-align: center; margin: 10px 0; }
        .timestamp { color: #ccc; font-size: 0.9em; }
        .progress-bar { background: #333; border-radius: 4px; height: 20px; overflow: hidden; margin: 10px 0; }
        .progress-fill { background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; transition: width 0.3s; }
    </style>
    <script>
        function updateClock() {
            document.getElementById('clock').innerHTML = new Date().toLocaleTimeString();
        }
        setInterval(updateClock, 1000);
    </script>
</head>
<body onload="updateClock()">
    <div class="header">
        <h1>🛡️ Second Chance - Autonomous Dashboard</h1>
        <p class="timestamp">Generated: $(Get-Date) | Current Time: <span id="clock"></span></p>
        <p>Autonomous development and testing in progress</p>
    </div>
    
    <div class="section">
        <h2>🔄 Process Status</h2>
        <div class="status-grid">
            <div class="status-card active">
                <h3>Testing Process</h3>
                <div class="metric">$(if ($Status.Processes.Testing.Active) { "🟢 ACTIVE" } else { "🟡 IDLE" })</div>
                <p>Continuous validation and monitoring</p>
            </div>
            <div class="status-card active">
                <h3>Build Process</h3>
                <div class="metric">$(if ($Status.Processes.Building.Active) { "🟢 ACTIVE" } else { "🟡 IDLE" })</div>
                <p>Code compilation and APK generation</p>
            </div>
            <div class="status-card active">
                <h3>API Server</h3>
                <div class="metric">$(if ($Status.Processes.APIServer.Active) { "🟢 RUNNING" } else { "🔴 DOWN" })</div>
                <p>Backend services and endpoints</p>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>📊 Project Metrics</h2>
        <div class="status-grid">
            <div class="status-card">
                <h3>Java Files</h3>
                <div class="metric">$($Status.Project.Files.JavaFiles)</div>
                <p>Android native modules</p>
            </div>
            <div class="status-card">
                <h3>Config Files</h3>
                <div class="metric">$($Status.Project.Files.ConfigFiles)</div>
                <p>XML configuration files</p>
            </div>
            <div class="status-card">
                <h3>Test Reports</h3>
                <div class="metric">$($Status.Project.Files.TestReports)</div>
                <p>Generated test reports</p>
            </div>
            <div class="status-card">
                <h3>APK Files</h3>
                <div class="metric">$($Status.Project.Files.APKs)</div>
                <p>Built Android packages</p>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>⏱️ Runtime Information</h2>
        <p><strong>Started:</strong> $($StartTime.ToString())</p>
        <p><strong>Uptime:</strong> $($Status.Uptime.ToString())</p>
        <p><strong>Target End:</strong> 7:00 AM</p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: $(([math]::Min(($Status.Uptime.TotalHours / 8) * 100, 100)))%"></div>
        </div>
        <p>Progress: $(([math]::Round(($Status.Uptime.TotalHours / 8) * 100, 1)))% complete</p>
    </div>
    
    <div class="section">
        <h2>🎯 Next Milestones</h2>
        <ul>
            <li>Continue autonomous testing and validation</li>
            <li>Complete build process optimization</li>
            <li>Generate final deployment packages</li>
            <li>Prepare production readiness report</li>
        </ul>
    </div>
</body>
</html>
"@
    
    $HTML | Out-File $DashboardPath -Encoding UTF8
    Write-Monitor "Dashboard updated: dashboard.html"
}

function Start-MasterMonitor {
    Write-Monitor "Master monitor started"
    Write-Monitor "Monitoring autonomous processes until 7am"
    
    $MonitorCycle = 0
    
    while ($true) {
        $CurrentTime = Get-Date
        $ElapsedHours = ($CurrentTime - $StartTime).TotalHours
        
        # Stop monitoring at 7am or after 8 hours
        if ($ElapsedHours -ge 8 -or $CurrentTime.Hour -eq 7) {
            break
        }
        
        $MonitorCycle++
        
        # Generate status report
        $Status = Generate-StatusReport
        
        # Create dashboard
        Create-DashboardHTML -Status $Status
        
        # Save status to JSON
        $StatusPath = "$ProjectPath\monitoring\status-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        if (!(Test-Path "$ProjectPath\monitoring")) {
            New-Item -ItemType Directory -Path "$ProjectPath\monitoring" -Force | Out-Null
        }
        $Status | ConvertTo-Json -Depth 4 | Out-File $StatusPath -Encoding UTF8
        
        Write-Monitor "Monitor cycle $MonitorCycle complete - Next check in 2 minutes"
        
        # Wait 2 minutes between status updates
        Start-Sleep -Seconds 120
    }
    
    # Final monitoring summary
    Write-Monitor "=== MONITORING COMPLETE ==="
    Write-Monitor "Total monitoring cycles: $MonitorCycle"
    Write-Monitor "All autonomous processes monitored successfully"
    
    # Create final status
    $FinalStatus = Generate-StatusReport
    Create-DashboardHTML -Status $FinalStatus
    
    Write-Monitor "Final dashboard generated"
}

# Start master monitoring
Start-MasterMonitor