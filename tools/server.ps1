# Tiny local game server in plain Windows PowerShell (no Python needed). Started hidden by Play.bat via play.ps1.
#   GET  /<file>     -> files from the game folder (no caching, so updates show up on refresh)
#   GET  /settings   -> settings.json (404 until the first save)
#   POST /settings   -> writes settings.json
param([int]$Port = 8765)
$root = Split-Path -Parent $PSScriptRoot
$settings = Join-Path $root 'settings.json'
$mime = @{
    '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.json' = 'application/json'; '.css' = 'text/css'
    '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'
    '.ogg' = 'audio/ogg'; '.mp3' = 'audio/mpeg'; '.wav' = 'audio/wav'; '.md' = 'text/plain; charset=utf-8'
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
