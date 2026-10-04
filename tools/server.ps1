# Tiny local game server in plain Windows PowerShell (no Python needed). Started hidden by Play.bat via play.ps1.
#   GET  /<file>     -> files from the game folder (no caching, so updates show up on refresh)
#   GET  /settings   -> settings.json (404 until the first save)
#   POST /settings   -> writes settings.json
#   GET  /update/check, POST /update/install, GET /update/status  -> in-game updater (worker: tools/update.ps1)
param([int]$Port = 8765)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12   # PS 5.1 defaults to TLS 1.0, GitHub refuses it
$Repo = 'NGJHD/rumble-arena'
$Api = if ($env:RUMBLE_UPDATE_API) { $env:RUMBLE_UPDATE_API } else { 'https://api.github.com' }   # override only for testing
$root = Split-Path -Parent $PSScriptRoot
$settings = Join-Path $root 'settings.json'
$mime = @{
    '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.json' = 'application/json'; '.css' = 'text/css'
    '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'
    '.ogg' = 'audio/ogg'; '.mp3' = 'audio/mpeg'; '.wav' = 'audio/wav'; '.md' = 'text/plain; charset=utf-8'
}

function Get-GameVersion {
    $m = [regex]::Match((Get-Content (Join-Path $root 'js\version.js') -Raw), "GAME_VERSION\s*=\s*'([^']+)'")
    if ($m.Success) { $m.Groups[1].Value } else { '0.0.0' }
}
function ConvertTo-VersionTriple($v) {   # 'v1.10.0' -> 1,10,0 ; anything unparseable -> $null (never offered)
    $m = [regex]::Match("$v", '^v?(\d+)\.(\d+)\.(\d+)$')
    if (-not $m.Success) { return $null }
    return @([int]$m.Groups[1].Value, [int]$m.Groups[2].Value, [int]$m.Groups[3].Value)
}
function Test-Newer($latest, $current) {
    $a = ConvertTo-VersionTriple $latest; $b = ConvertTo-VersionTriple $current
    if (-not $a -or -not $b) { return $false }
    for ($i = 0; $i -lt 3; $i++) { if ($a[$i] -ne $b[$i]) { return $a[$i] -gt $b[$i] } }
    return $false
}
function Get-UpdateInfo {
    $cur = Get-GameVersion
    try {
        $rel = Invoke-RestMethod -Uri "$Api/repos/$Repo/releases/latest" -Headers @{ 'User-Agent' = 'RumbleArena-Updater'; 'Accept' = 'application/vnd.github+json' } -TimeoutSec 15
    } catch {
        $code = $null; try { $code = [int]$_.Exception.Response.StatusCode } catch { }
        if ($code -eq 404) { return @{ ok = $false; current = $cur; error = 'No release has been published yet.' } }
        return @{ ok = $false; current = $cur; error = 'Could not reach GitHub. Check the internet connection.' }
    }
    $latest = "$($rel.tag_name)".TrimStart('v')
    $asset = @($rel.assets | Where-Object { $_.name -like '*.zip' }) | Select-Object -First 1
    $info = @{ ok = $true; current = $cur; latest = $latest; newer = (Test-Newer $latest $cur) }
    if ($asset) { $info.size = [long]$asset.size; $info.url = $asset.browser_download_url }
    elseif ($info.newer) { $info.ok = $false; $info.error = "Version $latest has no game zip attached." }
    return $info
}
function Send-Json($res, $obj, $code = 200) {
    $res.StatusCode = $code; $res.ContentType = 'application/json'
    $bytes = [Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Compress -Depth 4))
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() } catch { exit 1 }   # port busy: another copy is already serving

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request; $res = $ctx.Response
    try {
        $res.Headers.Add('Cache-Control', 'no-store, must-revalidate')
        $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
        if ($path -eq '/settings') {
            if ($req.HttpMethod -eq 'POST') {
                $body = (New-Object System.IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)).ReadToEnd()
                $null = $body | ConvertFrom-Json   # refuse anything that isn't JSON
                [IO.File]::WriteAllText("$settings.tmp", $body, (New-Object Text.UTF8Encoding($false)))
                Move-Item -Force "$settings.tmp" $settings
                $res.StatusCode = 204
            } elseif (Test-Path $settings) {
                $bytes = [IO.File]::ReadAllBytes($settings); $res.ContentType = 'application/json'
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else { $res.StatusCode = 404 }
            continue
        }
        if ($path -eq '/update/check') { $i = Get-UpdateInfo; $i.Remove('url'); Send-Json $res $i; continue }
        if ($path -eq '/update/status') {
            $sf = Join-Path $env:TEMP 'rumble-update-status.json'
            if (Test-Path $sf) { $bytes = [IO.File]::ReadAllBytes($sf); $res.ContentType = 'application/json'; $res.OutputStream.Write($bytes, 0, $bytes.Length) }
            else { Send-Json $res @{ state = 'idle' } }
            continue
        }
        if ($path -eq '/update/install' -and $req.HttpMethod -eq 'POST') {
            # the server re-checks GitHub itself and only ever downloads the release's own zip
            if (Test-Path (Join-Path $root '.git')) { Send-Json $res @{ ok = $false; error = 'This is a developer copy (it has git). Update it with git pull instead.' }; continue }
            try { $probe = Join-Path $root '.update-write-test'; [IO.File]::WriteAllText($probe, 'x'); Remove-Item $probe }
            catch { Send-Json $res @{ ok = $false; error = "The game folder is read-only: $root" }; continue }
            $i = Get-UpdateInfo
            if (-not $i.ok) { Send-Json $res @{ ok = $false; error = $i.error }; continue }
            if (-not $i.newer) { Send-Json $res @{ ok = $false; error = "Version $($i.current) is already the latest." }; continue }
            $u = [Uri]$i.url
            if (-not $env:RUMBLE_UPDATE_API -and $u.Host -notlike '*github.com' -and $u.Host -notlike '*githubusercontent.com') { Send-Json $res @{ ok = $false; error = 'Unexpected download location.' }; continue }
            Remove-Item (Join-Path $env:TEMP 'rumble-update-status.json') -ErrorAction SilentlyContinue
            Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -WorkingDirectory $root -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden',
                '-File', "`"$root\tools\update.ps1`"", '-Url', "`"$($i.url)`"", '-Version', $i.latest, '-Size', $i.size, '-Root', "`"$root`"", '-ServerPid', $PID, '-Port', $Port)
            Send-Json $res @{ ok = $true; version = $i.latest; size = $i.size }
            continue
        }
        if ($path -eq '/') { $path = '/index.html' }
        $file = [IO.Path]::GetFullPath((Join-Path $root $path.TrimStart('/')))
        if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $file -PathType Leaf)) { $res.StatusCode = 404; continue }
        $ext = [IO.Path]::GetExtension($file).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $bytes = [IO.File]::ReadAllBytes($file)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
        try { $res.StatusCode = 400 } catch { }
    } finally {
        try { $res.Close() } catch { }
    }
}
