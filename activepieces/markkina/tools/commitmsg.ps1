$first = $true
$path = (Join-Path (Split-Path -Parent $PSScriptRoot) 'Aamuraportti.json')
$json = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8).TrimStart([char]0xFEFF) | ConvertFrom-Json
$a = $json.flows[0].trigger.nextAction
while ($a) {
  if ($a.name -eq 'step_4') {
    $a.settings.input.body.data.message = 'Aamuraportti: odotetut tapahtumat ja tuoreus'
    Write-Host 'step_4 viesti paivitetty.'
  }
  $a = $a.nextAction
}
$out = $json | ConvertTo-Json -Depth 100
$bytes = [System.Text.Encoding]::UTF8.GetBytes($out)
$ms = New-Object System.IO.MemoryStream
$ms.WriteByte(0xEF); $ms.WriteByte(0xBB); $ms.WriteByte(0xBF)
$ms.Write($bytes, 0, $bytes.Length)
[System.IO.File]::WriteAllBytes($path, $ms.ToArray())
$ms.Dispose()
Write-Host 'Valmis.'
