@echo off
title Deploy Stuff4Sale to Netlify
cls
echo ===================================================================
echo             PUBLISHING STUFF4SALE TO NETLIFY
echo ===================================================================
echo.
echo [1/2] Building latest production assets into dist folder...
call npm run build
echo.
echo [2/2] Uploading and publishing dist folder to Netlify...
echo If this is your first time, Netlify will open a browser window to log in.
echo.
call npx netlify deploy --prod --dir=dist
echo.
echo ===================================================================
echo Done! Your live site at https://stuff4sale.netlify.app is updated!
echo ===================================================================
pause
