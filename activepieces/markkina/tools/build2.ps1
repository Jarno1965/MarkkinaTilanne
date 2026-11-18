. "$PSScriptRoot\build2_core.ps1"
. "$PSScriptRoot\build2_config.ps1"

foreach ($cfg in $reports) {
  $path = "$root\$($cfg.File)"
  Write-Host ('--- ' + $cfg.File)
  $text = Read-Utf8 -File $path
  $json = $text.TrimStart([char]0xFEFF) | ConvertFrom-Json

  $map = @{}
  $a = $json.flows[0].trigger.nextAction
  while ($a) { $map[$a.name] = $a; $a = $a.nextAction }

  foreach ($sn in @('step_7','step_8')) {
    if ($map.ContainsKey($sn)) {
      $map[$sn].settings.input.days = '1'
      $map[$sn].settings.input.time_range = 'day'
      $map[$sn].settings.input.max_results = 8
      $map[$sn].settings.input.search_depth = 'advanced'
    }
  }

  $s11 = New-SearchStep -Name 'step_11' -Display 'Search overnight and morning events' -Query $cfg.Query11 -Days $cfg.Days11 -Depth 'basic' -Max 10 -Range 'day'
  $s12 = New-SearchStep -Name 'step_12' -Display 'Search anticipated events' -Query $cfg.Query12 -Days $cfg.Days12 -Depth 'basic' -Max 10 -Range $cfg.Range12
  if ($cfg.Range12 -eq 'day') { $s12.settings.input.PSObject.Properties.Remove('time_range') }
  $s13 = Clone $tplExtract
  $s13.name = 'step_13'
  $s13.settings.input.body.data.messages[0].content = $extractSystem
  $s14 = Clone $tplParse
  $s14.settings.sourceCode.code = Read-Utf8 -File "$build\step14.js"
  $s14.settings.input = [pscustomobject][ordered]@{ raw = "{{step_13['output']}}" }
  $s15 = New-OutcomeStep -Name 'step_15' -Display 'Search event 1 outcome' -Query "{{step_14['output']['q1']}}" -Days $cfg.DaysOut -Max 6
  $s16 = New-OutcomeStep -Name 'step_16' -Display 'Search event 2 outcome' -Query "{{step_14['output']['q2']}}" -Days $cfg.DaysOut -Max 6
  $s17 = New-OutcomeStep -Name 'step_17' -Display 'Search event 3 outcome' -Query "{{step_14['output']['q3']}}" -Days $cfg.DaysOut -Max 6
  foreach ($s in @($s12,$s15,$s16,$s17)) {
    if ($s.settings.input.PSObject.Properties.Name -contains 'time_range' -and [string]::IsNullOrEmpty($s.settings.input.time_range)) {
      $s.settings.input.PSObject.Properties.Remove('time_range')
    }
  }

  foreach ($s in @($s11,$s12,$s13,$s14,$s15,$s16,$s17)) { $map[$s.name] = $s }

  $inp = [ordered]@{
    label_asia     = $cfg.LabelAsia
    label_europe   = $cfg.LabelEurope
    fresh_hours    = 3
    step_7_answer  = "{{step_7['output']['answer']}}"
    step_7_results = "{{step_7['output']['results']}}"
    step_8_answer  = "{{step_8['output']['answer']}}"
    step_8_results = "{{step_8['output']['results']}}"
    step_15_answer  = "{{step_15['output']['answer']}}"
    step_15_results = "{{step_15['output']['results']}}"
    step_16_answer  = "{{step_16['output']['answer']}}"
    step_16_results = "{{step_16['output']['results']}}"
    step_17_answer  = "{{step_17['output']['answer']}}"
    step_17_results = "{{step_17['output']['results']}}"
    watchlist       = "{{step_14['output']['watchlist']}}"
  }
  if ($cfg.Intraday) {
    $inp['market_data'] = "{{step_6['output']['marketData']}}"
    $inp['step_18_quotes'] = "{{step_18['output']['eventQuotes']}}"
    $s18 = Clone $tplQuotes
    $s18.name = 'step_18'
    $s18.settings.sourceCode.code = Read-Utf8 -File "$build\step18.js"
    $map['step_18'] = $s18
  }
  $map['step_9'].settings.sourceCode.code = Read-Utf8 -File "$build\step9.js"
  $map['step_9'].settings.input = [pscustomobject]$inp

  $map['step_8'].nextAction = $s11
  $s11.nextAction = $s12
  $s12.nextAction = $s13
  $s13.nextAction = $s14
  $s14.nextAction = $s15
  $s15.nextAction = $s16
  $s16.nextAction = $s17
  if ($cfg.Intraday) {
    $s17.nextAction = $map['step_18']
    $map['step_18'].nextAction = $map['step_9']
  } else {
    $s17.nextAction = $map['step_9']
  }

  $rules = @()
  foreach ($rf in $cfg.Rules3) { $rules += $ruleFiles[$rf] }
  $ins = ($rules -join "`r`n")
  $marker = $rules[0].Substring(0, 40)
  if ($map.ContainsKey('step_3')) {
    $s3 = $map['step_3'].settings.input.body.data.messages[0].content
    if (-not $s3.Contains($marker)) {
    $anchor = $cfg.Step3Anc
    if ($anchor -eq '10. EI VUOTOJA') { $anchor = '10. EI VUOTOJA:' }
    if ($anchor -eq 'VAPAAPAIVAT') { $anchor = "10\. VAPAAP$([char]0x00C4)IV$([char]0x00C4)T\b" }
    if ($anchor -eq '6. EI VUOTOJA') { $anchor = '6. EI VUOTOJA:' }
      if ($s3 -match $anchor) {
        $map['step_3'].settings.input.body.data.messages[0].content = $s3.Replace($Matches[0], ($ins + "`r`n" + $Matches[0]))
        Write-Host '  step_3: saannot lisatty'
      } else {
        Write-Host ('  VAROITUS: ankkuria ei loytynyt step_3:sta (' + $anchor + ')')
      }
    }
  } else {
    Write-Host '  VAROITUS: step_3 puuttuu'
  }
  if ($cfg.Rules10.Count -gt 0 -and $map.ContainsKey('step_10')) {
    $s10 = $map['step_10'].settings.input.body.data.messages[0].content
    $ins10 = ($cfg.Rules10 | ForEach-Object { $ruleFiles[$_] }) -join "`r`n"
    $anchor10 = '7. LOPETUS:'
    $missing = @($cfg.Rules10 | Where-Object { -not $s10.Contains(($ruleFiles[$_]).Substring(0, 30)) })
    if ($missing.Count -eq 0) {
      Write-Host '  step_10: saannot jo olemassa'
    } elseif ($s10.Contains($anchor10)) {
      $new10 = ($missing | ForEach-Object { $ruleFiles[$_] }) -join "`r`n"
      $map['step_10'].settings.input.body.data.messages[0].content = $s10.Replace($anchor10, ($new10 + "`r`n" + $anchor10))
      Write-Host ('  step_10: lisatty ' + ($missing -join ', '))
    } else {
      Write-Host '  VAROITUS: ankkuria ei loytynyt step_10:sta'
    }
  }

  foreach ($sn in @('step_3','step_10')) {
    if (-not $map.ContainsKey($sn)) { continue }
    $cur = $map[$sn].settings.input.body.data.messages[1].content
    if ($cur.Contains('ODOTETUT TAPAHTUMAT (seurantalista')) { continue }
    $withQuotes = $cfg.Intraday
    $map[$sn].settings.input.body.data.messages[1].content = Add-EventSections -Msg $cur -WithQuotes $withQuotes
    Write-Host ('  ' + $sn + ': tapahtumaosiot lisatty')
  }

  Write-Utf8Bom -File $path -Text ($json | ConvertTo-Json -Depth 100)
  Write-Host ('  kirjoitettu: ' + $cfg.File)
}
Write-Host 'Kaikki valmiit.'
