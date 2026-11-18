$ErrorActionPreference = 'Stop'
$build = $PSScriptRoot

function Decode-UnicodeEscapes {
  param([string]$Text)
  $prev = $null
  while ($prev -ne $Text) {
    $prev = $Text
    $Text = [regex]::Replace($Text, '\\u([0-9A-Fa-f]{4})', { param($m) [char][int]('0x' + $m.Groups[1].Value) })
  }
  return $Text
}

function Set-TextFile {
  param([string]$Source, [string]$Target)
  $raw = [System.IO.File]::ReadAllText($Source, [System.Text.Encoding]::UTF8)
  $decoded = Decode-UnicodeEscapes -Text $raw
  [System.IO.File]::WriteAllText($Target, $decoded, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host ('Kirjoitettu: ' + $Target)
}

Set-TextFile -Source "$build\txt_extract_system.txt" -Target "$build\out_extract_system.txt"
Set-TextFile -Source "$build\txt_extract_user.txt" -Target "$build\out_extract_user.txt"
Set-TextFile -Source "$build\txt_rule3.txt" -Target "$build\out_rule3.txt"
Set-TextFile -Source "$build\txt_rule3b.txt" -Target "$build\out_rule3b.txt"
Set-TextFile -Source "$build\txt_rule3c.txt" -Target "$build\out_rule3c.txt"
Set-TextFile -Source "$build\txt_rule10a.txt" -Target "$build\out_rule10a.txt"
Write-Host 'Dekoodaus valmis.'
