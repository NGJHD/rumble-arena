# Launcher used by Play.bat: start tools/devserver.py if it isn't running, wait until it answers, open the game.
$root = Split-Path -Parent $PSScriptRoot
$url = 'http://localhost:8765/index.html'

function Test-Server {
    # plain TCP connect: instant (Invoke-WebRequest can stall on proxy detection)
    $c = New-Object System.Net.Sockets.TcpClient
    try { $ok = $c.ConnectAsync('127.0.0.1', 8765).Wait(500) -and $c.Connected } catch { $ok = $false }
    $c.Close(); return $ok
}

if (-not (Test-Server)) {
    # python.org installs 'py' (launcher) and 'pythonw'; some PCs only have 'python'. Skip the Microsoft Store stub.
    $cands = @(@('pyw', @('-3')), @('pythonw', @()), @('py', @('-3')), @('python', @()))
    $started = $false
    foreach ($c in $cands) {
        $cmd = Get-Command $c[0] -ErrorAction SilentlyContinue
        if (-not $cmd -or $cmd.Source -like '*WindowsApps*') { continue }
        $argList = $c[1] + @("`"$root\tools\devserver.py`"")
        Start-Process -FilePath $cmd.Source -ArgumentList $argList -WorkingDirectory $root -WindowStyle Hidden
        $started = $true
        break
    }
    if (-not $started) {
        Write-Host 'Python was not found, so settings will only be saved inside the browser.'
        Write-Host 'Install Python from https://www.python.org/ (tick "Add python.exe to PATH") to save settings to settings.json.'
        Start-Process "$root\index.html"
        exit 1
    }
    # wait up to 15 s for the server to answer
    $ok = $false
    for ($i = 0; $i -lt 60; $i++) { Start-Sleep -Milliseconds 250; if (Test-Server) { $ok = $true; break } }
    if (-not $ok) {
        Write-Host 'The game server did not start (is port 8765 in use?). Opening index.html instead.'
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
