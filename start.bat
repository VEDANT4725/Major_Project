@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: Blueprint AI - Local Startup Script (.bat)
:: Starts MySQL, Spring Boot Backend, and React Frontend together
:: ============================================================================

title Blueprint AI - Local Launcher
color 0A

:: --- Set project root (folder where this .bat file lives) --------------------
set "ROOT=%~dp0"
if not defined ROOT set "ROOT=%CD%"

:: --- Prerequisite checks ------------------------------------------------------
echo.
echo ========================================================================
echo  Blueprint AI - Local Startup
echo ========================================================================
echo.

:: Check Java
where java >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java is not installed or not in PATH.
    echo         Please install Java 21 JDK from https://adoptium.net/
    echo.
    pause
    exit /b 1
)
echo [OK] Java found

:: Check Maven
where mvn >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Maven is not installed or not in PATH.
    echo         Please install Maven 3.9+ from https://maven.apache.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Maven found

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Please install Node.js 20+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH.
    echo.
    pause
    exit /b 1
)
echo [OK] npm found

:: --- Environment files --------------------------------------------------------
echo.
echo --- Checking environment files ---

:: Backend .env
if not exist "%ROOT%backend\.env" (
    echo [WARNING] backend/.env not found. Copying from .env.example...
    copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul
    echo [IMPORTANT] Please edit backend/.env with your MySQL password and AI API keys!
    echo.
) else (
    echo [OK] backend/.env exists
)

:: Frontend .env.local
if not exist "%ROOT%frontend\.env.local" (
    echo [WARNING] frontend/.env.local not found. Copying from .env.example...
    copy "%ROOT%frontend\.env.example" "%ROOT%frontend\.env.local" >nul
    echo [IMPORTANT] Please edit frontend/.env.local if needed!
    echo.
) else (
    echo [OK] frontend/.env.local exists
)

:: --- Start MySQL --------------------------------------------------------------
echo.
echo --- Starting MySQL ---
net start MySQL80 >nul 2>&1
if errorlevel 1 (
    net start mysql >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Could not auto-start MySQL service.
        echo         Please start MySQL manually (services.msc) and ensure
        echo         database 'blueprint_ai' exists.
    ) else (
        echo [OK] MySQL service started (mysql)
    )
) else (
    echo [OK] MySQL service started (MySQL80)
)

:: --- Start Backend (Spring Boot) in a new window ------------------------------
echo.
echo --- Starting Backend (Spring Boot on port 8080) ---
start "Blueprint Backend" cmd /c "cd /d ""%ROOT%backend"" && mvn spring-boot:run"

:: --- Start Frontend (React Vite) in a new window ------------------------------
echo.
echo --- Starting Frontend (React on port 3000) ---
start "Blueprint Frontend" cmd /c "cd /d ""%ROOT%frontend"" && npm run dev"

:: --- Wait for services to boot ------------------------------------------------
echo.
echo Waiting for services to start (15 seconds)...
timeout /t 15 /nobreak >nul

:: --- Open browser -------------------------------------------------------------
echo.
echo --- Opening browser ---
start http://localhost:3000

echo.
echo ========================================================================
echo  All services launched!
echo  - Backend : http://localhost:8080
echo  - Frontend: http://localhost:3000
echo ========================================================================
echo.
echo Keep this window open. Close it to stop the launcher script.
echo (The backend and frontend windows will keep running separately.)
echo.
pause