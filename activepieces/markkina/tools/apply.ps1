$ErrorActionPreference = 'Stop'
$path = (Join-Path (Split-Path -Parent $PSScriptRoot) 'Aamuraportti.json')
$build = $PSScriptRoot

function Read-Utf8 {
  param([string]$File)
  return [System.IO.File]::ReadAllText($File, [System.Text.Encoding]::UTF8)
}

$text = Read-Utf8 -File $path
$json = $text.TrimStart([char]0xFEFF) | ConvertFrom-Json

$map = @{}
$a = $json.flows[0].trigger.nextAction
while ($a) { $map[$a.name] = $a; $a = $a.nextAction }
foreach ($need in @('step_7','step_8','step_9','step_3','step_10')) {
  if (-not $map.ContainsKey($need)) { throw ('Askel puuttuu: ' + $need) }
}

# 2. Paranna nykyiset Tavily-haut
foreach ($sn in @('step_7','step_8')) {
  $map[$sn].settings.input.days = '1'
  $map[$sn].settings.input.time_range = 'day'
  $map[$sn].settings.input.max_results = 8
  $map[$sn].settings.input.search_depth = 'advanced'
}

# 3. Uusi step_9
$map['step_9'].settings.sourceCode.code = Read-Utf8 -File "$build\step9.js"
$map['step_9'].settings.input = [pscustomobject][ordered]@{
  step_7_answer   = "{{step_7['output']['answer']}}"
  step_7_results  = "{{step_7['output']['results']}}"
  step_8_answer   = "{{step_8['output']['answer']}}"
  step_8_results  = "{{step_8['output']['results']}}"
  market_data     = "{{step_6['output']['marketData']}}"
  step_15_answer  = "{{step_15['output']['answer']}}"
  step_15_results = "{{step_15['output']['results']}}"
  step_16_answer  = "{{step_16['output']['answer']}}"
  step_16_results = "{{step_16['output']['results']}}"
  step_17_answer  = "{{step_17['output']['answer']}}"
  step_17_results = "{{step_17['output']['results']}}"
  watchlist       = "{{step_14['output']['watchlist']}}"
}

# 4. Mallipohjat
$tavilyTemplate = ($map['step_7'] | ConvertTo-Json -Depth 100) | ConvertFrom-Json
$codeTemplate = ($map['step_9'] | ConvertTo-Json -Depth 100) | ConvertFrom-Json
$llmTemplate = ($map['step_3'] | ConvertTo-Json -Depth 100) | ConvertFrom-Json

function New-TavilyStep {
  param([string]$Name, [string]$Display, [string]$Query, [string]$Days, [string]$Depth, [int]$Max)
  $step = ($tavilyTemplate | ConvertTo-Json -Depth 100) | ConvertFrom-Json
  $step.name = $Name
  $step.displayName = $Display
  $step.settings.input.query = $Query
  $step.settings.input.days = $Days
  $step.settings.input.search_depth = $Depth
  $step.settings.input.max_results = $Max
  $step.settings.input.topic = 'news'
  return $step
}

$discoverOvernight = New-TavilyStep -Name 'step_11' -Display 'Search overnight market-moving events' `
  -Query 'biggest market moving news overnight earnings results after the bell IPO debut central bank decision stock reaction' `
  -Days '1' -Depth 'basic' -Max 10
$discoverUpcoming = New-TavilyStep -Name 'step_12' -Display 'Search upcoming anticipated events' `
  -Query 'most anticipated market events this week earnings IPO listing central bank decision merger ruling preview what investors are watching' `
  -Days '5' -Depth 'basic' -Max 10
$discoverUpcoming.settings.input.time_range = $null

# 5. Poimija-LLM (step_13)
$step13 = ($llmTemplate | ConvertTo-Json -Depth 100) | ConvertFrom-Json
$step13.name = 'step_13'
$step13.displayName = 'Ask LLM (anticipated events)'
$step13.settings.input.body.data.model = 'deepseek/deepseek-v4.1-flash'
$step13.settings.input.body.data.reasoning_effort = 'low'
$step13.settings.input.body.data.max_tokens = 1500
$step13.settings.input.body.data.messages = @(
  [pscustomobject][ordered]@{ role = 'system'; content = (Read-Utf8 -File "$build\out_extract_system.txt") },
  [pscustomobject][ordered]@{ role = 'user'; content = (Read-Utf8 -File "$build\out_extract_user.txt") }
)

# 6. Parsinta (step_14)
$step14 = ($codeTemplate | ConvertTo-Json -Depth 100) | ConvertFrom-Json
$step14.name = 'step_14'
$step14.displayName = 'Code (parse events)'
$step14.settings.sourceCode.code = Read-Utf8 -File "$build\step14.js"
$step14.settings.input = [pscustomobject][ordered]@{
  events_json = "{{step_13['output']['choices'][0]['message']['content']}}"
}

# 7. Tapahtumahaut (step_15-17)
$res1 = New-TavilyStep -Name 'step_15' -Display 'Search event 1 outcome' -Query "{{step_14['output']['q1']}}" -Days '3' -Depth 'advanced' -Max 6
$res2 = New-TavilyStep -Name 'step_16' -Display 'Search event 2 outcome' -Query "{{step_14['output']['q2']}}" -Days '3' -Depth 'advanced' -Max 6
$res3 = New-TavilyStep -Name 'step_17' -Display 'Search event 3 outcome' -Query "{{step_14['output']['q3']}}" -Days '3' -Depth 'advanced' -Max 6

# 8. Ketjutus
$map['step_8'].nextAction = $discoverOvernight
$discoverOvernight.nextAction = $discoverUpcoming
$discoverUpcoming.nextAction = $step13
$step13.nextAction = $step14
$step14.nextAction = $res1
$res1.nextAction = $res2
$res2.nextAction = $res3
$res3.nextAction = $map['step_9']

# 9. Kehotteet
$rule3 = (Read-Utf8 -File "$build\out_rule3.txt").Trim()
$rule3b = (Read-Utf8 -File "$build\out_rule3b.txt").Trim()
$rule3c = (Read-Utf8 -File "$build\out_rule3c.txt").Trim()
$rule10a = (Read-Utf8 -File "$build\out_rule10a.txt").Trim()

$s3 = $map['step_3'].settings.input.body.data.messages[0].content
if ($s3 -notmatch '9b\.') {
  $s3 = $s3.Replace('10. EI VUOTOJA:', "9b. $rule3`r`n9c. $rule3b`r`n9d. $rule3c`r`n10. EI VUOTOJA:")
}
$map['step_3'].settings.input.body.data.messages[0].content = $s3

$s10 = $map['step_10'].settings.input.body.data.messages[0].content
if ($s10 -notmatch '6b\.') {
  $s10 = $s10.Replace('7. LOPETUS:', "6b. $rule10a`r`n7. LOPETUS:")
}
$map['step_10'].settings.input.body.data.messages[0].content = $s10

# 10. Kirjoita
$out = $json | ConvertTo-Json -Depth 100
$bytes = [System.Text.Encoding]::UTF8.GetBytes($out)
$ms = New-Object System.IO.MemoryStream
$ms.WriteByte(0xEF); $ms.WriteByte(0xBB); $ms.WriteByte(0xBF)
$ms.Write($bytes, 0, $bytes.Length)
[System.IO.File]::WriteAllBytes($path, $ms.ToArray())
$ms.Dispose()
Write-Host 'Aamuraportti.json paivitetty.'

