$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$ghCommand = Get-Command gh -ErrorAction SilentlyContinue
$gitCommand = Get-Command git -ErrorAction SilentlyContinue
$ghExe = if ($ghCommand) { $ghCommand.Source } else { Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\GitHub.cli_Microsoft.Winget.Source_8wekyb3d8bbwe\bin\gh.exe" }
$gitExe = if ($gitCommand) { $gitCommand.Source } else { Join-Path $env:ProgramFiles "Git\cmd\git.exe" }

if (-not (Test-Path $ghExe)) {
  throw "GitHub CLI is not installed. Install it with 'winget install --id GitHub.cli', then run 'gh auth login'."
}
if (-not (Test-Path $gitExe)) {
  throw "Git for Windows is not installed. Install it with 'winget install --id Git.Git'."
}
$env:PATH = "$(Split-Path $gitExe);$(Split-Path $ghExe);$env:PATH"

& $ghExe auth status
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI is not authenticated. Run 'gh auth login' in a terminal, then rerun the Portfolio: Publish task."
}
& $ghExe auth setup-git
if ($LASTEXITCODE -ne 0) { throw "GitHub CLI could not configure Git authentication." }

$account = (& $ghExe api user --jq .login).Trim()
if (-not $account) {
  throw "Could not identify the authenticated GitHub account."
}

$repositoryName = "gokulakrishnan-portfolio"
$repository = "$account/$repositoryName"
$repositoryUrl = "https://github.com/$repository.git"

if (-not (Test-Path (Join-Path $projectRoot ".git"))) {
  & $gitExe init --initial-branch main
  if ($LASTEXITCODE -ne 0) { throw "Could not initialize the Git repository." }
}

& $gitExe checkout -B main
if ($LASTEXITCODE -ne 0) { throw "Could not select the main branch." }

if (-not (& $gitExe config user.name)) { & $gitExe config user.name "Gokulakrishnan S" }
if (-not (& $gitExe config user.email)) { & $gitExe config user.email "sgkgokul2004@gmail.com" }

& $gitExe add -- .
if ($LASTEXITCODE -ne 0) { throw "Could not stage the portfolio files." }
& $gitExe diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  & $gitExe commit -m "Build editable portfolio and GitHub Pages site"
  if ($LASTEXITCODE -ne 0) { throw "Could not create the deployment commit." }
}

$remotes = @(& $gitExe remote)
if ($remotes -notcontains "origin") {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $ghExe repo view $repository --json nameWithOwner --jq .nameWithOwner 2>$null | Out-Null
  $repositoryExists = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $previousErrorActionPreference
  if ($repositoryExists) {
    & $gitExe remote add origin $repositoryUrl
  } else {
    & $ghExe repo create $repositoryName --public --source $projectRoot --remote origin
    if ($LASTEXITCODE -ne 0) { throw "Could not create the GitHub repository." }
  }
}

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $ghExe api "repos/$repository/pages" --jq .html_url 2>$null | Out-Null
$pagesEnabled = $LASTEXITCODE -eq 0
if (-not $pagesEnabled) {
  & $ghExe api "repos/$repository/pages" --method POST --field build_type=workflow | Out-Null
  $pagesEnabled = $LASTEXITCODE -eq 0
}
$ErrorActionPreference = $previousErrorActionPreference
if (-not $pagesEnabled) { throw "Could not enable GitHub Pages for $repository." }

& $gitExe push --set-upstream origin main
if ($LASTEXITCODE -ne 0) { throw "Push failed. Check the GitHub remote and repository permissions." }

Write-Host "Portfolio source pushed to https://github.com/$repository"
Write-Host "GitHub Pages URL: https://$account.github.io/$repositoryName/"
Write-Host "The first Pages deployment may take a few minutes."
