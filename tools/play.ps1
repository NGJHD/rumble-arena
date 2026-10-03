# Launcher used by Play.bat: start tools/devserver.py if it isn't running, wait until it answers, open the game.
$root = Split-Path -Parent $PSScriptRoot
$url = 'http://localhost:8765/index.html'

function Test-Server {
    try { Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 1 | Out-Null; return $true } catch { return $false }
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
Start-Process $url
