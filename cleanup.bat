@echo off
echo ========================================
echo    Zetech-MD Bot Cleanup Script
echo ========================================
echo.

echo 🔍 Checking for existing Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" /FO CSV | find /C "node.exe" > temp_count.txt
set /p process_count=<temp_count.txt
del temp_count.txt

if %process_count% GTR 1 (
    echo 📊 Found %process_count% Node.js processes running
    echo 🛑 Force stopping all Node.js processes...
    taskkill /F /IM node.exe 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Stopped all Node.js processes
    ) else (
        echo ⚠️ Some processes may still be running
    )
) else (
    echo ℹ️ No additional Node.js processes found
)

echo.
echo 🗑️ Removing lock files...
if exist ".bot.lock" (
    del ".bot.lock"
    echo ✅ Lock file removed
) else (
    echo ℹ️ No lock file found
)

echo.
echo 🧹 Cleaning up temporary files...
if exist "tmp\*" (
    del /Q "tmp\*" 2>nul
    echo ✅ Temporary files cleaned
)

echo.
echo 🔄 Waiting for processes to fully terminate...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo    Cleanup completed!
echo ========================================
echo.
echo You can now start the bot safely with:
echo   npm start
echo   or
echo   node index.js
echo.
echo 💡 If you still get 409 conflicts, restart your computer
echo.
pause
