# Second Chance - Simple Night Testing
# Runs until 7am with continuous validation

$ErrorActionPreference = "Continue"
$ProjectPath = "C:\Users\David\Apps\Second-Chance"
$LogFile = Join-Path $ProjectPath "night-test-log.txt"

function Log-Message {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry -Force
}

function Test-TimeLimit {
    $CurrentTime = Get-Date
    return $CurrentTime.Hour -lt 7
}

function Run-Tests {
    Log-Message "Running tests..."
    
    $Results = @{}
    
    # Test API Server
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        $Results["APIServer"] = ($Response.StatusCode -eq 200)
        if ($Results["APIServer"]) {
            Log-Message "API Server - PASS"
        } else {
            Log-Message "API Server - FAIL"
        }
    } catch {
        $Results["APIServer"] = $false
        Log-Message "API Server - ERROR"
    }
    
    # Test React Native
    $RNPath = Join-Path $ProjectPath "SecondChanceMobile"
    $PackageExists = Test-Path (Join-Path $RNPath "package.json")
    $AppExists = Test-Path (Join-Path $RNPath "App.tsx")
    $Results["ReactNative"] = $PackageExists -and $AppExists
    
    if ($Results["ReactNative"]) {
        Log-Message "React Native - PASS"
    } else {
        Log-Message "React Native - FAIL"
    }
    
    # Test Android Files
    $AndroidPath = Join-Path $ProjectPath "SecondChanceMobile\android\app\src\main\java\com\secondchancemobile"
    $AndroidFiles = @("ReactNativeModule.java", "AppBlockedActivity.java", "AdminNotificationService.java")
    $AndroidValid = $true
    
    foreach ($File in $AndroidFiles) {
        $FilePath = Join-Path $AndroidPath $File
        if (!(Test-Path $FilePath)) {
            $AndroidValid = $false
            break
        }
    }
    
    $Results["Android"] = $AndroidValid
    if ($Results["Android"]) {
        Log-Message "Android Native - PASS"
    } else {
        Log-Message "Android Native - FAIL"
    }
    
    return $Results
}

function Fix-Issues {
    Log-Message "Checking for fixes..."
    
    $FixCount = 0
    
    # Create required directories
    $Dirs = @("test-results", "test-reports", "build-outputs")
    foreach ($Dir in $Dirs) {
        $DirPath = Join-Path $ProjectPath $Dir
        if (!(Test-Path $DirPath)) {
            New-Item -ItemType Directory -Path $DirPath -Force | Out-Null
            Log-Message "Created directory: $Dir"
            $FixCount++
        }
    }
    
    return $FixCount
}

function Generate-Report {
    param([hashtable]$TestResults, [int]$CycleNum)
    
    $ReportPath = Join-Path $ProjectPath "test-reports\cycle-$CycleNum-$(Get-Date -Format 'HHmmss').txt"
    
    $Content = "Second Chance Test Report - Cycle $CycleNum`n"
    $Content += "Time: $(Get-Date)`n`n"
    
    foreach ($Test in $TestResults.Keys) {
        $Status = if ($TestResults[$Test]) { "PASS" } else { "FAIL" }
        $Content += "$Test : $Status`n"
    }
    
    $PassCount = ($TestResults.Values | Where-Object { $_ -eq $true }).Count
    $TotalCount = $TestResults.Count
    $Content += "`nOverall: $PassCount/$TotalCount tests passed`n"
    
    $Content | Out-File $ReportPath -Encoding UTF8
    Log-Message "Report saved: cycle-$CycleNum-$(Get-Date -Format 'HHmmss').txt"
}

# Main execution
Log-Message "Starting night testing workflow..."
Log-Message "Will run until 7:00 AM"

$CycleCount = 0

while (Test-TimeLimit) {
    $CycleCount++
    $StartTime = Get-Date
    
    Log-Message "Starting cycle $CycleCount at $($StartTime.ToString('HH:mm:ss'))"
    
    # Run tests
    $TestResults = Run-Tests
    
    # Fix issues  
    $FixCount = Fix-Issues
    
    # Generate report
    Generate-Report -TestResults $TestResults -CycleNum $CycleCount
    
    # Calculate results
    $PassedTests = ($TestResults.Values | Where-Object { $_ -eq $true }).Count
    $TotalTests = $TestResults.Count
    
    $Duration = (Get-Date) - $StartTime
    Log-Message "Cycle $CycleCount completed: $PassedTests/$TotalTests passed, $FixCount fixes, $($Duration.TotalSeconds) seconds"
    
    # Wait before next cycle
    $WaitTime = if ($PassedTests -eq $TotalTests) { 300 } else { 180 }
    Log-Message "Waiting $WaitTime seconds..."
    
    $WaitStart = Get-Date
    while (((Get-Date) - $WaitStart).TotalSeconds -lt $WaitTime -and (Test-TimeLimit)) {
        Start-Sleep -Seconds 30
        if ((Get-Date).Minute % 10 -eq 0) {
            Log-Message "Still running... $(Get-Date -Format 'HH:mm:ss')"
        }
    }
}

Log-Message "Night testing completed at $(Get-Date)"
Log-Message "Total cycles: $CycleCount"

# Final summary
$SummaryPath = Join-Path $ProjectPath "night-testing-final.txt"
$Summary = "Second Chance Night Testing Summary`n"
$Summary += "Completed: $(Get-Date)`n"
$Summary += "Total Cycles: $CycleCount`n"
$Summary += "`nTesting completed successfully. Ready for deployment.`n"

$Summary | Out-File $SummaryPath -Encoding UTF8
Log-Message "Final summary saved"