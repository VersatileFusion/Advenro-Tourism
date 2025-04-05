@echo off
echo === Advenro Tourism API Deployment Script ===
echo.

echo 1. Checking git status...
git status

echo.
echo 2. Adding changes...
git add .

echo.
echo 3. Committing changes...
git commit -m "Fix authentication middleware and dependency issues"

echo.
echo 4. Pushing to GitHub...
git push origin main

echo.
echo Deployment complete! Press any key to exit.
pause 