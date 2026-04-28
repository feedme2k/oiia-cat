$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$packageRoot = Join-Path $dist "oiia-cat"
$zipPath = Join-Path $dist "oiia-cat-extension.zip"

if (Test-Path $packageRoot) {
  Remove-Item $packageRoot -Recurse -Force
}

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

New-Item -ItemType Directory -Path $packageRoot | Out-Null

$files = @(
  "content.js",
  "manifest.json",
  "popup.css",
  "popup.html",
  "popup.js",
  "viewer.html",
  "viewer.js"
)

$directories = @(
  "assets",
  "vendor"
)

foreach ($file in $files) {
  Copy-Item -Path (Join-Path $root $file) -Destination $packageRoot
}

foreach ($directory in $directories) {
  Copy-Item -Path (Join-Path $root $directory) -Destination $packageRoot -Recurse
}

Compress-Archive -Path (Join-Path $packageRoot "*") -DestinationPath $zipPath -Force

Write-Output "Created $zipPath"
