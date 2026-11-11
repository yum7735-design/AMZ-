[CmdletBinding()]
param(
    [string]$SourceRoot = 'D:\Codex\home\skills',
    [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$destinationRoot = Join-Path $RepositoryRoot 'skills'
if (-not (Test-Path -LiteralPath $SourceRoot -PathType Container)) {
    throw "Skill source directory does not exist: $SourceRoot"
}
if (-not (Test-Path -LiteralPath $destinationRoot -PathType Container)) {
    throw "Repository skills directory does not exist: $destinationRoot"
}

$excludedDirectoryNames = @(
    '.git', '.venv', 'venv', 'node_modules', '__pycache__',
    'output', 'outputs', 'tmp', 'temp', 'cookies'
)
$excludedFilePatterns = @(
    '.env', '.env.*', '*.pem', '*.key', '*credentials*.json',
    '*cookies*.json', 'cookies_raw.txt', '*.log', '*.pyc', '*.pyo', '*.bak'
)
$textExtensions = @(
    '.bat', '.cmd', '.ini', '.js', '.json', '.md', '.mjs', '.ps1', '.py',
    '.sh', '.toml', '.txt', '.yaml', '.yml'
)
$sensitivePattern = '(?i)(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|(app_secret|api[_-]?key|secret|token|password)\s*[:=]\s*["''][^"'']{8,})'

$copiedFiles = 0
$trackedSkills = Get-ChildItem -LiteralPath $destinationRoot -Directory | Sort-Object Name

foreach ($trackedSkill in $trackedSkills) {
    $sourceSkill = Join-Path $SourceRoot $trackedSkill.Name
    if (-not (Test-Path -LiteralPath $sourceSkill -PathType Container)) {
        Write-Verbose "Skipping repository-only skill: $($trackedSkill.Name)"
        continue
    }

    $sourcePrefixLength = $sourceSkill.TrimEnd('\').Length + 1
    $files = Get-ChildItem -LiteralPath $sourceSkill -File -Recurse | Where-Object {
        $candidateName = $_.Name
        $relativePath = $_.FullName.Substring($sourcePrefixLength)
        $segments = $relativePath -split '[\\/]'
        $containsExcludedDirectory = @($segments | Where-Object {
            $excludedDirectoryNames -contains $_
        }).Count -gt 0
        $matchesExcludedFile = @($excludedFilePatterns | Where-Object {
            $candidateName -like $_
        }).Count -gt 0
        -not $containsExcludedDirectory -and -not $matchesExcludedFile
    }

    foreach ($file in $files) {
        if ($textExtensions -contains $file.Extension.ToLowerInvariant()) {
            $content = Get-Content -LiteralPath $file.FullName -Raw
            if ($content -match $sensitivePattern) {
                Write-Warning "Skipping a file containing a possible credential: $($trackedSkill.Name)/$($file.Name)"
                continue
            }
        }
        $relativePath = $file.FullName.Substring($sourcePrefixLength)
        $destinationFile = Join-Path $trackedSkill.FullName $relativePath
        $destinationDirectory = Split-Path -Parent $destinationFile
        if (-not (Test-Path -LiteralPath $destinationDirectory)) {
            New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
        }
        Copy-Item -LiteralPath $file.FullName -Destination $destinationFile -Force
        $copiedFiles++
    }
}

Write-Output "Synchronized $copiedFiles files across existing repository skills."
Write-Output 'No repository files were deleted and no new skill directories were added.'
