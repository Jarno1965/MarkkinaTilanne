$errs = $null
$tokens = $null
foreach ($f in (Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '..\activepieces') -Filter '*.ps1' -Recurse)) {
  [void][System.Management.Automation.Language.Parser]::ParseFile($f.FullName, [ref]$tokens, [ref]$errs)
  Write-Host ($f.Name + ': ' + $errs.Count + ' jasennysvirhetta')
}
