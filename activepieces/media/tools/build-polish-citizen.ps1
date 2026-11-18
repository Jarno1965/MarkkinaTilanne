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
$path = "c:\Omia ohjelmia\MarkkinaTilanne\activepieces\media\Polish-Citizen-Voice.json"
$templatePath = "c:\Omia ohjelmia\MarkkinaTilanne\activepieces\media\templates\Sunnuntai.json"
$json = (Read-Utf8 -File $templatePath).TrimStart([char]0xFEFF) | ConvertFrom-Json

# Update flow metadata - TAMA ON NYT OIKEA NIMI
$json.name = "Polish-Citizen-Voice"
$json.flows[0].displayName = "Puola: Kansalaisten Aani"

# Setup step mapping
$map = @{}
$a = $json.flows[0].trigger.nextAction
while ($a) { $map[$a.name] = $a; $a = $a.nextAction }

# Configure the weekly trigger (Monday 08:00) - SAMA AIKA
$trigger = $json.flows[0].trigger
$trigger.settings.input.day_of_the_week = 1  # Monday = 1
$trigger.settings.input.hour_of_the_day = 8
$trigger.settings.input.timezone = "Europe/Helsinki"

# POISTA TAVILY-HAUT KOKONAAN - ne ovat VAARIA!
# Kaytetaan suoraa scrapingia puolalaisista lahteista

# Poistetaan turhat Tavily-askeleet
$stepsToRemove = @('step_7', 'step_8', 'step_11', 'step_12', 'step_15', 'step_16', 'step_17')
foreach ($stepName in $stepsToRemove) {
  if ($map.ContainsKey($stepName)) {
    # Poistetaan askel ketjusta
    $map.Remove($stepName)
  }
}

# LISATAAN OIKEA STRUKTUURI:
# 1. step_1 (date) -> step_13_scrape (scraping) -> step_14_analyze -> step_9_format -> step_3_LLM -> step_5 -> step_4

# Uusi scraping-askel (korvaa vanhan step_12:n paikan)
$scrapeStep = Clone $map['step_9']  # Kopioidaan format-stepin rakenne
$scrapeStep.name = 'step_13_scrape'
$scrapeStep.displayName = 'Code (scrape Polish media)'
$scrapeStep.settings.sourceCode.code = Read-Utf8 -File "$build\scrape_polish_media.js"
$scrapeStep.settings.input = [pscustomobject][ordered]@{
  # Ei inputteja tarvita - hakee suoraan puolalaisista lahteista
}
$scrapeStep.nextAction = $map['step_14']

# Paivitetaan analyysi-askel kayttamaan scraping-tulosta
$map['step_14'].settings.sourceCode.code = Read-Utf8 -File "$build\analyze_polish_trends.js"
$map['step_14'].settings.input = [pscustomobject][ordered]@{
  articles = "{{step_13_scrape['output']['articles']}}"
}

# Paivitetaan formatointi-askel
$map['step_9'].settings.sourceCode.code = Read-Utf8 -File "$build\format_polish_report.js"
$map['step_9'].settings.input = [pscustomobject][ordered]@{
  summary_fi = "{{step_14['output']['summary_fi']}}"
  trending_topics = "{{step_14['output']['trending_topics']}}"
  main_topics = "{{step_14['output']['main_topics']}}"
}

# Korjataan ketju: step_1 -> step_13_scrape -> step_14 -> step_9 -> step_3 -> step_5 -> step_4
$map['step_1'].nextAction = $scrapeStep
$scrapeStep.nextAction = $map['step_14']
$map['step_14'].nextAction = $map['step_9']
$map['step_9'].nextAction = $map['step_3']
$map['step_3'].nextAction = $map['step_5']
$map['step_5'].nextAction = $map['step_4']

# LISATAAN step_3_LLM viestinta oikeaan kontekstiin
# Paivitetaan LLM-kehote keskittymaan KANSALAISTEN AANEEN
$llmStep = $map['step_3']
$llmStep.settings.input.body.data.messages[0].content = @"
Olet suomalainen toimittaja, joka kirjoittaa raporttia siita, mita tavalliset puolalaiset puhuvat.
Kayta seuraavaa tietoa:

MITA PUOLALAISET PUHUVAT:
{{step_9['output']['summary_points']}}

Tehtavasi on kirjoittaa selkea, suomenkielinen yhteenveto, joka kertoo:
1. Mitä arkisia asioita puolalaiset keskustelevat
2. Missa heidan mielenkiintonsa on
3. Mikä heidan mielialassaan liikuttaa

KIRJOITA VAIN SUOMEKSI. Ala mainitse kansainvalisia markkina-analyyseja tai ulkopuolisia tarkkailijoita.
Keskity ainoastaan siihen, MITA ITSE PUOLALAISET OVAT SANONEET omilla medioillaan.
"@

# Paivitetaan GitHub commit -askeleen polku ja viesti
$githubStep = $map['step_4']
$githubStep.settings.input.url.url = '/repos/Jarno1965/MarkkinaTilanne/contents/data/media-pl/{{step_5[''output''][''timestamp'']}}-viikkokatsaus.html'
$githubStep.settings.input.body.data.message = 'MITA PUOLALAISET PUHUVAT - viikkokatsaus'

# Poistetaan vanhat, vaarat Tavily-askelten viittaukset
$cleanupSteps = @('step_7', 'step_8', 'step_11', 'step_12', 'step_15', 'step_16', 'step_17')
foreach ($stepName in $cleanupSteps) {
  if ($map.ContainsKey($stepName)) {
    $map.Remove($stepName)
  }
}

# LISATAAN uusi scraping-askel karttaan
$map['step_13_scrape'] = $scrapeStep

# Save the updated JSON
Write-Utf8Bom -File $path -Text ($json | ConvertTo-Json -Depth 100)
Write-Host 'Polish-Citizen-Voice.json updated.'