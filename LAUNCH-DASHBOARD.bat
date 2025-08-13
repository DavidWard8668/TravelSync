@echo off
color 3
echo.
echo ========================================================
echo    🛡️  SECOND CHANCE - RECOVERY SUPPORT DASHBOARD
echo ========================================================
echo.
echo Launching professional recovery support application...
echo.

cd "C:\Users\David\Apps\Second-Chance\SecondChanceApp"

echo ✅ Starting Express server with beautiful GUI...
echo 📊 Dashboard will be available at: http://localhost:3001
echo 🔧 API endpoints ready for React Native app
echo.

start "" http://localhost:3001/dashboard.html
node app.js

pause