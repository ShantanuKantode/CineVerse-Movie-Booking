@echo off
echo ======================================================================
echo              STARTING CINEVERSE APPLICATION
echo ======================================================================
echo.
echo Application URL:  http://localhost:8080
echo H2 Console:      http://localhost:8080/h2-console
echo.
echo Logins for testing:
echo   - Admin Account: admin@cineverse.com / admin123
echo   - User Account:  user@gmail.com / user123
echo.
echo Press Ctrl+C to terminate the application.
echo.
echo Running...
java -jar backend\target\backend-0.0.1-SNAPSHOT.jar
pause
