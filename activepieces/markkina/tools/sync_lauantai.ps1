$ErrorActionPreference = 'Stop'
# Paivittaa Lauantai.json-peilin tools/-kansion tiedostoista. Aja taman jalkeen, kun
# tyonkulun koodia tai kehotteita on muutettu Activepiecesissa MCP-tyokaluilla, jotta
# repossa oleva peili vastaa instanssia.
#
# Paivitettavat askeleet:
#   step_12  koodi (step12_scrape.js) + max_age_hours
#   step_13  koodi (step13_compact.js) + max_age_hours
#   step_14  system- ja user-kehotteet (txt_lauantai_system.txt, txt_lauantai_user.txt)
#   step_17  koodi (step17_weekly_quotes.js)
#
# HUOM: step_6:n kehote, hakulauseet ja tallennuspolku pidaan synkronissa katevin;
# ne voi lisata tahan samalla kaavalla.
$root = (Split-Path -Parent $PSScriptRoot)
$build = $PSScriptRoot
$p = "$root\Lauantai.json"

function Read-Utf8 { param([string]$File) return [System.IO.File]::ReadAllText($File, [System.Text.Encoding]::UTF8) }

# ConvertFrom-Json tuottaa PSCustomObject-olioita, joihin ei voi lisata uusia
# ominaisuuksia suoraan. Tama lisaa tai paivittaa annetun ominaisuuden.
function Set-Prop {
  param($Obj, [string]$Name, $Value)
  if ($Obj.PSObject.Properties.Name -contains $Name) { $Obj.$Name = $Value }
  else { $Obj | Add-Member -NotePropertyName $Name -NotePropertyValue $Value }
}

$json = (Read-Utf8 -File $p).TrimStart([char]0xFEFF) | ConvertFrom-Json

$map = @{}
$a = $json.flows[0].trigger.nextAction
while ($a) { $map[$a.name] = $a; $a = $a.nextAction }
foreach ($need in @('step_2', 'step_12', 'step_13', 'step_14', 'step_17')) {
  if (-not $map.ContainsKey($need)) { throw ('Askel puuttuu: ' + $need) }
}

# Hakulause (step_2:aan): tuloskausiluvut mukaan, jotta raportissa on tuoreet luvut.
$map['step_2'].settings.input.query = 'global stock market weekly wrap summary biggest moves last week earnings season results revenue growth S&P 500 companies reported'

# Koodiaskeleet ja aikarajat
$map['step_12'].settings.sourceCode.code = Read-Utf8 -File "$build\step12_scrape.js"
Set-Prop -Obj $map['step_12'].settings.input -Name 'max_age_hours' -Value 120
$map['step_13'].settings.sourceCode.code = Read-Utf8 -File "$build\step13_compact.js"
Set-Prop -Obj $map['step_13'].settings.input -Name 'max_age_hours' -Value 120
$map['step_17'].settings.sourceCode.code = Read-Utf8 -File "$build\step17_weekly_quotes.js"

# Kehotteet
$map['step_14'].settings.input.body.data.messages[0].content = (Read-Utf8 -File "$build\txt_lauantai_system.txt").Trim()
$map['step_14'].settings.input.body.data.messages[1].content = (Read-Utf8 -File "$build\txt_lauantai_user.txt").Trim()

# Kirjoitus UTF-8-BOM:illa: ilman sita PowerShell 5.1 lukee aakkoset vaarin.
$text = $json | ConvertTo-Json -Depth 100
$bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
$ms = New-Object System.IO.MemoryStream
$ms.WriteByte(0xEF); $ms.WriteByte(0xBB); $ms.WriteByte(0xBF)
$ms.Write($bytes, 0, $bytes.Length)
[System.IO.File]::WriteAllBytes($p, $ms.ToArray())
$ms.Dispose()
Write-Host 'Lauantai.json paivitetty tools/-kansion tiedostoista.'
