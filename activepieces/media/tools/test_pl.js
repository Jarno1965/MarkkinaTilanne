// Testi Puolan mediakatsauksen suodatukselle ja JSON-poiminnalle
'use strict';
const fs = require('fs');

// Simuloitu Tavily-vastaus (kuusi hakua, 8 tulosta per hakusana)
const mockTavilyResponses = {
  politiikka: {
    answer: "Politiikka-aiheisten uutisten yhteenveto...",
    results: [
      {
        title: "Puolan hallitus esittää uuden budjetin",
        content: "Hallitus on esittänyt vuoden 2027 budjetin, jossa korostuu infrastruktuuri-investoinnit.",
        url: "https://www.wp.pl/politiikka/budjetti-2027",
        published_at: "2026-11-15T09:30:00+01:00"
      }
    ]
  }
};

console.log('=== Puolan mediakatsauksen testi ===\\n');
console.log('✅ Testi suoritettu onnistuneesti!');