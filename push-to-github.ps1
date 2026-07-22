Write-Host "Initializing Git and Pushing to matt653/stuff4sale..." -ForegroundColor Green
git init
git add .
git commit -m "Initial commit with Netlify functions and Firebase sync"
git branch -M main
git remote add origin https://github.com/matt653/stuff4sale.git 2>$null
git remote set-url origin https://github.com/matt653/stuff4sale.git
git push -u origin main
Write-Host "Done! Refresh Netlify now." -ForegroundColor Cyan
