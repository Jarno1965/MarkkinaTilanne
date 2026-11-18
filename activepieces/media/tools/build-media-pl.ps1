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
$path = "$root\media-pl.json"
$templatePath = "$root\..\markkina\Sunnuntai.json"
$json = (Read-Utf8 -File $templatePath).TrimStart([char]0xFEFF) | ConvertFrom-Json

# Update flow metadata
$json.name = "media-pl"
$json.flows[0].displayName = "Puola-mediakatsaus"

# Setup step mapping
$map = @{}
$a = $json.flows[0].trigger.nextAction
while ($a) { $map[$a.name] = $a; $a = $a.nextAction }

# Configure the weekly trigger (Monday 08:00)
$trigger = $json.flows[0].trigger
$trigger.settings.input.day_of_the_week = 1  # Monday = 1
$trigger.settings.input.hour_of_the_day = 8
$trigger.settings.input.timezone = "Europe/Helsinki"

# Update Tavily search steps for Polish media sources
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
      'step_7' { $step.settings.input.query = 'Polish media news Poland current events' }
      'step_8' { $step.settings.input.query = 'Polish newspapers articles what people talk about' }
      'step_11' { $step.settings.input.query = 'Poland society culture politics news' }
      'step_12' { $step.settings.input.query = 'Polish media week summary what they write about' }
      default { 
        if ($stepName -like 'step_1*') {
          $step.settings.input.query = 'Polish media articles news analysis'
        }
      }
    }
  }
}

# Update code steps for media parsing and translation
$map['step_14'].settings.sourceCode.code = Read-Utf8 -File "$build\summarize_polish_media.js"
$map['step_9'].settings.sourceCode.code = Read-Utf8 -File "$build\translate_to_finnish.js"

# Add new step for parsing Polish media (before step_14)
$parsingStep = Clone $map['step_9']
$parsingStep.name = 'step_13_media_parse'
$parsingStep.displayName = 'Code (parse Polish media)'
$parsingStep.settings.sourceCode.code = Read-Utf8 -File "$build\parse_polish_media.js"
$parsingStep.settings.input = [pscustomobject][ordered]@{
  step_7_results = "{{step_7['output']['results']}}"
  step_8_results = "{{step_8['output']['results']}}"
  step_11_results = "{{step_11['output']['results']}}"
  step_12_results = "{{step_12['output']['results']}}"
}

# Insert the parsing step before the summarization step
$parsingStep.nextAction = $map['step_14']
$map['step_12'].nextAction = $parsingStep
$map['step_13_media_parse'] = $parsingStep

# Update the summarization step to use parsed media
$map['step_14'].settings.input = [pscustomobject][ordered]@{
  raw = "{{step_13_media_parse['output']}}"
}

# Update GitHub commit step
$githubStep = $map['step_4']
$githubStep.settings.input.url.url = '/repos/Jarno1965/MarkkinaTilanne/contents/data/media-pl/{{step_5[''output''][''timestamp'']}}-viikkokatsaus.html'
$githubStep.settings.input.body.data.message = 'Added Polish media weekly review'

# Save the updated JSON
Write-Utf8Bom -File $path -Text ($json | ConvertTo-Json -Depth 100)
Write-Host 'media-pl.json updated.'