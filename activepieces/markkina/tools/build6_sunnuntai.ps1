$ErrorActionPreference = 'Stop'
# Rakentaa "Sunnuntai" (sunnuntain viikkoennakko) -tyonkulun paikallisen JSON-tiedoston
# Lauantai.json-rakenteesta. Sunnuntai on sama 17 askeleen runko, mutta sisalto katsoo
# ETEENPAIN alkavaan viikkoon ja raportin loppuun tulee pakollinen spekulaatio-osio.
# Askelten nimet ovat samat kuin instanssissa (MCP-klooni sai samat nimet), joten
# uudelleennumerointia ei tarvita.
#
# HUOM externalId: instanssin Sunnuntai-tyonkulku on luotu kloonaamalla Lauantai, joten sen
# externalId on uusi eika tiedossa taalla. Tiedostossa on tyonkulun historiallinen
# Sunnuntai-tunnus, joten import-to-activepieces.ps1 ei loyda sita externalId:lla vaan
# osuu tyonkulkuun nimen "Sunnuntai" perusteella.
$root = (Split-Path -Parent $PSScriptRoot)
$build = $PSScriptRoot
$srcPath = "$root\Lauantai.json"
$outPath = "$root\Sunnuntai.json"

function Read-Utf8 { param([string]$File) return [System.IO.File]::ReadAllText($File, [System.Text.Encoding]::UTF8) }
function Write-Utf8Bom {
  param([string]$File, [string]$Text)
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  $ms = New-Object System.IO.MemoryStream
  $ms.WriteByte(0xEF); $ms.WriteByte(0xBB); $ms.WriteByte(0xBF)
  $ms.Write($bytes, 0, $bytes.Length)
  [System.IO.File]::WriteAllBytes($File, $ms.ToArray())
  $ms.Dispose()
}

$json = (Read-Utf8 -File $srcPath).TrimStart([char]0xFEFF) | ConvertFrom-Json
$json.name = 'Sunnuntai'
$json.flows[0].displayName = 'Sunnuntai'
if ($json.metadata.PSObject.Properties.Name -contains 'externalId') { $json.metadata.externalId = '6mF0HkP7AU5NIFE2FASfv' }

# --- Trigger: sunnuntai klo 08:00 (Europe/Helsinki) ---
$json.flows[0].trigger.settings.input.day_of_the_week = 0
$json.flows[0].trigger.settings.input.hour_of_the_day = 8

$map = @{}
$a = $json.flows[0].trigger.nextAction
while ($a) { $map[$a.name] = $a; $a = $a.nextAction }
foreach ($need in @('step_1','step_2','step_3','step_4','step_5','step_6','step_7','step_8','step_9','step_10','step_11','step_12','step_13','step_14','step_15','step_16','step_17')) {
  if (-not $map.ContainsKey($need)) { throw ('Askel puuttuu: ' + $need) }
}

# --- 1. Paahaut: alkavan viikon nakyma ---
$map['step_2'].displayName = 'Search global week ahead'
$map['step_2'].settings.input.query = 'global stock market week ahead outlook what investors are watching next week S&P 500 Nasdaq Fed rate decision earnings preview'

$map['step_3'].displayName = 'Search Europe week ahead'
$map['step_3'].settings.input.query = 'European stock market week ahead outlook STOXX 600 DAX FTSE 100 OMX Helsinki ECB eurozone economic calendar next week'

# --- 2. Viikonlopun uutiset ja alkavan viikon kalenteri ---
$map['step_4'].displayName = 'Search weekend news and geopolitics'
$map['step_4'].settings.input.query = 'weekend market news geopolitics tariffs OPEC oil central banks bitcoin crypto Monday market open outlook'
$map['step_4'].settings.input.days = '2'

$map['step_5'].displayName = 'Search next week events'
$map['step_5'].settings.input.query = 'most anticipated market events next week economic calendar earnings releases central bank decisions preview consensus expectations'

# --- 3. Tapahtumapoimija (step_6) ---
$map['step_6'].displayName = 'Ask LLM (upcoming events)'
$map['step_6'].settings.input.body.data.messages[0].content = (Read-Utf8 -File "$build\txt_sunnuntai_extract_system.txt").Trim()
$map['step_6'].settings.input.body.data.messages[1].content = (Read-Utf8 -File "$build\txt_sunnuntai_extract_user.txt").Trim()

# --- 4. Parsinta (step_7) ja tapahtumahaut (step_8-10) ---
$map['step_7'].settings.sourceCode.code = Read-Utf8 -File "$build\step14_sunnuntai.js"
foreach ($pair in @(@('step_8','q1','Search event 1 outlook'), @('step_9','q2','Search event 2 outlook'), @('step_10','q3','Search event 3 outlook'))) {
  $sn = $pair[0]
  $map[$sn].displayName = $pair[2]
  $map[$sn].settings.input.query = "{{step_7['output']['" + $pair[1] + "']}}"
  $map[$sn].settings.input.time_range = 'week'
}

# --- 5. Lahtotason kurssit (step_17) ---
$map['step_17'].settings.sourceCode.code = Read-Utf8 -File "$build\step17_startpoint_quotes.js"

# --- 6. Firecrawl: alkavan viikon ennakot ---
$map['step_11'].displayName = 'Scrape week ahead articles (Firecrawl)'
$map['step_11'].settings.input.query = 'stock market week ahead outlook key events to watch next week scenarios strategists preview'

# --- 7. Tiivistys LLM:lle (step_13) ---
$map['step_13'].settings.sourceCode.code = Read-Utf8 -File "$build\step13_compact_sunnuntai.js"
$map['step_13'].settings.input.label_asia = 'GLOBAALIT MARKKINAT JA ALKAVAN VIIKON NÄKYMÄ'
$map['step_13'].settings.input.label_europe = 'EUROOPPA JA HELSINKI – ALKAVAN VIIKON NÄKYMÄ'

# --- 8. HTML-raportti (step_14) ---
$map['step_14'].settings.input.body.data.messages[0].content = (Read-Utf8 -File "$build\txt_sunnuntai_system.txt").Trim()
$map['step_14'].settings.input.body.data.messages[1].content = (Read-Utf8 -File "$build\txt_sunnuntai_user.txt").Trim()

# --- 9. Tallennus: tiedostonimi ja viesti ---
$s16 = $map['step_16'].settings.input
$s16.url.url = $s16.url.url.Replace('-viikkokatsaus.html', '-viikkoennakko.html')
$s16.body.data.message = 'Lisätty sunnuntain viikkoennakko'

$text = $json | ConvertTo-Json -Depth 100
Write-Utf8Bom -File $outPath -Text $text
Write-Host ('Kirjoitettu: ' + $outPath)
