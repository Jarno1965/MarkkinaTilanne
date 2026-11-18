$ErrorActionPreference = 'Stop'
$root = (Split-Path -Parent $PSScriptRoot)
$files = @('Aamuraportti.json','Kello 11 Eurooppa.json','Kello 18 raportti.json','Sunnuntai.json')
$problems = 0

function Read-Utf8 { param([string]$File) return [System.IO.File]::ReadAllText($File, [System.Text.Encoding]::UTF8) }

foreach ($f in $files) {
  Write-Host ('### ' + $f)
  $json = (Read-Utf8 -File "$root\$f").TrimStart([char]0xFEFF) | ConvertFrom-Json

  # 1. Järjestys ja nimilista
  $order = @()
  $a = $json.flows[0].trigger.nextAction
  while ($a) { $order += $a.name; $a = $a.nextAction }
  Write-Host ('  askeleita: ' + $order.Count)

  # 2. Koodiaskeleen palauttamat kentät (etsi "return {" ja avaimet)
  $returns = @{}
  $a = $json.flows[0].trigger.nextAction
  while ($a) {
    if ($a.type -eq 'CODE') {
      $code = $a.settings.sourceCode.code
      $keys = @()
      # Etsi viimeinen "return {" ja lue sen avaimet (sisemmat returnit ohitetaan)
      $idx = $code.LastIndexOf('return {')
      if ($idx -ge 0) {
        $seg = $code.Substring($idx + 8)
        foreach ($km in [regex]::Matches($seg, '([A-Za-z_][A-Za-z0-9_]*)\s*:')) { $keys += $km.Groups[1].Value }
      }
      $returns[$a.name] = $keys
    }
    $a = $a.nextAction
  }
  foreach ($k in $returns.Keys | Sort-Object) { Write-Host ('  ' + $k + ' palauttaa: ' + ($returns[$k] -join ', ')) }

  # 3. Kaikki viittaukset
  $raw = Read-Utf8 -File "$root\$f"
  $refs = [regex]::Matches($raw, "\{\{(step_\d+)\['output'\](\[[^\}]*\])?\}\}")
  $seen = @{}
  foreach ($r in $refs) {
    $full = $r.Value
    if ($seen.ContainsKey($full)) { continue }
    $seen[$full] = $true
    $step = $r.Groups[1].Value
    $tail = $r.Groups[2].Value
    $fields = [regex]::Matches($tail, "\['([^']+)'\]") | ForEach-Object { $_.Groups[1].Value }
    $field = if ($fields.Count -gt 0) { $fields[$fields.Count - 1] } else { '(koko output)' }

    $producerIdx = $order.IndexOf($step)
    $consumerIdx = -1
    foreach ($name in $returns.Keys) { }
    if ($producerIdx -lt 0) {
      Write-Host ('  PUUTTUVA ASKEL: ' + $full)
      $problems++
      continue
    }
    if ($fields.Count -gt 0 -and $returns.ContainsKey($step)) {
      $known = $returns[$step]
      if ($known.Count -gt 0 -and $known -notcontains $fields[0]) {
        Write-Host ('  KENTTA EI TAYSMAA: ' + $full + ' -> ' + $step + ' palauttaa: ' + ($known -join ', '))
        $problems++
      }
    }
  }

  # 4. Kuluttajan on oltava tuottajan jälkeen
  foreach ($r in $refs) {
    $step = $r.Groups[1].Value
    $pi = $order.IndexOf($step)
    if ($pi -lt 0) { continue }
  }

  # 5. Kayttajaviestien tarkistus
  $a = $json.flows[0].trigger.nextAction
  while ($a) {
    if ($a.name -in 'step_3','step_10') {
      $u = $a.settings.input.body.data.messages[1].content
      $hasWatch = $u.Contains('ODOTETUT TAPAHTUMAT (seurantalista')
      $hasQuotes = $u.Contains('TAPAHTUMIEN KURSSIT')
      $expectQuotes = ($order -contains 'step_18')
      if (-not $hasWatch) { Write-Host ('  PUUTTUU kayttajaviestista: seurantalista (' + $a.name + ')'); $problems++ }
      if ($expectQuotes -and -not $hasQuotes) { Write-Host ('  PUUTTUU kayttajaviestista: kurssit (' + $a.name + ')'); $problems++ }
      if (-not $expectQuotes -and $hasQuotes) { Write-Host ('  VAROITUS: kurssiosio ilman step_18:aa (' + $a.name + ')'); $problems++ }
    }
    $a = $a.nextAction
  }
  # 6. Tavily-parametrien validointi
  $a = $json.flows[0].trigger.nextAction
  $validRanges = @('day','week','month','year','d','w','m','y')
  while ($a) {
    $p = $a.settings.input.PSObject.Properties.Name
    if ($p -contains 'query') {
      if ($p -contains 'time_range') {
        $tr = [string]$a.settings.input.time_range
        if ([string]::IsNullOrEmpty($tr) -or ($validRanges -notcontains $tr)) {
          Write-Host ('  VIRHELLINEN time_range: ' + $a.name + ' = [' + $tr + ']')
          $problems++
        }
      }
      if (($p -contains 'time_range') -and ($p -contains 'days')) {
        Write-Host ('  HUOM: ' + $a.name + ' kayttaa seka days etta time_range')
      }
      if ($a.settings.input.topic -ne 'news' -and ($p -contains 'days')) {
        Write-Host ('  HUOM: ' + $a.name + ' kayttaa days-kenttaa ilman news-topicia')
      }
    }
    $a = $a.nextAction
  }
}

Write-Host ''
if ($problems -eq 0) { Write-Host 'Kaikki liitokset kunnossa.' -ForegroundColor Green } else { Write-Host ('Ongelmia: ' + $problems) -ForegroundColor Yellow }
