@echo off
rem Starts the little game server (saves settings to settings.json in this folder) and opens the game.
cd /d "%~dp0"
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:8765/index.html -TimeoutSec 1 | Out-Null } catch { Start-Process pythonw -ArgumentList 'tools\devserver.py' -WindowStyle Hidden; Start-Sleep -Milliseconds 800 }"
start "" "http://localhost:8765/index.html"
