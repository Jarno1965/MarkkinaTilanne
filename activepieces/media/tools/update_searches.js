const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Puola viikkokatsaus.json');
let json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Päivitä Tavily-hakujen kyselyt Puolan kielelle
const stepsToUpdate = {
  'step_7': {
    query: "Polish politics government budget economy",
    include_domains: [
      "wp.pl", "rp.pl", "interia.pl", "rmf24.pl", "onet.pl",
      "wyborcza.pl", "tvn24.pl", "oko.press", "dorzeczy.pl",
      "wpolityce.pl", "bankier.pl", "money.pl"
    ]
  },
  'step_8': {
    query: "Polish economy inflation monetary policy", 
    include_domains: [
      "wp.pl", "rp.pl", "interia.pl", "rmf24.pl", "onet.pl",
      "wyborcza.pl", "tvn24.pl", "oko.press", "dorzeczy.pl",
      "wpolityce.pl", "bankier.pl", "money.pl"
    ]
  },
  'step_11': {
    query: "Polish security defense military NATO Russia Ukraine",
    include_domains: [
      "wp.pl", "rp.pl", "interia.pl", "rmf24.pl", "onet.pl",
      "wyborcza.pl", "tvn24.pl", "oko.press", "dorzeczy.pl",
      "wpolityce.pl", "bankier.pl", "money.pl"
    ]
  },
  'step_12': {
    query: "Polish society culture education healthcare",
    include_domains: [
      "wp.pl", "rp.pl", "interia.pl", "rmf24.pl", "onet.pl",
      "wyborcza.pl", "tvn24.pl", "oko.press", "dorzeczy.pl",
      "wpolityce.pl", "bankier.pl", "money.pl"
    ]
  }
};

// Päivitä askeleet
let currentStep = json.flows[0].trigger.nextAction;
while (currentStep) {
  if (stepsToUpdate[currentStep.name]) {
    const update = stepsToUpdate[currentStep.name];
    currentStep.settings.input.query = update.query;
    currentStep.settings.input.include_domains = update.include_domains;
    console.log('✅ Päivitetty', currentStep.name);
  }
  currentStep = currentStep.nextAction;
}

// Muuta tiedostonimi step_5:ssä
currentStep = json.flows[0].trigger.nextAction;
while (currentStep) {
  if (currentStep.name === 'step_5') {
    // Päivitä filename-funktio
    const code = currentStep.settings.sourceCode.code;
    const updatedCode = code.replace(/\${cleanDate}-.*\.html/, '${cleanDate}-viikkokatsaus.html');
    currentStep.settings.sourceCode.code = updatedCode;
    console.log('✅ Päivitetty tiedostonimi');
    break;
  }
  currentStep = currentStep.nextAction;
}

// Päivitä GitHub-commit polku
currentStep = json.flows[0].trigger.nextAction;
while (currentStep) {
  if (currentStep.name === 'step_4') {
    currentStep.settings.input.url.url = "/repos/Jarno1965/MarkkinaTilanne/contents/data/media-pl/{{step_5['output']['filename']}}";
    console.log('✅ Päivitetty GitHub-commit polku');
    break;
  }
  currentStep = currentStep.nextAction;
}

// Tallenna päivitetty JSON
fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
console.log('✅ Kaikki päivitykset tallennettu');