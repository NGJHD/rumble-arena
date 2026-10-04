# In-game updater worker. Started hidden by tools/server.ps1 (POST /update/install); the game polls /update/status.
# Download the release zip -> unpack in %TEMP% -> verify version -> robocopy over the game folder -> restart the server.
# Any failure before the copy leaves the installed game untouched.
param([string]$Url, [string]$Version, [long]$Size = 0, [string]$Root, [int]$ServerPid = 0, [int]$Port = 8765)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12   # PS 5.1 defaults to TLS 1.0, GitHub refuses it
$prefix = 'rumble-update-'
$statusFile = Join-Path $env:TEMP 'rumble-update-status.json'
$log = Join-Path $Root 'update.log'

function Set-Status($state, $msg, $got = 0, $total = 0) {
    $o = [ordered]@{ state = $state; msg = $msg; got = $got; total = $total; version = $Version; time = (Get-Date).ToString('s') }
    [IO.File]::WriteAllText($statusFile, ($o | ConvertTo-Json -Compress), (New-Object Text.UTF8Encoding($false)))
    Add-Content -Path $log -Value "$(Get-Date -Format s) [$state] $msg" -ErrorAction SilentlyContinue
}

# sweep staging folders left behind by an interrupted update (only our own prefix, older than a day)
Get-ChildItem $env:TEMP -Directory -Filter "$prefix*" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

$stage = Join-Path $env:TEMP ($prefix + [Guid]::NewGuid().ToString('N').Substring(0, 8))
try {
    New-Item -ItemType Directory -Path $stage | Out-Null
    $zip = Join-Path $stage 'release.zip'

    # 1. download with progress
    Set-Status 'download' 'Downloading...' 0 $Size
    $req = [Net.HttpWebRequest]::Create($Url); $req.UserAgent = 'RumbleArena-Updater'; $req.Timeout = 30000
    $resp = $req.GetResponse(); if ($resp.ContentLength -gt 0) { $Size = $resp.ContentLength }
    $in = $resp.GetResponseStream(); $out = [IO.File]::Create($zip)
    $buf = New-Object byte[] 262144; $got = 0; $tick = [Diagnostics.Stopwatch]::StartNew()
    while (($n = $in.Read($buf, 0, $buf.Length)) -gt 0) {
        $out.Write($buf, 0, $n); $got += $n
        if ($tick.ElapsedMilliseconds -gt 250) { Set-Status 'download' 'Downloading...' $got $Size; $tick.Restart() }
    }
    $out.Close(); $in.Close(); $resp.Close()
    Set-Status 'download' 'Downloaded' $got $Size

    # 2. unpack: Windows' own bsdtar reads zip (never the tar on PATH: Git's GNU tar can't)
    Set-Status 'unpack' 'Unpacking...'
    $unpack = Join-Path $stage 'files'; New-Item -ItemType Directory -Path $unpack | Out-Null
    $tar = Join-Path $env:SystemRoot 'System32\tar.exe'
    if (Test-Path $tar) { & $tar -xf $zip -C $unpack; if ($LASTEXITCODE -ne 0) { throw "tar failed ($LASTEXITCODE)" } }
    else { Expand-Archive -Path $zip -DestinationPath $unpack }

    # 3. verify: it is the game, and its version is the one the release claimed
    $game = Get-ChildItem $unpack -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'index.html') } | Select-Object -First 1
    if (-not $game -and (Test-Path (Join-Path $unpack 'index.html'))) { $game = Get-Item $unpack }
    if (-not $game) { throw 'The download does not contain the game (no index.html).' }
    $verFile = Join-Path $game.FullName 'js\version.js'
    if (Test-Path $verFile) {
        $m = [regex]::Match((Get-Content $verFile -Raw), "GAME_VERSION\s*=\s*'([^']+)'")
        if ($m.Success -and $m.Groups[1].Value -ne $Version) { throw "Version mismatch: release says $Version, files say $($m.Groups[1].Value)." }
    }

    # 4. copy over the game folder. No /MIR: never delete the player's own files (settings.json etc.)
    Set-Status 'copy' 'Installing...'
    & robocopy $game.FullName $Root /E /R:3 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Copying the new files failed (robocopy $LASTEXITCODE)." }   # 0-7 = success

    # 5. restart the server so its own new code is used, then report done (the new server serves this status)
    Set-Status 'restart' 'Restarting...'
    if ($ServerPid) { Stop-Process -Id $ServerPid -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 500 }
    Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -WorkingDirectory $Root `
        -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', "`"$Root\tools\server.ps1`"", '-Port', $Port)
    Set-Status 'done' "Updated to version $Version"
} catch {
    Set-Status 'error' $_.Exception.Message
    # if we stopped the server before failing, bring it back
    if ($ServerPid -and -not (Get-Process -Id $ServerPid -ErrorAction SilentlyContinue)) {
        Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -WorkingDirectory $Root `
            -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', "`"$Root\tools\server.ps1`"", '-Port', $Port)
    }
} finally {
    if ($stage -like "*\$prefix*") { Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue }   # only our own staging folder
}
