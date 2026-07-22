@echo off
echo Initializing Git and Pushing to matt653/stuff4sale...
git init
git add .
git commit -m "Initial commit with Netlify functions and Firebase sync"
git branch -M main
git remote add origin https://github.com/matt653/stuff4sale.git 2>nul
git remote set-url origin https://github.com/matt653/stuff4sale.git
git push -u origin main
echo Done! Refresh Netlify now.
pause
