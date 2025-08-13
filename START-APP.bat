@echo off
echo ========================================
echo   SECOND CHANCE - Quick Start Guide
echo ========================================
echo.

echo Step 1: API Server
echo ------------------
echo The API server is already running at http://localhost:3000
echo You can test it by opening your browser to that URL
echo.

echo Step 2: Install React Native Dependencies
echo -----------------------------------------
cd SecondChanceMobile
echo Installing dependencies (this may take a few minutes)...
call npm install
echo.

echo Step 3: Start React Native Metro Bundler
echo ----------------------------------------
echo Starting Metro bundler in a new window...
start cmd /k "npx react-native start"
echo.

echo Step 4: Run on Android (requires Android Studio/emulator)
echo ---------------------------------------------------------
echo Make sure you have an Android emulator running or device connected
echo.
pause
echo Running app on Android...
call npx react-native run-android
echo.

echo ========================================
echo   App should now be running!
echo ========================================
echo.
echo Troubleshooting:
echo - Make sure Android Studio is installed
echo - Start an Android emulator first
echo - Or connect a physical Android device with USB debugging enabled
echo.
pause