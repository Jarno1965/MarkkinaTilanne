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

$files = @(
  'txt_extract_system.txt','txt_extract_user.txt',
  'txt_rule3.txt','txt_rule3b.txt','txt_rule3c.txt','txt_rule10a.txt',
  'txt_ruleprice1.txt','txt_ruleprice1b.txt','txt_ruleevent.txt','txt_rule3_short.txt',
  'txt_rule10.txt'
)

foreach ($f in $files) {
  $src = "$build\$f"
  if (-not (Test-Path -LiteralPath $src)) { Write-Host ('ohitetaan: ' + $f); continue }
  $target = Join-Path $build ('out_' + $f.Substring(4))
  $decoded = Decode-UnicodeEscapes -Text ([System.IO.File]::ReadAllText($src, [System.Text.Encoding]::UTF8))
  [System.IO.File]::WriteAllText($target, $decoded, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host ('kirjoitettu: ' + (Split-Path -Leaf $target))
}
Write-Host 'Dekoodaus valmis.'
