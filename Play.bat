@echo off
rem Starts the little game server (saves settings to settings.json in this folder) and opens the game.
rem Uses only Windows' built-in PowerShell. If the server can't start it opens index.html directly (settings then stay in the browser).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\play.ps1"
if errorlevel 1 pause
