# Second Chance - Autonomous Night Workflow
# Continuous testing and improvement until 7am

param(
    [int]$MaxHours = 8,  # Run for 8 hours maximum
    [int]$CycleMinutes = 5  # 5 minute cycles
)

$ErrorActionPreference = "Continue"
$ProjectPath = "C:\Users\David\Apps\Second-Chance"
$LogFile = Join-Path $ProjectPath "autonomous-log.txt"
$StartTime = Get-Date

function Write-WorkflowLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Duration = [math]::Round(((Get-Date) - $StartTime).TotalMinutes, 2)
    $LogEntry = "[$Timestamp] [${Duration}min] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry -Force
}

function Test-ShouldContinue {
    $CurrentTime = Get-Date
    $ElapsedHours = ($CurrentTime - $StartTime).TotalHours
    
    # Continue if we haven't reached max hours AND it's before 7am (or we started after 7am)
    return ($ElapsedHours -lt $MaxHours) -and ($CurrentTime.Hour -ne 7 -or $StartTime.Hour -ge 7)
}

function Initialize-Environment {
    Write-WorkflowLog "Initializing autonomous environment..." "INIT"
    
    # Create required directories
    $Directories = @(
        "test-results",
        "test-reports", 
        "build-outputs",
        "improvement-logs",
        "monitoring-data"
    )
    
    foreach ($Dir in $Directories) {
        $DirPath = Join-Path $ProjectPath $Dir
        if (!(Test-Path $DirPath)) {
            New-Item -ItemType Directory -Path $DirPath -Force | Out-Null
            Write-WorkflowLog "Created directory: $Dir"
        }
    }
    
    Write-WorkflowLog "Environment initialized successfully" "SUCCESS"
}

function Test-SystemComponents {
    Write-WorkflowLog "Testing system components..." "TEST"
    
    $ComponentStatus = @{}
    
    # Test 1: API Server Health
    try {
        $APIResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
        $ComponentStatus["APIServer"] = @{
            Status = ($APIResponse.StatusCode -eq 200)
            Message = if ($APIResponse.StatusCode -eq 200) { "Healthy" } else { "Unhealthy - Status $($APIResponse.StatusCode)" }
        }
    } catch {
        $ComponentStatus["APIServer"] = @{
            Status = $false
            Message = "Not responding - $($_.Exception.Message)"
        }
    }
    
    # Test 2: React Native Project Structure
    $RNPath = Join-Path $ProjectPath "SecondChanceMobile"
    $RNValid = (Test-Path (Join-Path $RNPath "package.json")) -and 
               (Test-Path (Join-Path $RNPath "App.tsx")) -and
               (Test-Path (Join-Path $RNPath "android"))
    
    $ComponentStatus["ReactNative"] = @{
        Status = $RNValid
        Message = if ($RNValid) { "Structure valid" } else { "Missing core files" }
    }
    
    # Test 3: Android Native Components
    $AndroidPath = Join-Path $ProjectPath "SecondChanceMobile\android\app\src\main\java\com\secondchancemobile"
    $AndroidFiles = @(
        "ReactNativeModule.java",
        "AppBlockedActivity.java", 
        "AdminNotificationService.java",
        "BackgroundMonitoringService.java",
        "AppMonitoringService.java"
    )
    
    $AndroidFilesPresent = 0
    foreach ($File in $AndroidFiles) {
        if (Test-Path (Join-Path $AndroidPath $File)) {
            $AndroidFilesPresent++
        }
    }
    
    $ComponentStatus["AndroidNative"] = @{
        Status = ($AndroidFilesPresent -eq $AndroidFiles.Count)
        Message = "$AndroidFilesPresent/$($AndroidFiles.Count) native files present"
    }
    
    # Test 4: Configuration Files
    $ConfigFiles = @(
        "SecondChanceMobile\android\app\src\main\res\xml\device_admin_policies.xml",
        "SecondChanceMobile\android\app\src\main\res\xml\accessibility_service_config.xml",
        "SecondChanceMobile\android\app\src\main\res\values\strings.xml"
    )
    
    $ConfigValid = $true
    foreach ($ConfigFile in $ConfigFiles) {
        if (!(Test-Path (Join-Path $ProjectPath $ConfigFile))) {
            $ConfigValid = $false
            break
        }
    }
    
    $ComponentStatus["Configuration"] = @{
        Status = $ConfigValid
        Message = if ($ConfigValid) { "All config files present" } else { "Missing configuration files" }
    }
    
    # Log results
    foreach ($Component in $ComponentStatus.Keys) {
        $Status = $ComponentStatus[$Component]
        $StatusText = if ($Status.Status) { "PASS" } else { "FAIL" }
        Write-WorkflowLog "$Component - $StatusText - $($Status.Message)" $(if ($Status.Status) { "SUCCESS" } else { "ERROR" })
    }
    
    return $ComponentStatus
}

function Run-CodeValidation {
    Write-WorkflowLog "Running code validation..." "VALIDATE"
    
    $ValidationResults = @{}
    
    # Validate React Native TypeScript
    $RNPath = Join-Path $ProjectPath "SecondChanceMobile"
    if (Test-Path (Join-Path $RNPath "package.json")) {
        try {
            Set-Location $RNPath
            
            # Check if node_modules exists
            if (!(Test-Path "node_modules")) {
                Write-WorkflowLog "Installing React Native dependencies..."
                npm install 2>&1 | Out-Null
            }
            
            # Run TypeScript check
            $TSResult = npx tsc --noEmit 2>&1
            $ValidationResults["TypeScript"] = @{
                Status = ($LASTEXITCODE -eq 0)
                Output = $TSResult
            }
            
            if ($ValidationResults["TypeScript"].Status) {
                Write-WorkflowLog "TypeScript validation - PASS" "SUCCESS"
            } else {
                Write-WorkflowLog "TypeScript validation - FAIL" "ERROR"
                $TSResult | Out-File (Join-Path $ProjectPath "test-results\typescript-errors-$(Get-Date -Format 'HHmmss').log")
            }
            
        } catch {
            $ValidationResults["TypeScript"] = @{
                Status = $false
                Output = $_.Exception.Message
            }
            Write-WorkflowLog "TypeScript validation failed: $($_.Exception.Message)" "ERROR"
        }
        
        Set-Location $ProjectPath
    }
    
    # Validate API Server
    $APIPath = Join-Path $ProjectPath "SecondChanceApp"
    if (Test-Path (Join-Path $APIPath "server.js")) {
        try {
            Set-Location $APIPath
            
            if (!(Test-Path "node_modules")) {
                Write-WorkflowLog "Installing API server dependencies..."
                npm install 2>&1 | Out-Null
            }
            
            # Syntax check
            $NodeCheck = node -c server.js 2>&1
            $ValidationResults["APIServerSyntax"] = @{
                Status = ($LASTEXITCODE -eq 0)
                Output = $NodeCheck
            }
            
            if ($ValidationResults["APIServerSyntax"].Status) {
                Write-WorkflowLog "API Server syntax - PASS" "SUCCESS"
            } else {
                Write-WorkflowLog "API Server syntax - FAIL" "ERROR"
                $NodeCheck | Out-File (Join-Path $ProjectPath "test-results\api-syntax-errors-$(Get-Date -Format 'HHmmss').log")
            }
            
        } catch {
            $ValidationResults["APIServerSyntax"] = @{
                Status = $false
                Output = $_.Exception.Message
            }
            Write-WorkflowLog "API Server validation failed: $($_.Exception.Message)" "ERROR"
        }
        
        Set-Location $ProjectPath
    }
    
    return $ValidationResults
}

function Implement-Improvements {
    Write-WorkflowLog "Implementing improvements..." "IMPROVE"
    
    $ImprovementCount = 0
    
    # Improvement 1: Add error boundary to React Native app if missing
    $ErrorBoundaryPath = Join-Path $ProjectPath "SecondChanceMobile\src\components\ErrorBoundary.tsx"
    if (!(Test-Path $ErrorBoundaryPath)) {
        $ErrorBoundaryDir = Split-Path $ErrorBoundaryPath
        if (!(Test-Path $ErrorBoundaryDir)) {
            New-Item -ItemType Directory -Path $ErrorBoundaryDir -Force | Out-Null
        }
        
        $ErrorBoundaryCode = @'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an error. Please restart the application.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});
'@
        
        $ErrorBoundaryCode | Out-File $ErrorBoundaryPath -Encoding UTF8
        Write-WorkflowLog "Added ErrorBoundary component" "IMPROVE"
        $ImprovementCount++
    }
    
    # Improvement 2: Add environment configuration
    $EnvPath = Join-Path $ProjectPath "SecondChanceApp\.env.example"
    if (!(Test-Path $EnvPath)) {
        $EnvConfig = @'
# Second Chance API Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration (for future use)
DATABASE_URL=

# Security
JWT_SECRET=your-secret-key-here

# Email Service (for admin notifications)
EMAIL_SERVICE_API_KEY=
EMAIL_FROM=noreply@secondchanceapp.com

# SMS Service (for admin notifications)  
SMS_SERVICE_API_KEY=

# Firebase Configuration (for push notifications)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Crisis Support
CRISIS_HOTLINE_NUMBER=988
CRISIS_TEXT_NUMBER=741741
'@
        
        $EnvConfig | Out-File $EnvPath -Encoding UTF8
        Write-WorkflowLog "Added environment configuration template" "IMPROVE"
        $ImprovementCount++
    }
    
    # Improvement 3: Add package.json scripts
    $RNPackagePath = Join-Path $ProjectPath "SecondChanceMobile\package.json"
    if (Test-Path $RNPackagePath) {
        $PackageContent = Get-Content $RNPackagePath -Raw | ConvertFrom-Json
        
        # Add useful scripts if missing
        if (!$PackageContent.scripts.test) {
            $PackageContent.scripts | Add-Member -NotePropertyName "test" -NotePropertyValue "jest"
            $PackageContent.scripts | Add-Member -NotePropertyName "lint" -NotePropertyValue "eslint . --ext .js,.jsx,.ts,.tsx"
            $PackageContent.scripts | Add-Member -NotePropertyName "type-check" -NotePropertyValue "tsc --noEmit"
            
            $PackageContent | ConvertTo-Json -Depth 10 | Out-File $RNPackagePath -Encoding UTF8
            Write-WorkflowLog "Enhanced React Native package.json scripts" "IMPROVE"
            $ImprovementCount++
        }
    }
    
    Write-WorkflowLog "Applied $ImprovementCount improvements" "IMPROVE"
    return $ImprovementCount
}

function Generate-CycleReport {
    param(
        [int]$CycleNumber,
        [hashtable]$ComponentStatus,
        [hashtable]$ValidationResults,
        [int]$ImprovementCount
    )
    
    $ReportPath = Join-Path $ProjectPath "test-reports\cycle-$CycleNumber-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    
    $Report = @{
        CycleNumber = $CycleNumber
        Timestamp = Get-Date
        Duration = [math]::Round(((Get-Date) - $StartTime).TotalMinutes, 2)
        ComponentStatus = $ComponentStatus
        ValidationResults = $ValidationResults
        ImprovementCount = $ImprovementCount
        Summary = @{
            ComponentsPassing = ($ComponentStatus.Values | Where-Object { $_.Status }).Count
            TotalComponents = $ComponentStatus.Count
            ValidationsPassing = ($ValidationResults.Values | Where-Object { $_.Status }).Count
            TotalValidations = $ValidationResults.Count
        }
    }
    
    $Report | ConvertTo-Json -Depth 5 | Out-File $ReportPath -Encoding UTF8
    Write-WorkflowLog "Cycle report saved: cycle-$CycleNumber-$(Get-Date -Format 'yyyyMMdd-HHmmss').json" "REPORT"
    
    return $Report
}

function Start-AutonomousWorkflow {
    Write-WorkflowLog "🚀 Starting autonomous night workflow..." "INIT"
    Write-WorkflowLog "Max duration: $MaxHours hours, cycle interval: $CycleMinutes minutes" "INIT"
    
    Initialize-Environment
    
    $CycleCount = 0
    $TotalImprovements = 0
    
    while (Test-ShouldContinue) {
        $CycleCount++
        $CycleStart = Get-Date
        
        Write-WorkflowLog "🔄 Starting autonomous cycle $CycleCount" "CYCLE"
        
        # Test system components
        $ComponentStatus = Test-SystemComponents
        
        # Run code validation
        $ValidationResults = Run-CodeValidation
        
        # Implement improvements
        $ImprovementCount = Implement-Improvements
        $TotalImprovements += $ImprovementCount
        
        # Generate cycle report
        $CycleReport = Generate-CycleReport -CycleNumber $CycleCount -ComponentStatus $ComponentStatus -ValidationResults $ValidationResults -ImprovementCount $ImprovementCount
        
        # Log cycle summary
        $CycleDuration = (Get-Date) - $CycleStart
        $ComponentsPassing = $CycleReport.Summary.ComponentsPassing
        $TotalComponents = $CycleReport.Summary.TotalComponents
        $ValidationsPassing = $CycleReport.Summary.ValidationsPassing
        $TotalValidations = $CycleReport.Summary.TotalValidations
        
        Write-WorkflowLog "✅ Cycle $CycleCount completed in $($CycleDuration.TotalSeconds) seconds" "CYCLE"
        Write-WorkflowLog "📊 Results: $ComponentsPassing/$TotalComponents components, $ValidationsPassing/$TotalValidations validations, $ImprovementCount improvements" "CYCLE"
        
        # Wait for next cycle
        if (Test-ShouldContinue) {
            Write-WorkflowLog "⏳ Waiting $CycleMinutes minutes for next cycle..." "WAIT"
            
            $WaitStart = Get-Date
            while (((Get-Date) - $WaitStart).TotalMinutes -lt $CycleMinutes -and (Test-ShouldContinue)) {
                Start-Sleep -Seconds 30
                
                # Heartbeat every 5 minutes
                if (((Get-Date) - $WaitStart).TotalMinutes % 5 -lt 0.1) {
                    $ElapsedTotal = [math]::Round(((Get-Date) - $StartTime).TotalMinutes, 1)
                    Write-WorkflowLog "💓 Heartbeat - Running for ${ElapsedTotal} minutes" "HEARTBEAT"
                }
            }
        }
    }
    
    # Final summary
    $TotalDuration = (Get-Date) - $StartTime
    Write-WorkflowLog "🏁 Autonomous workflow completed" "COMPLETE"
    Write-WorkflowLog "📊 Final stats: $CycleCount cycles, $TotalImprovements improvements, $($TotalDuration.TotalHours.ToString('F2')) hours" "COMPLETE"
    
    # Generate final report
    $FinalReportPath = Join-Path $ProjectPath "autonomous-final-report.json"
    $FinalReport = @{
        StartTime = $StartTime
        EndTime = Get-Date
        TotalDuration = $TotalDuration
        TotalCycles = $CycleCount
        TotalImprovements = $TotalImprovements
        Status = "Completed Successfully"
    }
    
    $FinalReport | ConvertTo-Json -Depth 3 | Out-File $FinalReportPath -Encoding UTF8
    Write-WorkflowLog "📋 Final report saved to autonomous-final-report.json" "COMPLETE"
}

# Start the autonomous workflow
Start-AutonomousWorkflow