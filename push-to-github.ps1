# Run after creating an empty repo on GitHub
# Usage: .\push-to-github.ps1
#        .\push-to-github.ps1 Prix11 Angel-Bakes

param(
  [string]$Username = "Prix11",
  [string]$RepoName = "Angel-Bakes"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path .git)) {
  git init
  git branch -M main
}

git add .
git status

$hasCommits = git rev-parse HEAD 2>$null
if (-not $hasCommits) {
  git commit -m "Angel Bakes: shop, orders, admin, deploy configs"
} else {
  git commit -m "Update Angel Bakes" 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Host "Nothing new to commit (or commit failed)." }
}

$remote = "https://github.com/$Username/$RepoName.git"
git remote remove origin 2>$null
git remote add origin $remote

Write-Host ""
Write-Host "Pushing to $remote ..."
Write-Host "GitHub will ask you to sign in if needed."
git push -u origin main

Write-Host ""
Write-Host "Done! Next: open DEPLOY.md and deploy on Render or Railway."
