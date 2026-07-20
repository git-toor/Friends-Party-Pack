# Start Friends Party Pack in dev mode
Write-Host "🎲 Starting Friends Party Pack..." -ForegroundColor Green
Write-Host "Server: http://localhost:3131" -ForegroundColor Cyan
Write-Host "Client: http://localhost:5173" -ForegroundColor Cyan

# Start server and client concurrently
npx concurrently "npm run dev:server" "npm run dev:client"
