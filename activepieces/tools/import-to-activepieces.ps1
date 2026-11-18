<#
.SYNOPSIS
  Päivittää tämän kansion Activepieces-työnkulut (JSON-tiedostot) Activepieces-instanssiin REST-rajapinnan kautta.

.DESCRIPTION
  Skripti lukee kaikki activepieces-kansion *.json-tiedostot rekursiivisesti (myos alikansiot) ja tekee jokaiselle:
    1) etsii vastaavan työnkulun instanssista (ensin metadata.externalId, sitten nimen perusteella)
    2) tuo tiedoston sisällön työnkulun uudeksi versioksi (IMPORT_FLOW)
    3) julkaisee version (LOCK_AND_PUBLISH), ellei -NoPublish ole annettu

  Oletuksena skripti on KUIVA-AJO: se ei muuta mitään, vaan kertoo mitä tekisi.
  Lisää -Apply, kun haluat tehdä muutokset.

  API-avain luetaan ympäristömuuttujasta ACTIVE_PIECES_API_KEY tai annetaan -ApiKey-parametrilla.
  Avainta ei tulosteta mihinkään.

.EXAMPLE
  # 1) Tarkista tiedostot ilman verkkoyhteyttä
  .\import-to-activepieces.ps1 -Offline -ProjectId x

.EXAMPLE
  # 2) Kuiva-ajo: näe mitä tehtäisiin
  $env:ACTIVE_PIECES_API_KEY = '...'
  .\import-to-activepieces.ps1 -ProjectId 'projektin-id'

.EXAMPLE
  # 3) Tee muutokset ja julkaise
  .\import-to-activepieces.ps1 -ProjectId 'projektin-id' -Apply
#>
[CmdletBinding()]
param(
    [string]$BaseUrl = 'https://cloud.activepieces.com/api',
    [Parameter(Mandatory = $true)][string]$ProjectId,
    [string]$ApiKey = $env:ACTIVE_PIECES_API_KEY,
    [switch]$Apply,
    [switch]$CreateMissing,
    [switch]$NoPublish,
    [switch]$Offline
)

$ErrorActionPreference = 'Stop'
$folder = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$excluded = @('Kello 22 raportti.json')
$files = Get-ChildItem -LiteralPath $folder -Filter '*.json' -Recurse | Where-Object { $excluded -notcontains $_.Name } | Sort-Object Name
if ($files.Count -eq 0) { throw "Kansiosta $folder ei löytynyt yhtään json-tiedostoa." }

function Read-FlowFile {
    param([string]$Path)
    $text = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    $text = $text.TrimStart([char]0xFEFF)
    $json = $text | ConvertFrom-Json
    $flow = $json.flows[0]
    return [pscustomobject]@{
        File          = $Path.Substring($folder.Length).TrimStart([char]92)
        DisplayName   = $flow.displayName
        ExternalId    = $json.metadata.externalId
        SchemaVersion = $flow.schemaVersion
        Trigger       = $flow.trigger
        Notes         = @($flow.notes)
    }
}

$items = @()
foreach ($f in $files) {
    $it = Read-FlowFile -Path $f.FullName
    if (-not $it.DisplayName) { throw "$($it.File): työnkulun displayName puuttuu." }
    if (-not $it.Trigger) { throw "$($it.File): trigger puuttuu." }
    $items += $it
}

Write-Host "Löytyi $($items.Count) tiedostoa:" -ForegroundColor Cyan
$items | Format-Table File, DisplayName, ExternalId, SchemaVersion -AutoSize | Out-String -Width 200 | Write-Host

if ($Offline) {
    Write-Host 'Offline-tarkistus valmis. Tiedostot ovat luettavissa ja rakenne on kunnossa.' -ForegroundColor Green
    return
}

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    throw 'API-avain puuttuu. Aseta se: $env:ACTIVE_PIECES_API_KEY = ''sinun-avain'' tai anna -ApiKey.'
}

$headers = @{
    Authorization  = "Bearer $ApiKey"
    'Content-Type' = 'application/json'
}
$apiRoot = $BaseUrl.TrimEnd('/')

function Invoke-Ap {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        $Body
    )
    $params = @{
        Method  = $Method
        Uri     = "$apiRoot$Path"
        Headers = $headers
    }
    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 100 -Compress)
    }
    return Invoke-RestMethod @params
}

function New-ImportBody {
    param($Item)
    return @{
        type    = 'IMPORT_FLOW'
        request = @{
            displayName   = $Item.DisplayName
            trigger       = $Item.Trigger
            schemaVersion = $Item.SchemaVersion
            notes         = $Item.Notes
            valid         = $true
        }
    }
}

Write-Host 'Haetaan työnkulut instanssista...' -ForegroundColor Cyan
$existing = @()
$cursor = $null
do {
    $query = "/v1/flows?projectId=$ProjectId&limit=100"
    if ($cursor) { $query += "&cursor=$([uri]::EscapeDataString($cursor))" }
    $page = Invoke-Ap -Method Get -Path $query
    if ($page.data) { $existing += $page.data }
    $cursor = $page.next
} while ($cursor)
Write-Host "Instanssissa on $($existing.Count) työnkulku(a)." -ForegroundColor Cyan

$results = @()
foreach ($it in $items) {
    $match = $null
    if ($it.ExternalId) {
        $match = $existing | Where-Object { $_.externalId -eq $it.ExternalId } | Select-Object -First 1
    }
    if (-not $match) {
        $match = $existing | Where-Object { $_.version.displayName -eq $it.DisplayName } | Select-Object -First 1
    }

    if ($match) {
        $action = "IMPORT_FLOW (nykyinen versio sailyy, kunnes julkaiset)"
        if ($Apply) {
            Invoke-Ap -Method Post -Path "/v1/flows/$($match.id)" -Body (New-ImportBody -Item $it) | Out-Null
            if (-not $NoPublish) {
                Invoke-Ap -Method Post -Path "/v1/flows/$($match.id)" -Body @{
                    type    = 'LOCK_AND_PUBLISH'
                    request = @{ status = 'ENABLED' }
                } | Out-Null
                $action = "IMPORT_FLOW + LOCK_AND_PUBLISH -> $($match.id)"
            } else {
                $action = "IMPORT_FLOW -> $($match.id) (ei julkaistu)"
            }
        }
        $results += [pscustomobject]@{ File = $it.File; Kohde = $it.DisplayName; Tulos = $action }
    }
    elseif ($CreateMissing -and $Apply) {
        $created = Invoke-Ap -Method Post -Path '/v1/flows' -Body @{
            displayName = $it.DisplayName
            projectId   = $ProjectId
        }
        Invoke-Ap -Method Post -Path "/v1/flows/$($created.id)" -Body (New-ImportBody -Item $it) | Out-Null
        if (-not $NoPublish) {
            Invoke-Ap -Method Post -Path "/v1/flows/$($created.id)" -Body @{
                type    = 'LOCK_AND_PUBLISH'
                request = @{ status = 'ENABLED' }
            } | Out-Null
        }
        $results += [pscustomobject]@{ File = $it.File; Kohde = $it.DisplayName; Tulos = "LUOTIIN uusi työnkulku $($created.id)" }
    }
    else {
        $results += [pscustomobject]@{ File = $it.File; Kohde = $it.DisplayName; Tulos = 'EI LÖYTYNYT (tuo käsin tai lisää -CreateMissing -Apply)' }
    }
}

Write-Host ''
$results | Format-Table File, Kohde, Tulos -AutoSize | Out-String -Width 250 | Write-Host

if (-not $Apply) {
    Write-Host 'Tämä oli kuiva-ajo. Mitään ei muutettu. Aja uudelleen -Apply, kun haluat tehdä muutokset.' -ForegroundColor Yellow
} else {
    Write-Host 'Valmis. Tarkista lopputulos Activepiecesin käyttöliittymästä.' -ForegroundColor Green
}
