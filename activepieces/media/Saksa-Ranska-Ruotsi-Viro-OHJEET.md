# Saksa, Ranska, Ruotsi, Viro, Marokko, Brasilia, Argentiina ja Kiina puhuvat – Activepieces-työnkulut

Kymmenen samanrakenteista kuukausikatsausta, yksi per maa (Venäjä kattaa myös Valko-Venäjän).
Jokainen hakee **vain maan omalla kielellä** julkaistuja juttuja, kääntää ne suomeksi ja committaa
itsenäisen HTML5-raportin `data/media/`-kansioon. Malli on kopioitu työnkuluista "Puola puhuu" ja
"Venäjä puhuu". **Hakuikkuna on 30 vrk (kuukausi)** ja katsaukset ajetaan **kerran kuukaudessa**
(kuukauden 1. päivänä).

> **Huom 22.11.2026:** Puola puhuu **ei enää noudata tätä kiinteää mallia**. Se rakennettiin uudelleen
> dynaamiseksi: kartoitus (valtamedia + mielipide-/talousmedia + Wykop/Reddit) → AI:n tunnistamat
> 5–7 kuukauden puheenaihetta → täsmähaut → raportti, jonka osio-otsikot tulevat datasta.
> Katso `activepieces/media/Puola-puhuu-OHJEET.md`. Tämän tiedoston taulukko ja hakustrategiat
> koskevat muita maita.


| Työnkulku | Kieli | Aikataulu (Europe/Helsinki) | Tiedosto | Flow ID |
| --- | --- | --- | --- | --- |
| Saksa puhuu | `de` | 1. päivä klo 10:00 | `…-saksa-puhuu.html` | `1rupk7xKt3Cf1tFkMcQD2` |
| Ranska puhuu | `fr` | 1. päivä klo 11:00 | `…-ranska-puhuu.html` | `H94npyNLno8P53BP0dZRe` |
| Ruotsi puhuu | `sv` | 1. päivä klo 12:00 | `…-ruotsi-puhuu.html` | `GrfJLcVyE01gxBZiqXGqU` |
| Viro puhuu | `et` | 1. päivä klo 13:00 | `…-viro-puhuu.html` | `6Qz8lfbtXFVBl7Ljkqz5N` |
| Marokko puhuu | `fr` + `ar` | 1. päivä klo 14:00 | `…-marokko-puhuu.html` | `K9PIWWToDiTzrB7uIbeYD` |
| Brasilia puhuu | `pt-BR` | 1. päivä klo 15:00 | `…-brasilia-puhuu.html` | `rbCrjv7PYWAsZdPuwVn6L` |
| Argentiina puhuu | `es-AR` | 1. päivä klo 16:00 | `…-argentiina-puhuu.html` | `fZ2g3mAAdJa9Czu6K8PAO` |
| Kiina puhuu | `zh` | 1. päivä klo 17:00 | `…-kiina-puhuu.html` | `zbIbozMotgMxBmITVtQ3D` |

Ajot on porrastettu kuukauden 1. päivälle tunnin välein, jotta kymmenen mediakatsausta (Puola 08,
Venäjä 09, Saksa 10, Ranska 11, Ruotsi 12, Viro 13, Marokko 14, Brasilia 15, Argentiina 16,
Kiina 17) eivät aja samaan aikaan. `every_month`-trigger laukeaa kuukauden 1. päivänä valitun tunnin alussa
(minuutti 0).

## Yhteinen rakenne

| Vaihe | Tyyppi | Tehtävä |
| --- | --- | --- |
| `trigger` | Schedule `every_month` | Kuukauden 1. päivä, maakohtainen tunti |
| `step_1` | Date Helper | Nykyhetki `YYYY-MM-DD HH:mm:ss`, Europe/Helsinki |
| `step_2` | Date Helper | `- 30 day` → hyväksyttävän aikavälin alku (kuukausi taaksepäin) |
| `step_3` | Tavily | Maan valtamedia (maakohtainen strategia, ks. alla) |
| `step_4` | Tavily | Riippumattomat ja vaihtoehtoiset mediat (Marokossa arabiankieliset mediat) |
| `step_5` | OpenRouter `deepseek/deepseek-v4.1-flash` | Käännös + itsenäinen HTML5-raportti |
| `step_6` | Code | Puhdistaa HTML:n, lisää aikaleimapalkin, Base64 |
| `step_7` | GitHub `PUT /contents/...` | Committaa raportin `data/media/`-kansioon |

Yhteiset Tavily-parametrit: `search_depth: "advanced"`, `max_results: 15`,
`filter_by_language: true`, ja uutishauissa `start_date` = `step_2`,
`include_published_date: true`, `filter_by_published_date: true`.

## Hakustrategiat (testattu 18.11.2026)

| Maa | `step_3` (valtamedia) | `step_4` (vaihtoehtoiset) |
| --- | --- | --- |
| Saksa | `topic: news`, query `Deutschland Nachrichten aktuell Preise Mieten Rente Gesundheit Wirtschaft Politik` | `topic: news`, toimittajien nimet lainausmerkeissä: taz, neues deutschland, Jungle World, Katapult, Correctiv, netzpolitik.org, FragDenStaat, krautreporter |
| Ranska | `topic: news`, query `actualités France société vie quotidienne famille prix loyers salaires retraites santé économie politique de quoi parlent les Français` | `topic: news`, toimittajat: Mediapart, Blast, L'Humanité, Basta!, Reporterre, StreetPress, Marianne, Arrêt sur images |
| Ruotsi | `topic: news`, toimittajat: Dagens Nyheter, Svenska Dagbladet, Aftonbladet, Expressen, SVT + aiheet `elpriser hyror pension` | **`topic: general`** + `include_domains`: etc.se, arbetet.se, flamman.se, syre.se, dagensarena.se, kvartal.se |
| Viro | `topic: news` + `include_domains`: postimees.ee, delfi.ee, err.ee, ohtuleht.ee, aripaev.ee, query `hinnad palgad pensionid tervishoid` | `topic: news`, toimittajat: Müürileht, Sirp, Levila, Edasi |
| Marokko | **`topic: general`** + `include_domains`: lematin.ma, leconomiste.com, medias24.com, telquel.ma, le360.ma, aujourdhui.ma, lopinion.ma, lavieeco.com, challenge.ma, fr.hespress.com, yabiladi.com, barlamane.com, lakome2.com; query `Maroc prix salaires santé éducation emploi logement vie quotidienne` | **`topic: general`** + `include_domains`: hespress.com, le360.ma, ahdath.info, almassae.press.ma, alalam.ma, assabah.press.ma, alittihad.press.ma, barlamane.com, rue20.com, tanja24.com, al3omk.com; query `المغرب أسعار الأجور التقاعد الصحة التعليم السكن البطالة` |
| Brasilia | **`topic: general` + `time_range: month`** + `include_domains`: g1.globo.com, folha.uol.com.br, oglobo.globo.com, estadao.com.br, uol.com.br, valor.globo.com, agenciabrasil.ebc.com.br, metropoles.com, poder360.com.br, infomoney.com.br; query `Brasil preços salários emprego saúde educação moradia custo de vida` | **`topic: general` + `time_range: month`** + `include_domains`: brasildefato.com.br, cartacapital.com.br, intercept.com.br, apublica.org, ponte.org, outraspalavras.net, revistaforum.com.br, nexojornal.com.br, diplomatique.org.br |
| Argentiina | **`topic: general` + `time_range: month`** + `include_domains`: clarin.com, lanacion.com.ar, infobae.com, pagina12.com.ar, ambito.com, cronista.com, perfil.com, tn.com.ar, lavoz.com.ar; query `Argentina precios salarios empleo salud educación vivienda costo de vida` | **`topic: general` + `time_range: month`** + `include_domains`: eldestapeweb.com, tiempoar.com.ar, elcohetealaluna.com, revistaanfibia.com, cosecharoja.org, pacourondo.com.ar, revistacrisis.com.ar, largantapoderosa.com |

### Miksi juuri nämä (opit testiajoista)

1. **Saksa:** pitkä "mitä ihmiset puhuvat" -tyylinen lause palautti yhdistysten ja säätiöiden
   sivuja. Lyhyt, konkreettinen uutislause palauttaa Süddeutsche, Focus, taz ja tagesschau-aineistoa.
2. **Ranska:** yleinen uutislause toimii sellaisenaan ja tuottaa sekä valtamediaa että Mediapartin.
3. **Ruotsi:** `include_domains` + `topic: "news"` palauttaa **nollan** tuloksen, ja
   `general` + `include_domains` valtamedioille osuu vaalikoneeseen (svt.se/valkompass). Siksi
   valtamedia haetaan toimittajanimillä ja vaihtoehtomediat `general`-haulla. Prompti sallii
   `general`-hausta vain jutut, joiden julkaisupäivä selviää sisällöstä.
4. **Viro:** `include_domains` + `topic: "news"` toimii erinomaisesti, mutta lauseen pitää olla
   kapea – sanojen lisääminen (`majandus poliitika`) vei tuloksen nollaan.
5. **Marokko:** `topic: "news"` tuotti nollan tai ei-marokkolaisia tuloksia sekä ranskaksi että
   arabiaksi. Ratkaisu: `topic: "general"` + `include_domains` maakohtaisilla medioilla. Sama haku
   palauttaa sekä ranskankieliset että arabiankieliset jutut, kun domainit ovat oikein.
6. **Brasilia ja Argentiina:** `topic: "news"` palautti Brasilian valtamediasta englanninkielisiä
   Folha International -juttuja ja Argentiinasta `clarin.com/filer/...`-roskaosumia tai nollan.
   Ratkaisu: `topic: "general"` + **`time_range: "month"`** + `include_domains`.
   **Tärkeä rajoitus:** Tavily hylkää pyynnön (400), jos `time_range` ja `start_date`/`end_date`
   annetaan yhtä aikaa – siksi näissä työnkuluissa `start_date` on jätetty pois ja kuukausirajaus
   tulee `time_range`-parametrista. `step_2` (30 vrk) säilyy silti kehotteen aikavälinä.
7. **Kiina:** `topic: "news"` + `start_date` + kiinankieliset domainit palautti vain 2 tulosta, ja ne
   olivat lähinnä puolueen tiedotteita. Toimiva yhdistelmä on `topic: "general"` +
   `time_range: "month"` + `include_domains` (kuten Brasilia ja Argentiina). Lisäksi `guancha.cn`
   palautti käyttäjien itsejulkaisuja (`user.guancha.cn`) ilman päivämääriä ja jopa vuodelta 2021,
   joten se pudotettiin; tilalle otettiin talous- ja teknologia-alustat (36kr, huxiu, tmtpost,
   21jingji), jotka kirjoittavat työelämästä ja kulutuksesta.

### Brasilia ja Argentiina – oma kieli, oma media

Brasilia puhuu brasilianportugalia ja Argentiina argentiinanespanjaa, joten katsaukset noudattavat
Saksan ja Ranskan mallia: `step_3` = maan valtamedia, `step_4` = riippumattomat ja vaihtoehtoiset
mediat. Kummassakin `topic: "general"` + `time_range: "month"` + maakohtainen `include_domains`.

- **Brasilia:** valtamedia G1/Globo, Folha, O Globo, Estadão, UOL, Valor, Agência Brasil,
  Metrópoles, Poder360, InfoMoney; riippumattomat Brasil de Fato, CartaCapital, Intercept Brasil,
  Agência Pública, Ponte, Outras Palavras, Revista Fórum, Nexo, Le Monde Diplomatique Brasil.
- **Argentiina:** valtamedia Clarín, La Nación, Infobae, Página/12, Ámbito, El Cronista, Perfil, TN,
  La Voz; riippumattomat El Destape, Tiempo Argentino, El Cohete a la Luna, Anfibia, Cosecha Roja,
  Agencia Paco Urondo, Revista Crisis, La Garganta Poderosa.

Promptit hylkäävät muunkieliset ja englanninkieliset versiot sekä naapurimaiden mediat:
Brasiliassa portugalilaiset mediat (publico.pt, expresso.pt, dn.pt, observador.pt, jn.pt),
Argentiinassa Espanjan, Meksikon, Kolumbian, Chilen ja Uruguayn mediat sekä BBC Mundo, CNN en
Español, France 24 y DW.

### Kiina puhuu – vain manner-Kiinan kiinankieliset mediat

Kiinassa arkiset puheenaiheet eivät löydy pelkästä puoluelehdistöstä: Xinhua, People’s Daily ja CCTV
julkaisevat pääosin kokous- ja suunnitelmatekstejä. Siksi katsaus jakaa haut sisällön mukaan eikä
valtamedia/vaihtoehtoinen-media-akselin mukaan:

- `step_3` = uutisportaalit ja puolueen media: thepaper.cn, sina.com.cn, 163.com, qq.com, sohu.com,
  ifeng.com, chinanews.com.cn, cctv.com, people.com.cn, news.cn. Haku sanoilla
  `物价 菜价 房租 工资 就业 裁员 养老金 医保 教育 育儿 消费 民生`.
- `step_4` = talous-, aikakaus- ja teknologiamedia: caixin.com, yicai.com, jiemian.com, infzm.com,
  lifeweek.com.cn, latepost.com, nbd.com.cn, eeo.com.cn, stcn.com, cls.cn, caijing.com.cn,
  36kr.com, huxiu.com, tmtpost.com, 21jingji.com. Haku sanoilla
  `年轻人 收入 房价 消费 婚育 养老 生活成本 就业压力`.
- `step_8` = Weibo-keskustelut: `include_domains`: weibo.com, weibo.cn. Haku sanoilla
  `微博 网友 热搜 讨论 物价 房价 工资 就业 年轻人 生活成本 消费`. Vaihe on nimetty `step_8`:ksi,
  koska se lisättiin jälkeenpäin `step_4`:n ja `step_5`:n väliin – järjestys on silti
  `step_4` → `step_8` → `step_5`.

Kaikissa kolmessa: `topic: "general"` + `time_range: "month"` + `language: "zh"` +
`include_published_date: true`. `start_date` on jätetty pois, koska Tavily hylkää
`time_range` + `start_date` -yhdistelmän (HTTP 400).

Prompti rajaa lähteet tiukasti: vain manner-Kiinan kiinankieliset mediat. Hylättäviä ovat
englanninkieliset versiot (chinadaily.com.cn, globaltimes.cn, scmp.com, sixthtone.com) sekä
Hongkongin, Taiwanin, Singaporen ja ulkomaisten toimittajien kiinankieliset palvelut (hk01, mingpao,
theinitium, udn, cna.com.tw, zaobao, BBC Chinese, DW Chinese, VOA, RFI, NYT Chinese). Prompti myös

- merkitsee jokaisen lähteen tyypin: puolueen tai valtion media, valtion omistama uutisportaali,
  yksityinen alustamedia, talous- tai aikakauslehti ja tutkiva media, alustan itsejulkaisu,
- hylkää koonti- ja listasivut (`/tag/`, `/list/`, timeline-palvelut) sekä uudelleenjulkaisut, joiden
  luvut ovat peräisin aikaisemmilta vuosilta,
- sanoo lukijalle avoimesti, että valtaosa manner-Kiinan mediasta on valtion ohjaamaa, eikä esitä
  yhden median väitettä omana faktana,
- hyväksyy alustojen itsejulkaisut (self-media) vain, jos jutulla on tekijä, tuore päiväys ja
  konkreettisia lukuja tai tavallisten ihmisten kokemuksia,
- käsittelee Weibon erikseen (sääntö 11): enintään 3 lähdettä, aina anekdotaalisesti (”Weibossa
  käyttäjät kirjoittavat…”), ei koskaan faktana; haku- ja koontisivut, mainosraportit sekä
  päiväämättömät postaukset hylätään,
- rajaa lähdemäärän: tasan enintään 10 lähdettä, enintään 2 samasta mediasta.

Testiajot 20.11.2026: ilman Weiboa `6iItvhyaJWnJXHZNCXXAE` (119 s, 10 lähdettä) ja Weibon kanssa
`muJ1SXI896mtRJtiB5c63` (64 s, 10 lähdettä, joista 1 Weibo). Ensimmäinen Weibo-ajo tuotti 12
lähdettä ja kuusi niistä samasta mediasta, joten kehotetta kiristettiin (tasan 10, max 2 per media).

#### LIHKG ja muut kiinankieliset foorumit – miksi ei ole mukana

LIHKG (lihkg.com) on **Hongkongin** foorumi ja sen sisältö on kirjoitettua kantonikiinaa, ei
mandariinikiinaa. Se ei myöskään ole Tavilylla käytännössä indeksoitu:

- `time_range: "month"` + `include_domains: ["lihkg.com"]` palautti 1–2 ketjua, ja **kaikilta
  puuttui `published_date`**.
- Ilman aikarajausta 5 ketjua, joista vanhimmat ovat monen vuoden takaa (thread-ID 357k, kun tuoreet
  ketjut ovat ~4170k+) ja yksi oli Wikipedia-tekstiä kopioiva ketju.
- Suurin osa sisällöstä on kirjautumisen takana tai JavaScript-renderöityä, joten hakutulos ei ole
  luotettavasti päivätty eikä läpäise 30 vrk:n sääntöä.

Siksi LIHKG jätettiin pois. Jos Hongkongin keskustelu halutaan mukaan, se kannattaa tehdä omana
katsauksenaan (esimerkiksi ”Hongkong puhuu”): kieli `zh-HK`/kantoni, lähteet hk01.com, mingpao.com
ja lihkg.com, ja prompti hyväksyy myös perinteiset merkit sekä päivämäärän päättelyn ketjun
sisällöstä.

### Marokko puhuu – kaksi kieltä samassa katsauksessa

Marokossa pääkielet ovat ranska ja arabia, joten katsaus jakaa haut kielen mukaan eikä
valtamedia/vaihtoehtoinen-media-akselin mukaan:

- `step_3` = ranskankieliset marokkolaiset mediat: Le Matin, L'Économiste, Médias24, TelQuel,
  Le360 (fr.le360.ma), Aujourd'hui le Maroc, L'Opinion, La Vie Éco, Challenge, Hespress FR,
  Yabiladi, Barlamane FR, Lakome.
- `step_4` = arabiankieliset marokkolaiset mediat: Hespress, Le360 (ar.), Ahdath.info, Al Massae,
  Al Alam, Assabah, Al Ittihad Al Ichtiraki, Barlamane, Rue20, Tanja24, Al3omk.

Prompti hyväksyy molemmat kielet mutta hylkää englanninkieliset versiot (esim. en.hespress.com)
sekä Ranskan, Belgian, Sveitsin, Kanadan, Algerian, Tunisian ja Egyptin mediat. Lähdeluettelossa
näkyy sekä alkuperäinen otsikko että kieli.

Huom: `topic: "general"` ei palauta `published_date`-kenttää yhtä luotettavasti kuin `news`,
joten prompti saa hyväksyä jutun, jos julkaisupäivä selviää sisällöstä tai URL-osoitteesta.

## Raportin rakenne ja pituusraja

Pääotsikko + 30 vrk (kuukausi) aikaväli, korostuslaatikko ("Kuukauden polttavimmat puheenaiheet"), osiot
arki/perhe/yhteiskunta, toimeentulo/hinnat/talous, politiikka ja julkiset kiistat, mediakentän
äänet sekä lähdeluettelo (alkuperäinen otsikko + suomennos, päivä, lähdetyyppi, URL).

**Pituusraja on pakollinen:** enintään ~700–800 sanaa, 2–3 kappaletta per osio, enintään 10
lähdettä ja CSS enintään ~45 riviä. Syy: `deepseek/deepseek-v4.1-flash` katkaisi Saksan raportin
kesken kahdesti (17–20 tuhatta merkkiä), jolloin Code-vaihe hylkäsi sen eikä mitään julkaistu.
Tiiviimpi raportti valmistui 24 sekunnissa.

## Testaus ja ylläpito

```text
ap_validate_flow({ folderName: "Media" })          # kaikki 9 työnkulkua + yhteydet
ap_test_flow({ flowId: "<id>" })                    # oikea ajo, committaa näyteraportin
ap_lock_and_publish({ flowId: "<id>" })             # julkaise muutokset
```

Testiajo committaa aidon raportin repoon. Jos raportin HTML katkeaa, Code-vaihe heittää virheen
eikä committaa mitään – se on tarkoituksellinen turvaverkko.

### Uusien lähteiden lisääminen

- **Valtamedia:** lisää toimittajan nimi `«»`-lainausmerkeissä `step_3`:n `query`-kenttään
  (Ruotsi, Viro: myös `include_domains`-listaan).
- **Vaihtoehtoinen media:** lisää nimi `step_4`:n `query`-kenttään tai domain
  `include_domains`-listaan.
- Aja `ap_validate_flow` ja `ap_test_flow`, tarkista lähdeluettelo ja julkaise.

## Tunnettuja rajoituksia

- Ruotsin ja Viron uutisindeksi on ohut: osa tuloksista on etusivuja tai viranomaissivuja, jotka
  prompti hylkää. Kattavuus vaihtelee viikoittain ja raportti kertoo aukot avoimesti.
- Saksan ja Ranskan hauissa pitää muistaa naapurimaiden kieliversiot (Itävalta, Sveitsi, Belgia,
  Kanada) – ne on kielletty promptissa.
- Marokon `general`-haut palauttavat myös tagi- ja etusivuja (esim. `hespress.com/tag/...`), jotka
  prompti hylkää. Le360 ja Barlamane julkaisevat saman jutun ranskaksi ja arabiaksi, joten sama
  aihe voi näkyä kahdessa kieliversiossa.
- Brasilian Folha palauttaa myös englanninkielisiä International-juttuja ja Argentiinan Infobae
  Kolumbian-osionsa juttuja; prompti hylkää ne kielirajauksen ja maavalinnan perusteella.
  El Destapen hakutuloksissa on mukana kevyempiä lifestyle-juttuja, joten lähdeluettelo kannattaa
  tarkistaa testiajon jälkeen.
- Kaikki raportit ajetaan sivustolla hiekkalaatikossa ilman skriptejä, joten `<script>`-tagit ovat
  kiellettyjä.
