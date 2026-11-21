$ErrorActionPreference = 'Stop'
# Rakentaa "Lauantai" (lauantain viikkokatsaus) -työnkulun paikallisen JSON-tiedoston
# olemassa olevasta Sunnuntai.json-rakenteesta. Uudet askeleet:
#   step_19  Firecrawl Search Web (ilmainen webscraper, sivusisalto markdownina)
#   step_20  Code (siistaa Firecrawl-tuloksen, tools/step12_scrape.js)
# Lopuksi askeleet numeroidaan juoksevasti step_1..step_16 suoritusjarjestyksessa, jotta
# nimet vastaavat Activepiecesin MCP:lla rakennettua tyonkulka (flowId wuTvMpZibKnuSvwGv0Ex6).
# Muutokset: nimi, externalId, trigger (lauantai klo 09), haut, kehotteet, tiedostonimi.
$root = (Split-Path -Parent $PSScriptRoot)
$build = $PSScriptRoot
$srcPath = "$root\Sunnuntai.json"
$outPath = "$root\Lauantai.json"

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

# Firecrawlin yhteys: oletus on projektin Firecrawl-yhteys, jonka voi ohittaa
# ymparistomuuttujalla FIRECRAWL_CONNECTION_ID.
$fcConnection = $env:FIRECRAWL_CONNECTION_ID
if ([string]::IsNullOrWhiteSpace($fcConnection)) { $fcConnection = 'Vdq5bftNVGbQ5xa1hEqxM' }
$fcVersion = $env:FIRECRAWL_PIECE_VERSION
if ([string]::IsNullOrWhiteSpace($fcVersion)) { $fcVersion = '0.7.3' }

$json = (Read-Utf8 -File $srcPath).TrimStart([char]0xFEFF) | ConvertFrom-Json

# --- Tarkistus: onko lahteetiedosto viela vanha Sunnuntai-pohja? ---
# Tama skripti on VANHENTUNUT. Se olettaa 14 askeleen vanhan Sunnuntai-tyonkulun
# (jossa step_9 = tiivistys, step_3 = HTML-raportti, step_4 = GitHub-tallennus).
# Sunnuntai.json korvattiin 21.11.2026 uudella 17 askeleen eteenpain katsovalla
# versiolla, joten skripti ei enaa tuota oikeaa Lauantai.json:ia.
# Pida Lauantai.json synkronissa MCP-tyokaluilla (ap_read_step_settings /
# ap_update_step) ja rakenna Sunnuntai.json build6_sunnuntai.ps1:lla.
$stepCount = 0
$probe = $json.flows[0].trigger.nextAction
while ($probe) { $stepCount++; $probe = $probe.nextAction }
if ($stepCount -ne 14) {
  throw ("build5_lauantai.ps1 on vanhentunut: lahteetiedoston $srcPath askelemaara on $stepCount, " +
    "odotettiin 14 (vanha Sunnuntai-pohja). Aja sen sijaan build6_sunnuntai.ps1 ja pida Lauantai.json " +
    "synkronissa MCP-tyokaluilla (ks. Raporttien-ohje.md).")
}
$json.name = 'Lauantai'
$json.flows[0].displayName = 'Lauantai'
if ($json.metadata.PSObject.Properties.Name -contains 'externalId') { $json.metadata.externalId = 'd7K78m0VXNgIYpZrQtu8Q' }

# --- Trigger: lauantai klo 09:00 (Europe/Helsinki) ---
$json.flows[0].trigger.settings.input.day_of_the_week = 6
$json.flows[0].trigger.settings.input.hour_of_the_day = 9

$map = @{}
$a = $json.flows[0].trigger.nextAction
while ($a) { $map[$a.name] = $a; $a = $a.nextAction }
foreach ($need in @('step_1','step_7','step_8','step_9','step_3','step_5','step_4','step_11','step_12','step_13','step_14','step_15','step_16','step_17')) {
  if (-not $map.ContainsKey($need)) { throw ('Askel puuttuu: ' + $need) }
}

# --- 1. Paahaut: viikon katsaus ---
$map['step_7'].displayName = 'Search weekly wrap'
$map['step_7'].settings.input.query = 'global stock markets weekly wrap summary biggest moves last week earnings results and reaction'
$map['step_7'].settings.input.days = '7'
$map['step_7'].settings.input.time_range = 'week'
$map['step_7'].settings.input.max_results = 10
$map['step_7'].settings.input.search_depth = 'advanced'

$map['step_8'].displayName = 'Search Europe weekly wrap'
$map['step_8'].settings.input.query = 'European stock markets weekly wrap STOXX 600 DAX FTSE 100 OMX Helsinki ECB eurozone economy inflation biggest movers last week'
$map['step_8'].settings.input.days = '7'
$map['step_8'].settings.input.time_range = 'week'
$map['step_8'].settings.input.max_results = 10
$map['step_8'].settings.input.search_depth = 'advanced'

# --- 2. Tapahtumahaut ---
$map['step_11'].displayName = 'Search week biggest events'
$map['step_11'].settings.input.query = 'biggest market moving events last week stocks earnings central banks economic data reaction'
$map['step_11'].settings.input.days = '7'
$map['step_11'].settings.input.time_range = 'week'

$map['step_12'].displayName = 'Search anticipated events'
$map['step_12'].settings.input.query = 'most anticipated market events next week earnings IPO central bank decision economic calendar preview'
$map['step_12'].settings.input.days = '7'
$map['step_12'].settings.input.time_range = 'week'

# --- 3. step_9-otsikot ---
$map['step_9'].settings.input.label_asia = 'KULUNUT VIIKKO JA GLOBAALIT MARKKINAT'
$map['step_9'].settings.input.label_europe = 'EUROOPPA, VIIKON MARKKINA-AJURIT JA TULEVA VIIKKO'

# --- 3b. Tiivistyskoodi, joka sailyttaa lahteiden URLit (jaettu step9.js pudottaa ne) ---
$map['step_9'].settings.sourceCode.code = Read-Utf8 -File "$build\step13_compact.js"

Write-Host 'Osa 1 valmis (haut ja otsikot).'

# --- 4. Firecrawl: viikon artikkelien kokotekstit (ilmainen webscraper) ---
$fc = Clone $map['step_7']
$fc.name = 'step_19'
$fc.displayName = 'Scrape week articles (Firecrawl)'
$fc.settings.pieceName = '@activepieces/piece-firecrawl'
$fc.settings.actionName = 'search_web'
$fc.settings.pieceVersion = $fcVersion
$fc.settings.sampleData = [pscustomobject]@{}
$fcInput = [ordered]@{ auth = "{{connections['$fcConnection']}}" }
$fcInput['query'] = 'global and European stock markets weekly wrap commentary biggest market moving news last week'
$fcInput['limit'] = 5
$fcInput['sources'] = @('news')
$fcInput['timeFilter'] = 'qdr:w'
$fcInput['includePageContent'] = $true
$fcInput['timeout'] = 120000
$fc.settings.input = [pscustomobject]$fcInput
$fc.settings.propertySettings = [pscustomobject]@{}
$fc.settings.errorHandlingOptions.retryOnFailure.value = $false
$fc.settings.errorHandlingOptions.continueOnFailure.value = $true

# --- 5. Code: siistaa Firecrawl-tuloksen ---
$s20 = Clone $map['step_9']
$s20.name = 'step_20'
$s20.displayName = 'Code (clean scraped articles)'
$s20.settings.sourceCode.code = Read-Utf8 -File "$build\step12_scrape.js"
$s20.settings.input = [pscustomobject][ordered]@{ scraped = "{{step_19['output']}}" }
$s20.settings.errorHandlingOptions.retryOnFailure.value = $false
$s20.settings.errorHandlingOptions.continueOnFailure.value = $true

# --- 5b. Viikon markkinaluvut (Yahoo Finance, viikon muutos + linkit + varit) ---
$s23 = Clone $map['step_9']
$s23.name = 'step_23'
$s23.displayName = 'Code (weekly quotes)'
$s23.settings.sourceCode.code = Read-Utf8 -File "$build\step17_weekly_quotes.js"
$s23.settings.input = [pscustomobject]@{}

# --- 6. Ketjutus: step_17 -> step_23 -> step_19 -> step_20 -> step_9 ---
$map['step_17'].nextAction = $s23
$s23.nextAction = $fc
$fc.nextAction = $s20
$s20.nextAction = $map['step_9']

Write-Host 'Osa 2 valmis (viikkokurssit step_23 + Firecrawl step_19/step_20).'

# --- 7. step_3 kehote: sunnuntai -> lauantai, viikkokatsaus ---
$s3sys = $map['step_3'].settings.input.body.data.messages[0].content
$s3sys = $s3sys.Replace('sunnuntain viikkoennakko ja markkinakatsaus', 'lauantain viikkokatsaus')
$s3sys = $s3sys.Replace('"Maanantain avauksen tärkein ajuri"', '"Viikon tärkein markkina-ajuri"')
$s3sys = $s3sys.Replace('Maanantain avauksen odotuksessa käytä vain tuoreita uutisia sekä viikonlopun ja perjantain päätöslukuja.', 'Viikon yhteenvedossa käytä koko viikon uutisia sekä perjantain päätöslukuja.')
$s3sys = $s3sys.Replace('Jäsentele alueelliset katsaukset (USA, Eurooppa, Aasia) selkeiksi omiksi osioikseen ja tiivistä tulevan viikon tärkeimmät talousjulkistukset selkeäksi listaksi tai taulukoksi.', 'Jäsentele viikon merkittävimmät tapahtumat ja markkina-ajurit sekä alueelliset katsaukset selkeiksi omiksi osioikseen. Raportissa on oltava YHTÄ HUOLELLINEN oma pääosio sekä Yhdysvalloille että Euroopalle ja Helsingin pörssille: käy Euroopasta läpi STOXX Europe 600 / DAX / FTSE 100 / OMX Helsinki 25 -indeksien viikkokehitys, EKP:n ja euroalueen tärkeimmät makroluvut sekä eurooppalaisten toimialojen ja yksittäisten yhtiöiden liikkeet. Tiivistä tulevan viikon tärkeimmät talousjulkistukset ja tulosjulkistukset lyhyeksi listaksi tai taulukoksi.')
$s3sys = $s3sys.Replace('Tässä raportissa ei ole erillistä kurssilukuosiota, joten esitä indeksien tasoja tai prosenttimuutoksia vain jos ne mainitaan uutisissa, äläkä koskaan keksi lukuja.', 'Tässä raportissa ei ole erillistä kurssilukuosiota, joten esitä indeksien tasoja tai prosenttimuutoksia vain jos ne mainitaan uutisissa tai artikkelien kokoteksteissä, äläkä koskaan keksi lukuja.')
# Viikkoluvut, varit ja linkit
$ruleW = 'VIIKON MARKKINALUVUT: Raportissa on oltava oma osio, joka sisältää annetun viikon markkinataulukon SELLAISENAAN (luvut on laskettu virallisista päätösluvuista). Älä muuta sen lukuja äläkä esitä uutisista poimittuja päivälukuja viikon lukuna. Kun mainitset leipätekstissä indeksin, raaka-aineen tai valuutan tasoa tai muutosta, käytä VAIN annettuja viikkolukuja. Lasku merkitään punaisella värillä ja nousu vihreällä.'
$ruleL = 'LINKIT JA LÄHTEET (pakollinen): Jokainen maininta indeksistä, raaka-aineesta tai valuutasta on klikattava linkki sen Yahoo Finance -kurssisivulle (osoitteet annetaan viikkolukujen yhteydessä). Tämä koskee KAIKKIA mainintoja: korostuslaatikkoa, leipätekstiä ja taulukoita. Käytä target="_blank". Jokainen uutisista poimittu väite tai luku linkitetään sen lähteenä olevaan artikkeliin (uutisrivin perässä suluissa oleva osoite). Jos väitteelle ei ole suoraa kurssilinkkiä, esimerkiksi toimialan liikkeelle, linkitä se artikkeliin, josta väite on peräisin. Raportin loppuun tulee oma osio "Lähteet", joka listaa käytetyt artikkelit otsikolla ja klikattavalla linkillä. Linkkien ansiosta lukija voi tarkistaa jokaisen luvun helposti.'
$s3sys = $s3sys.Replace('6. EI VUOTOJA:', $ruleW + "`r`n" + $ruleL + "`r`n" + '6. EI VUOTOJA:')
$map['step_3'].settings.input.body.data.messages[0].content = $s3sys
# Matala reasoning ja riittava tokenibudjetti, jotta HTML ehtii valmiiksi asti.
# Aiemmin malli kirjoitti pitkan reasoning-osan ja content katkesi kesken (katkeamistarkistus
# step_5:ssa esti rikkinäisen raportin julkaisun).
$map['step_3'].settings.input.body.data | Add-Member -NotePropertyName 'reasoning_effort' -NotePropertyValue 'low' -Force
$map['step_3'].settings.input.body.data.max_tokens = 32000

$s3user = $map['step_3'].settings.input.body.data.messages[1].content
$s3user = $s3user.Replace('TULEVA VIIKKO: TALOUSKALENTERI JA TULOSKAUSI – UUTISET:', 'EUROOPPA, VIIKON MARKKINA-AJURIT JA TULEVA VIIKKO – UUTISET:')
if (-not $s3user.Contains('VIIKON ARTIKKELIEN KOKOTEKSTIT')) {
  $s3user = $s3user.Replace('ODOTETUT TAPAHTUMAT (seurantalista ja tapahtumien hakutulokset):', "VIIKON ARTIKKELIEN KOKOTEKSTIT (taustatieto ja tarkat yksityiskohdat):`r`n{{step_20['output']['scrapedNews']}}`r`n`r`nODOTETUT TAPAHTUMAT (seurantalista ja tapahtumien hakutulokset):")
}
if (-not $s3user.Contains('VIIKON MARKKINALUVUT')) {
  $s3user = $s3user.Replace('ODOTETUT TAPAHTUMAT (seurantalista ja tapahtumien hakutulokset):', "VIIKON MARKKINALUVUT (taulukko, liitä sellaisenaan raporttiin):`r`n{{step_23['output']['weeklyTable']}}`r`n`r`nVIIKON MARKKINALUVUT (tekstinä, käytä näitä lukuja leipätekstissä):`r`n{{step_23['output']['weeklyData']}}`r`n`r`nODOTETUT TAPAHTUMAT (seurantalista ja tapahtumien hakutulokset):")
}
$map['step_3'].settings.input.body.data.messages[1].content = $s3user

# --- 7b. step_5: lisaa katkeamistarkistus (Sunnuntaista peritty koodi ei tarkistanut HTML:n eheytta) ---
$map['step_5'].settings.sourceCode.code = Read-Utf8 -File "$build\step15_finalize.js"

# --- 8. Tallennus: tiedostonimi ja viesti ---
$s4 = $map['step_4'].settings.input
$s4.url.url = $s4.url.url.Replace('-viikkoennakko.html', '-viikkokatsaus.html')
$s4.body.data.message = 'Lisätty lauantain viikkokatsaus'

Write-Host 'Osa 3 valmis (kehotteet ja tallennus).'

# --- 9. Numerointi juoksevaksi: step_1..step_16 suoritusjarjestyksessa ---
# Activepiecesin MCP nimeaa askeleet luonnissa juoksevasti (step_1, step_2, ...), joten
# tyonkulku rakennetaan MCP:lla ja taman tiedoston nimet ovat samat kuin instanssissa.
$order = @('step_1','step_7','step_8','step_11','step_12','step_13','step_14','step_15','step_16','step_17','step_23','step_19','step_20','step_9','step_3','step_5','step_4')
# Nimet vastaavat Activepiecesin antamia nimiä. step_23 (viikon markkinaluvut) sai instanssissa
# alimman vapaan numeron step_17, joten se pysyy sellaisena; muut on numeroitu juoksevasti.
$rename = [ordered]@{
  'step_1'  = 'step_1';  'step_7'  = 'step_2';  'step_8'  = 'step_3';  'step_11' = 'step_4'
  'step_12' = 'step_5';  'step_13' = 'step_6';  'step_14' = 'step_7';  'step_15' = 'step_8'
  'step_16' = 'step_9';  'step_17' = 'step_10'; 'step_23' = 'step_17'; 'step_19' = 'step_11'
  'step_20' = 'step_12'; 'step_9'  = 'step_13'; 'step_3'  = 'step_14'; 'step_5'  = 'step_15'
  'step_4'  = 'step_16'
}

$chain = @()
$a = $json.flows[0].trigger.nextAction
while ($a) { $chain += $a; $a = $a.nextAction }
if ($chain.Count -ne $order.Count) { throw ('Askelmaara ei tasmaa: ' + $chain.Count + ' vs ' + $order.Count) }
foreach ($s in $chain) { $s.name = $rename[$s.name] }

$text = $json | ConvertTo-Json -Depth 100
# HUOM: step_13:n (entinen step_9) syoteavaimet sailyvat ennallaan (step_7_answer,
# step_8_answer, step_15_answer, ...), koska jaettu step9.js lukee ne nailla nimilla.
# Vain niiden ARVOT eli {{step_N[...]}}-viittaukset numeroidaan uudelleen.
$tokens = [ordered]@{}
$i = 0
foreach ($old in $rename.Keys) {
  $tokens[$old] = '@@S' + $i + '@@'
  $text = $text.Replace('{{' + $old + '[', '{{' + $tokens[$old] + '[')
  $i++
}
foreach ($old in $rename.Keys) {
  $text = $text.Replace('{{' + $tokens[$old] + '[', '{{' + $rename[$old] + '[')
}
if ($text.Contains('@@S')) { throw 'Token-korvaus jai kesken.' }

Write-Host 'Uudelleennumerointi:'
foreach ($old in $rename.Keys) { Write-Host ('  ' + $old + ' -> ' + $rename[$old]) }

Write-Utf8Bom -File $outPath -Text $text
Write-Host ('Kirjoitettu: ' + $outPath)
