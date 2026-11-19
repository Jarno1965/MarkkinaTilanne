$ErrorActionPreference = 'Stop'
# Rakentaa "Aamuraportti NEW" -työnkulun paikallisen JSON-tiedoston vanhasta Aamuraportti.json:sta.
# Uudet askeleet: step_2 (etusivujen RSS), step_19 (laatulehtien Tavily), step_20 (naakyvyyspisteet),
# step_21 (LLM: etusivujen karkiteemat ja avausvaikutus). step_5 liittaa osion raporttiin.
$root = (Split-Path -Parent $PSScriptRoot)
$build = $PSScriptRoot
$srcPath = "$root\Aamuraportti.json"
$outPath = "$root\Aamuraportti NEW.json"

function Read-Utf8 { param([string]$File) return [System.IO.File]::ReadAllText($File, [System.Text.Encoding]::UTF8) }
function Clone { param($Obj) return (($Obj | ConvertTo-Json -Depth 100) | ConvertFrom-Json) }
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
$json.name = 'Aamuraportti NEW'
$json.flows[0].displayName = 'Aamuraportti NEW'
$json.metadata.externalId = 'LXNbIZEZQmW5wkUA7KHyZ'

$map = @{}
$a = $json.flows[0].trigger.nextAction
while ($a) { $map[$a.name] = $a; $a = $a.nextAction }
foreach ($need in @('step_8','step_11','step_10','step_5')) {
  if (-not $map.ContainsKey($need)) { throw ('Askel puuttuu: ' + $need) }
}

# --- 1. Etusivujen RSS-syotteet (ilmainen) ---
$rss = Clone $map['step_8']
$rss.name = 'step_2'
$rss.displayName = 'Front pages (RSS)'
$rss.settings.pieceName = '@activepieces/piece-rss'
$rss.settings.actionName = 'rss_read_multiple_feeds'
$rss.settings.pieceVersion = '0.8.1'
$rss.settings.sampleData = [pscustomobject]@{}
$rss.settings.input = [pscustomobject][ordered]@{
  rss_feed_urls = @(
    'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=fi&gl=FI&ceid=FI:fi',
    'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    'https://www.nasdaq.com/feed/rssoutbound?category=Markets',
    'https://www.ft.com/rss/home',
    'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss'
  )
  limit = 100
}

# --- 2. Laatulehtien etusivu Tavilylla (WSJ, Bloomberg, Reuters, FT, CNBC) ---
$quality = Clone $map['step_8']
$quality.name = 'step_19'
$quality.displayName = 'Quality press front page (WSJ, Bloomberg, Reuters, FT)'
$quality.settings.input = [pscustomobject][ordered]@{
  auth = "{{connections['EAIQ8mqJo0mqpzcuLJad8']}}"
  query = 'stock market today futures open biggest market moving story investors watching'
  topic = 'news'
  time_range = 'day'
  max_results = 10
  search_depth = 'advanced'
  include_answer = $true
  include_images = $false
  include_domains = @('wsj.com', 'bloomberg.com', 'reuters.com', 'ft.com', 'cnbc.com')
  exclude_domains = @()
  include_raw_content = $false
  include_image_descriptions = $false
}

# --- 3. Naakyvyyspisteet (Code) ---
$code = Clone $map['step_9']
$code.name = 'step_20'
$code.displayName = 'Prominence score (Code)'
$code.settings.sourceCode.code = Read-Utf8 -File "$build\step21.js"
$code.settings.input = [pscustomobject][ordered]@{
  front_items     = "{{step_2['output']['items']}}"
  quality_results = "{{step_19['output']['results']}}"
  quality_answer  = "{{step_19['output']['answer']}}"
  now             = "{{step_1['output']['result']}}"
}

# --- 4. LLM: etusivujen karkiteemat ja avausvaikutus ---
$llm = Clone $map['step_10']
$llm.name = 'step_21'
$llm.displayName = 'Ask LLM (front-page themes & opening impact)'
$llm.settings.input.body.data.model = 'deepseek/deepseek-v4.1-flash'
$llm.settings.input.body.data.max_tokens = 6000
$llm.settings.input.body.data.temperature = 0.3
$llm.settings.input.body.data.reasoning_effort = 'high'
$llm.settings.input.body.data.messages = @(
  [pscustomobject][ordered]@{ role = 'system'; content = ((Read-Utf8 -File "$build\txt_prominence_system.txt").Trim()) },
  [pscustomobject][ordered]@{ role = 'user'; content = ((Read-Utf8 -File "$build\txt_prominence_user.txt").Trim()) }
)
$llm.settings.errorHandlingOptions.retryOnFailure.value = $true
$llm.settings.errorHandlingOptions.continueOnFailure.value = $true

# --- 5. Ketjutus ---
$map['step_8'].nextAction = $rss
$rss.nextAction = $quality
$quality.nextAction = $code
$code.nextAction = $map['step_11']
$map['step_10'].nextAction = $llm
$llm.nextAction = $map['step_5']

# --- 6. step_5 liittaa karkiteemaosion ennen spekulaatiota ---
$map['step_5'].settings.sourceCode.code = Read-Utf8 -File "$build\step5_new.js"
$map['step_5'].settings.input = [pscustomobject][ordered]@{
  date       = "{{step_1['output']['result']}}"
  html       = "{{step_3['output']}}"
  prominence = "{{step_21['output']}}"
  analysis   = "{{step_10['output']}}"
}

Write-Utf8Bom -File $outPath -Text ($json | ConvertTo-Json -Depth 100)
Write-Host ('Kirjoitettu: ' + $outPath)
