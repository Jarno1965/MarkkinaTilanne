const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Puola viikkokatsaus.json');
let json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Lisää Puolan spesifiset Tavily-haut
const polishDomains = [
  "wp.pl", "rp.pl", "interia.pl", "rmf24.pl", "onet.pl",
  "wyborcza.pl", "tvn24.pl", "oko.press", "dorzeczy.pl",
  "wpolityce.pl", "bankier.pl", "money.pl"
];

const polishSearches = [
  {
    name: "step_s1",
    query: "Polish politics government budget economy",
    category: "politics"
  },
  {
    name: "step_s2", 
    query: "Polish economy inflation monetary policy",
    category: "economy"
  },
  {
    name: "step_s3",
    query: "Polish security defense military NATO Russia Ukraine",
    category: "security"
  },
  {
    name: "step_s4",
    query: "Polish society culture education healthcare",
    category: "society"
  },
  {
    name: "step_s5",
    query: "Polish energy environment climate",
    category: "energy"
  },
  {
    name: "step_s6",
    query: "Polish relations with Finland Nordic countries",
    category: "finland"
  }
];

// Lisää Google Trends -haku
const trendsStep = {
  name: "step_t",
  type: "PIECE",
  settings: {
    input: {
      auth: "{{connections['EAIQ8mqJo0mqpzcuLJad8']}}",
      url: "https://trends.google.com/trends/trending/rss?geo=PL",
      method: "GET",
      headers: {},
      failsafe: false,
      body_type: "none",
      queryParams: {},
      followRedirects: true,
      response_is_binary: false
    },
    pieceName: "@activepieces/piece-http",
    actionName: "send_request",
    sampleData: {},
    pieceVersion: "0.3.2"
  }
};

console.log('✅ Puolan hakukonfiguraatiot lisätty');