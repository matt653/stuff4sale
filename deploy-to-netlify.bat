@echo off
echo ========================================================
echo Building and Deploying Stuff4Sale to Netlify...
echo ========================================================
call npm run build
echo.
echo Deploying dist folder to Netlify Production...
call npx netlify deploy --prod --dir=dist
echo.
echo If prompted to login, follow the browser login window.
pause
