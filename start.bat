@echo off
echo Démarrage de l'application V.A.L.O.R...

:: 1. Ouvre le navigateur par défaut
start http://localhost:8000

:: 2. Lance le serveur PowerShell en contournant la politique de sécurité temporairement
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0server.ps1'"

pause
