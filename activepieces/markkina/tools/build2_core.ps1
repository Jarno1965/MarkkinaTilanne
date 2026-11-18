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
function Find-Step { param($Trigger, [string]$Name)
  $a = $Trigger
  while ($a) { if ($a.name -eq $Name) { return $a }; $a = $a.nextAction }
  return $null
}

# Mallipohjat Aamuraportista
$tpl = (Read-Utf8 -File "$root\Aamuraportti.json").TrimStart([char]0xFEFF) | ConvertFrom-Json
$tplTrigger = $tpl.flows[0].trigger
$tplTavily = Find-Step $tplTrigger 'step_11'
$tplExtract = Find-Step $tplTrigger 'step_13'
$tplParse = Find-Step $tplTrigger 'step_14'
$tplOutcome = Find-Step $tplTrigger 'step_15'
$tplQuotes = Find-Step $tplTrigger 'step_18'

$extractSystem = (Read-Utf8 -File "$build\out_extract_system.txt").Trim()
$rule3 = (Read-Utf8 -File "$build\out_rule3.txt").Trim()
$rulePrice1 = (Read-Utf8 -File "$build\out_ruleprice1.txt").Trim()
$rulePrice1b = (Read-Utf8 -File "$build\out_ruleprice1b.txt").Trim()
$ruleEvent = (Read-Utf8 -File "$build\out_ruleevent.txt").Trim()
$rule10 = (Read-Utf8 -File "$build\out_rule10.txt").Trim()

function New-SearchStep {
  param([string]$Name, [string]$Display, [string]$Query, [string]$Days, [string]$Depth, [int]$Max, [string]$Range)
  $s = Clone $tplTavily
  $s.name = $Name
  $s.displayName = $Display
  $s.settings.input.query = $Query
  $s.settings.input.days = $Days
  $s.settings.input.search_depth = $Depth
  $s.settings.input.max_results = $Max
  $s.settings.input.topic = 'news'
  $s.settings.input.time_range = $Range
  return $s
}

function New-OutcomeStep {
  param([string]$Name, [string]$Display, [string]$Query, [string]$Days, [int]$Max)
  $s = New-SearchStep -Name $Name -Display $Display -Query $Query -Days $Days -Depth 'advanced' -Max $Max -Range 'day'
  # Tavily: kayta joko days tai time_range, ei molempia. Tapahtumahaussa halutaan tuorein tulos.
  $s.settings.input.PSObject.Properties.Remove('days')
  return $s
}

function Add-EventSections {
  param($Msg, [bool]$WithQuotes)
  $lines = @('ODOTETUT TAPAHTUMAT (seurantalista ja tapahtumien hakutulokset):', "{{step_9['output']['watchlist']}}")
  if ($WithQuotes) {
    $lines += ''
    $lines += 'TAPAHTUMIEN KURSSIT (kayta naita lukuja markkinareaktiosta):'
    $lines += "{{step_9['output']['eventQuotes']}}"
  }
  return ($Msg.TrimEnd() + "`r`n`r`n" + ($lines -join "`r`n"))
}

$ruleFiles = @{}
foreach ($rf in @('rule3','rule3_short','ruleprice1','ruleprice1b','ruleevent','rule10','rule3b','rule3c','rule10a')) {
  $file = "$build\out_$rf.txt"
  if (-not (Test-Path -LiteralPath $file)) { throw ('Saantotiedosto puuttuu: ' + $file) }
  $ruleFiles[$rf] = (Read-Utf8 -File $file).Trim()
}
Write-Host ('Apuskriptin osa 1 ladattu. Saantoja: ' + $ruleFiles.Count)
