Write-Host "======================================================================" -ForegroundColor Magenta
Write-Host "             STARTING CINEVERSE APPLICATION" -ForegroundColor Magenta
Write-Host "======================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Application URL:  http://localhost:8080" -ForegroundColor Green
Write-Host "H2 Console:      http://localhost:8080/h2-console" -ForegroundColor Green
Write-Host ""
Write-Host "Logins for testing:" -ForegroundColor Cyan
Write-Host "  - Admin Account: admin@cineverse.com / admin123" -ForegroundColor Cyan
Write-Host "  - User Account:  user@gmail.com / user123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to terminate the application." -ForegroundColor Yellow
Write-Host ""
Write-Host "Running..." -ForegroundColor Yellow

java -jar backend\target\backend-0.0.1-SNAPSHOT.jar
