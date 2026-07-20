Write-Host "🎲 Starting Friends Party Pack..." -ForegroundColor Green
Write-Host "Server API: http://localhost:3131" -ForegroundColor Cyan
Write-Host "Client App: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "For mobile/other devices on same network, use http://<YOUR_LAN_IP>:5173" -ForegroundColor Yellow
Write-Host "(e.g. http://192.168.x.x:5173)" -ForegroundColor Yellow
npx concurrently "npm run dev:server" "npm run dev:client"
