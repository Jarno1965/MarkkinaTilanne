$ErrorActionPreference = 'Stop'
$root = (Split-Path -Parent $PSScriptRoot)
$build = $PSScriptRoot

function Read-Utf8 { param([string]$File) return [System.IO.File]::ReadAllText($File, [System.Text.Encoding]::UTF8) }
function Write-Utf8Bom { param([string]$File, [string]$Text)
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  $ms = New-Object System.IO.MemoryStream
  $ms.WriteByte(0xEF); $ms.WriteByte(0xBB); $ms.WriteByte(0xBF)
  $ms.Write($bytes, 0, $bytes.Length)
  [System.IO.File]::WriteAllBytes($File, $ms.ToArray())
  $ms.Dispose()
}
function Clone { param($Obj) return (($Obj | ConvertTo-Json -Depth 100) | ConvertFrom-Json) }

$path = "$root\Aamuraportti.json"
$json = (Read-Utf8 -File $path).TrimStart([char]0xFEFF) | ConvertFrom-Json

$map = @{}
$a = $json.flows[0].trigger.nextAction
while ($a) { $map[$a.name] = $a; $a = $a.nextAction }

# 1. Poimijan kehote
$map['step_13'].settings.input.body.data.messages[0].content = (Read-Utf8 -File "$build\out_extract_system.txt").Trim()

# 2. Parsinta lukee koko poimijan vastauksen ja valittaa tikkereita
$map['step_14'].settings.sourceCode.code = Read-Utf8 -File "$build\step14.js"
$map['step_14'].settings.input = [pscustomobject][ordered]@{ raw = "{{step_13['output']}}" }

# 3. step_9 uusi koodi ja syotteet
$map['step_9'].settings.sourceCode.code = Read-Utf8 -File "$build\step9.js"
$map['step_9'].settings.input = [pscustomobject][ordered]@{
  label_asia     = 'AASIA JA USA'
  label_europe   = 'EUROOPPA JA HELSINKI'
  fresh_hours    = 3
  step_7_answer  = "{{step_7['output']['answer']}}"
  step_7_results = "{{step_7['output']['results']}}"
  step_8_answer  = "{{step_8['output']['answer']}}"
  step_8_results = "{{step_8['output']['results']}}"
  market_data    = "{{step_6['output']['marketData']}}"
  step_15_answer  = "{{step_15['output']['answer']}}"
  step_15_results = "{{step_15['output']['results']}}"
  step_16_answer  = "{{step_16['output']['answer']}}"
  step_16_results = "{{step_16['output']['results']}}"
  step_17_answer  = "{{step_17['output']['answer']}}"
  step_17_results = "{{step_17['output']['results']}}"
  watchlist       = "{{step_14['output']['watchlist']}}"
  step_18_quotes  = "{{step_18['output']['eventQuotes']}}"
}

# 4. step_18 kloonataan koodiaskeleesta, ketju step_17 -> step_18 -> step_9
$s18 = Clone $map['step_9']
$s18.name = 'step_18'
$s18.displayName = 'Code (event quotes)'
$s18.settings.sourceCode.code = Read-Utf8 -File "$build\step18.js"
$s18.settings.input = [pscustomobject][ordered]@{ tickers = "{{step_14['output']['tickers']}}" }
$map['step_18'] = $s18

$map['step_17'].nextAction = $s18
$s18.nextAction = $map['step_9']

# 5. Kehotteet: saannot ja kayttajaviestin tapahtumaosiot
$extra = @()
$extra += (Read-Utf8 -File "$build\out_ruleprice1.txt").Trim()
$extra += (Read-Utf8 -File "$build\out_ruleevent.txt").Trim()
$ins = ($extra -join "`r`n")
$marker = 'PRICE-TUOREUS'

$evLines = @(
  '',
  'ODOTETUT TAPAHTUMAT (seurantalista ja tapahtumien hakutulokset):',
  "{{step_9['output']['watchlist']}}",
  '',
  'TAPAHTUMIEN KURSSIT (kayta naita lukuja markkinareaktiosta):',
  "{{step_9['output']['eventQuotes']}}"
)
$evBlock = ($evLines -join "`r`n")

foreach ($sn in @('step_3','step_10')) {
  if (-not $map.ContainsKey($sn)) { continue }
  $cur = $map[$sn].settings.input.body.data.messages[0].content
  if (-not $cur.Contains($marker)) {
    $anchor = if ($sn -eq 'step_3') { '10. EI VUOTOJA:' } else { '7. LOPETUS:' }
    if ($cur.Contains($anchor)) {
      $map[$sn].settings.input.body.data.messages[0].content = $cur.Replace($anchor, ($ins + "`r`n" + $anchor))
      Write-Host ($sn + ': saannot lisatty')
    } else {
      Write-Host ($sn + ': VAROITUS saannon ankkuria ei loytynyt')
    }
  }
  $u = $map[$sn].settings.input.body.data.messages[1].content
  if (-not $u.Contains('ODOTETUT TAPAHTUMAT (seurantalista')) {
    $map[$sn].settings.input.body.data.messages[1].content = ($u.TrimEnd() + $evBlock)
    Write-Host ($sn + ': tapahtumaosiot lisatty')
  }
}

# 6. Tapahtumahaut: vain time_range=day, ei days-kenttaa.
# Tavily hylkaa tyhjan time_range-arvon, joten kentta poistetaan kokonaan silloin kun se on tyhja.
foreach ($sn in @('step_12','step_15','step_16','step_17')) {
  if (-not $map.ContainsKey($sn)) { continue }
  $inp = $map[$sn].settings.input
  if ($sn -eq 'step_12') {
    if ($inp.PSObject.Properties.Name -contains 'time_range') { $inp.PSObject.Properties.Remove('time_range') }
  } else {
    if ($inp.PSObject.Properties.Name -contains 'days') { $inp.PSObject.Properties.Remove('days') }
    $inp.search_depth = 'advanced'
    $inp.time_range = 'day'
  }
}

Write-Utf8Bom -File $path -Text ($json | ConvertTo-Json -Depth 100)
Write-Host 'Aamuraportti.json paivitetty.'
