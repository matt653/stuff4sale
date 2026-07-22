@echo off
echo Initializing Git and Pushing latest code to matt653/stuff4sale...
git init
git add .
git commit -m "Add multi-photo gallery support, photo carousel, and Netlify deployment"
git branch -M main
git remote add origin https://github.com/matt653/stuff4sale.git 2>nul
git remote set-url origin https://github.com/matt653/stuff4sale.git
git push -u origin main
echo.
echo SUCCESS! Code pushed to GitHub. Netlify will build automatically.
pause
