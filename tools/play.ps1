# Launcher used by Play.bat: start the local game server (tools/server.ps1, plain PowerShell - no Python needed)
# if it isn't running, wait until it answers, then open the game.
$root = Split-Path -Parent $PSScriptRoot
$url = 'http://localhost:8765/index.html'

function Test-Server {
    # plain TCP connect: instant (Invoke-WebRequest can stall on proxy detection)
    $c = New-Object System.Net.Sockets.TcpClient
    try { $ok = $c.ConnectAsync('127.0.0.1', 8765).Wait(500) -and $c.Connected } catch { $ok = $false }
    $c.Close(); return $ok
}

if (-not (Test-Server)) {
    Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -WorkingDirectory $root `
        -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', "`"$root\tools\server.ps1`"")
    # wait up to 15 s for the server to answer
    $ok = $false
    for ($i = 0; $i -lt 60; $i++) { Start-Sleep -Milliseconds 250; if (Test-Server) { $ok = $true; break } }
    if (-not $ok) {
        Write-Host 'The game server did not start (is port 8765 in use?). Opening index.html instead.'
        Write-Host 'Settings will then only be saved inside the browser.'
        Start-Process "$root\index.html"
        exit 1
    }
}
# Open as its own app window (Edge or Chrome) with autoplay allowed, so the title music starts straight away.
# A separate profile folder makes the flags apply even when the browser is already open.
$browsers = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")
$exe = $browsers | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if ($exe) {
    $profDir = Join-Path $env:LOCALAPPDATA (Join-Path 'RumbleArena' 'browser')
    Start-Process -FilePath $exe -ArgumentList @("--app=$url", '--autoplay-policy=no-user-gesture-required', "--user-data-dir=`"$profDir`"", '--start-maximized', '--no-first-run', '--no-default-browser-check')
} else {
    Start-Process $url
}
