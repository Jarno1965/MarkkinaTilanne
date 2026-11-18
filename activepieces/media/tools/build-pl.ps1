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

# Read the base template (clone from existing working flow)
$path = "$root\Puola viikkokatsaus.json"
$templatePath = "$root\..\markkina\Sunnuntai.json"
$json = (Read-Utf8 -File $templatePath).TrimStart([char]0xFEFF) | ConvertFrom-Json

# Update flow metadata
$json.name = "Puola viikkokatsaus"
$json.flows[0].displayName = "Puola viikkokatsaus"

# Setup step mapping
$map = @{}
$a = $json.flows[0].trigger.nextAction
while ($a) { $map[$a.name] = $a; $a = $a.nextAction }

# Configure the weekly trigger (Monday 08:00)
$trigger = $json.flows[0].trigger
$trigger.settings.input.day_of_the_week = 1  # Monday = 1
$trigger.settings.input.hour_of_the_day = 8
$trigger.settings.input.timezone = "Europe/Helsinki"

# Update Tavily search steps for Polish market
$searchSteps = @('step_7', 'step_8', 'step_11', 'step_12', 'step_15', 'step_16', 'step_17')
foreach ($stepName in $searchSteps) {
  if ($map.ContainsKey($stepName)) {
    $step = $map[$stepName]
    # Set time_range to week and remove days parameter
    if ($step.settings.input.PSObject.Properties.Name -contains 'days') {
      $step.settings.input.PSObject.Properties.Remove('days')
    }
    $step.settings.input.time_range = 'week'
    $step.settings.input.topic = 'news'
    # Update queries based on step purpose
    switch ($stepName) {
      'step_7' { $step.settings.input.query = 'Polish market weekly summary economic news' }
      'step_8' { $step.settings.input.query = 'Polish stocks WIG20 WIG30 market analysis' }
      'step_11' { $step.settings.input.query = 'Polish central bank NBP interest rate decisions' }
      'step_12' { $step.settings.input.query = 'Polish market events week ahead economic calendar' }
      default { 
        if ($stepName -like 'step_1*') {
          $step.settings.input.query = 'Polish market economic news analysis'
        }
      }
    }
  }
}

# Update code steps
$map['step_14'].settings.sourceCode.code = Read-Utf8 -File "$build\extract_json.js"
$map['step_9'].settings.sourceCode.code = Read-Utf8 -File "$build\process_articles.js"

# Update GitHub commit step
$githubStep = $map['step_4']
$githubStep.settings.input.url.url = '/repos/Jarno1965/MarkkinaTilanne/contents/data/media-pl/{{step_5[''output''][''timestamp'']}}-viikkokatsaus.html'
$githubStep.settings.input.body.data.message = 'Added Polish weekly market review'

# Save the updated JSON
Write-Utf8Bom -File $path -Text ($json | ConvertTo-Json -Depth 100)
Write-Host 'Puola viikkokatsaus.json updated.'