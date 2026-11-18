export const code = async (inputs) => {
  // Muotoillaan raportti SUOMEKSI tavallaiselle lukijalle
  
  const summary = inputs.summary_fi || 'Ei tietoja saatavilla';
  const topics = JSON.parse(inputs.trending_topics || '{}');
  
  const report = `
# PUOLAN VIIKONKATSAUS - MITÄ KANSALAISET PUHUVAT

${summary}

---

## YHTEENVETO AIHEPIIREISTÄ:

📅 Tämä katsaus perustuu suoraan puolalaisten medioiden uutisiin
🔍 Fokus: Tavallisten ihmisten huolenaiheet ja kiinnostuksen kohteet
🌐 Lähteet: WP Wiadomości, Gazeta.pl, RMF24, TVN24, Interia, Onet

📝 Tarkoituksena seurata:
- Mitä arkisia asioita puolalaiset keskustelevat
- Missä heidän mielenkiintonsa on
- Mikä heidän mielialassaan liikuttaa

### AIHEPIIRIT:
${Object.keys(topics).length > 0 
  ? Object.entries(topics)
      .filter(([key, items]) => items && items.length > 0)
      .map(([category, items]) => {
        const categoryNames = {
          citizen: 'Kansalaisten arkielämä',
          political: 'Poliittinen keskustelu', 
          security: 'Turvallisuus ja ulkopolitiikka',
          economy: 'Talous ja elintaso',
          environment: 'Ympäristö'
        };
        return `**${categoryNames[category] || category}** (${items.length} juttua):\n` + 
               items.slice(0, 3).map(item => `- ${item.title || 'Nimetön juttu'}`).join('\n');
      }).join('\n\n')
  : 'Ei aiheita saatavilla'}

---

*Tämä raportti auttaa ymmärtämään, mitä PUOLAN IHMISET todella puhuvat - ei mitä kansainväliset analyytikot sanovat heistä.*
`;
  
  return {
    report_html: report,
    title: 'Puolan viikkokatsaus - mitä kansalaiset puhuvat',
    summary_points: inputs.main_topics || 'ei aiheita'
  };
};