$kello11 = @{
  File = 'Kello 11 Eurooppa.json'
  LabelAsia = 'EUROOPPA'
  LabelEurope = 'HELSINKI JA SUOMI'
  Days11 = '1'; Query11 = 'European stocks morning session movers company announcements and earnings results reported today STOXX DAX FTSE'
  Days12 = '3'; Range12 = 'day'; Query12 = 'anticipated events today European earnings central bank decision US data release IPO listing what to watch'
  DaysOut = '3'; Intraday = $true; Step3Anc = 'VAPAAPAIVAT'
  Rules3 = @('rule3','rule3b','ruleprice1','ruleevent')
  Rules10 = @('rule10','ruleprice1','ruleevent')
}

$kello18 = @{
  File = 'Kello 18 raportti.json'
  LabelAsia = 'USA'
  LabelEurope = 'EUROOPPA JA HELSINKI'
  Days11 = '1'; Query11 = 'US stock market session movers breaking news and earnings results reported after the bell today Wall Street'
  Days12 = '5'; Range12 = 'day'; Query12 = 'tonight earnings results after the close IPO listing central bank decision what to watch'
  DaysOut = '3'; Intraday = $true; Step3Anc = '10. EI VUOTOJA'
  Rules3 = @('rule3','rule3b','ruleprice1','ruleevent')
  Rules10 = @{}
}

$sunnuntai = @{
  File = 'Sunnuntai.json'
  LabelAsia = 'KULUNUT VIIKKO JA GLOBAALIT MARKKINAT'
  LabelEurope = 'TULEVA VIIKKO: TALOUSKALENTERI JA TULOSKAUSI'
  Days11 = '7'; Query11 = 'global stock markets weekly wrap summary biggest moves last week earnings results and reaction'
  Days12 = '7'; Range12 = 'week'; Query12 = 'market events week ahead economic calendar earnings IPO central bank decision what investors are watching'
  DaysOut = '7'; Intraday = $false; Step3Anc = '6. EI VUOTOJA'
  Rules3 = @('rule3_short','rule3b','ruleprice1b')
  Rules10 = @{}
}

$reports = @($kello11, $kello18, $sunnuntai)
