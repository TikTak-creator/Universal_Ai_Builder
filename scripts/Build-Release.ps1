[CmdletBinding()]
param([string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Push-Location $repo
$oldCommit = $env:FORMA_SOURCE_COMMIT
try {
  if ([Environment]::OSVersion.Platform -ne 'Win32NT') { throw 'Build the Windows installer on Windows.' }
  $dirty = git status --porcelain
  if ($LASTEXITCODE -ne 0) { throw 'Cannot read Git status.' }
  if ($dirty) { throw 'Commit or stash changes before building a release. The source ZIP must match the binaries.' }
  $commit = (git rev-parse HEAD).Trim()
  $version = (Get-Content package.json -Raw | ConvertFrom-Json).version
  if (!$OutputDirectory) { $OutputDirectory = Join-Path $repo ('release/v' + $version + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss')) }
  $out = [IO.Path]::GetFullPath($OutputDirectory)
  if (Test-Path -LiteralPath $out) { throw "Output already exists: $out. Choose a new directory." }
  New-Item -ItemType Directory -Path $out | Out-Null
  $work = Join-Path $repo ('.artifacts/build-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $work | Out-Null
  $source = Join-Path $out "Forma-$version-Source.zip"
  git archive --format=zip --output=$source $commit
  if ($LASTEXITCODE -ne 0) { throw 'git archive failed.' }
  Expand-Archive -LiteralPath $source -DestinationPath $work
  Push-Location $work
  try {
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
    npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Editor tests failed.' }
    npm.cmd run test:desktop
    if ($LASTEXITCODE -ne 0) { throw 'Desktop tests failed.' }
    npm.cmd audit --omit=dev --audit-level=moderate
    if ($LASTEXITCODE -ne 0) { throw 'Runtime dependency audit failed.' }
    $env:FORMA_SOURCE_COMMIT = $commit
    npm.cmd run package:win
    if ($LASTEXITCODE -ne 0) { throw 'Windows packaging failed.' }
    $setup = Join-Path $work "release/Forma-$version-Setup-win-x64.exe"
    if (!(Test-Path -LiteralPath $setup)) { throw 'Installer missing.' }
    Copy-Item -LiteralPath $setup -Destination $out
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $work 'release/win-unpacked'), (Join-Path $out "Forma-$version-Windows-x64.zip"), 'Optimal', $false)
    Copy-Item -LiteralPath release-manifest.json -Destination $out
    Copy-Item -LiteralPath (Join-Path $repo 'docs/WEB-DISTRIBUTION.md') -Destination dist/START-HERE.md
    [IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $work 'dist'), (Join-Path $out "Forma-$version-Web.zip"), 'Optimal', $false)
    $lines = Get-ChildItem -LiteralPath $out -File | Sort-Object Name | ForEach-Object { (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() + '  ' + $_.Name }
    [IO.File]::WriteAllLines((Join-Path $out 'SHA256SUMS.txt'), $lines, [Text.UTF8Encoding]::new($false))
    Write-Host "Release built from $commit"
    Write-Host "Artifacts: $out"
    Write-Host "Isolated build (kept for inspection): $work"
  } finally { Pop-Location }
} finally { $env:FORMA_SOURCE_COMMIT = $oldCommit; Pop-Location }
