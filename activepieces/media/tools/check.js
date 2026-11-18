// Tarkistaa Puolan mediakatsauksen työnkulun
'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== Puolan mediakatsauksen tarkistus ===\\n');

// Tarkista, että JSON-tiedosto on olemassa
const jsonPath = path.join(__dirname, '..', 'Puola viikkokatsaus.json');
if (!fs.existsSync(jsonPath)) {
  console.error('❌ Virhe: Puola viikkokatsaus.json ei löydy polusta:', jsonPath);
  process.exit(1);
}

console.log('✅ JSON-tiedosto löytyy');

// Lue ja tarkista JSON
let json;
try {
  const content = fs.readFileSync(jsonPath, 'utf8');
  json = JSON.parse(content);
  console.log('✅ JSON-syntaksi on kelvollinen');
} catch (e) {
  console.error('❌ Virhe: JSON-syntaksivirhe:', e.message);
  process.exit(1);
}

// Tarkista perustiedot
if (!json.flows || json.flows.length === 0) {
  console.error('❌ Virhe: Ei työnkulkuja löytynyt');
  process.exit(1);
}

const flow = json.flows[0];
console.log('✅ Työnkulku löytyy:', flow.displayName);

// Tarkista trigger
if (!flow.trigger) {
  console.error('❌ Virhe: Ei triggeria');
  process.exit(1);
}
console.log('✅ Trigger löytyy');

// Tarkista keskeiset askeleet
const requiredSteps = ['step_1', 'step_s1', 'step_s2', 'step_s3', 'step_s4', 'step_s5', 'step_s6', 'step_t', 'step_9m', 'step_13m', 'step_14m', 'step_15m', 'step_3m', 'step_5m', 'step_4m'];
let currentStep = flow.trigger.nextAction;
let foundSteps = [];

while (currentStep) {
  if (currentStep.name) {
    foundSteps.push(currentStep.name);
  }
  currentStep = currentStep.nextAction;
}

console.log('✅ Löytyneet askeleet:', foundSteps.length);

// Tarkista, että kaikki vaaditut askeleet löytyvät
const missingSteps = requiredSteps.filter(step => !foundSteps.includes(step));
if (missingSteps.length > 0) {
  console.error('❌ Puuttuvat askeleet:', missingSteps);
  process.exit(1);
}

console.log('✅ Kaikki vaaditut askeleet löytyvät');

// Tarkista Tavily-hakujen konfiguraatio
currentStep = flow.trigger.nextAction;
while (currentStep) {
  if (currentStep.name && currentStep.name.startsWith('step_s') && currentStep.settings && currentStep.settings.input) {
    const input = currentStep.settings.input;
    if (!input.query) {
      console.error('❌ Virhe: Askeleella', currentStep.name, 'ei ole query-kenttää');
    }
    if (!input.days || input.days !== 14) {
      console.error('❌ Varoitus: Askeleella', currentStep.name, 'days ei ole 14');
    }
    if (!input.include_domains || input.include_domains.length === 0) {
      console.error('❌ Varoitus: Askeleella', currentStep.name, 'ei ole include_domainsia');
    }
  }
  currentStep = currentStep.nextAction;
}

console.log('✅ Tavily-hakujen konfiguraatio tarkistettu');

// Tarkista GitHub-commit
currentStep = flow.trigger.nextAction;
let githubCommitFound = false;
while (currentStep) {
  if (currentStep.name === 'step_4m' && currentStep.settings && currentStep.settings.input) {
    const input = currentStep.settings.input;
    if (input.url && input.url.url && input.url.url.includes('data/media-pl/')) {
      githubCommitFound = true;
      console.log('✅ GitHub-commit polku oikein:', input.url.url);
    }
  }
  currentStep = currentStep.nextAction;
}

if (!githubCommitFound) {
  console.error('❌ Varoitus: GitHub-commit ei käytä oikeaa polkua');
}

console.log('\\n✅ Kaikki tarkistukset läpäisty!');