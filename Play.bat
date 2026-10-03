@echo off
rem Starts the little game server (saves settings to settings.json in this folder) and opens the game.
rem Needs Python (python.org). Without Python it opens index.html directly (settings then stay in the browser).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\play.ps1"
if errorlevel 1 pause
