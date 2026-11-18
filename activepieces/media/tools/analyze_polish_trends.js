export const code = async (inputs) => {
  // Analysoi mitä TAVALLISET PUOLALAISET puhuvat - ei mitä kansainväliset analyytikot sanovat
  
  const articles = JSON.parse(inputs.articles || '[]');
  
  if (articles.length === 0) {
    return {
      main_topics: 'ei artikkeleita saatavilla',
      trending_topics: 'ei trendejä',
      polish_sentiment: 'neutraali',
      summary_fi: 'Ei puolalaisia uutisia saatavilla tällä viikolla.'
    };
  }
  
  // Etsitään todellisia kansalaisaiheita - EI markkinatalous-juttuja
  const citizenTopics = articles.filter(article => {
    const content = (article.title + ' ' + article.content).toLowerCase();
    // Mitä tavalliset ihmiset puhuvat:
    const citizenKeywords = [
      'ceny', 'energia', 'inflacja', 'emerytury', 'mieszkania', 'szpitale', 
      'edukacja', 'bezrobocie', 'komunikacja', 'środowisko', 'bezpieczeństwo',
      'prąd', 'gaz', 'żywność', 'lekarze', 'szkoły', 'transport', 'podatki',
      'renty', 'koszty życia', 'praca', 'wynagrodzenia', 'dzieci', 'rodzina',
      'starzy', 'pielęgniary', 'leki', 'koleje', 'drogi', 'śmieci', 'woda'
    ];
    return citizenKeywords.some(keyword => content.includes(keyword));
  });
  
  // Etsitään myös poliittiset riidat (tämä KIINNOSTAA tavallista ihmistä)
  const politicalTopics = articles.filter(article => {
    const content = (article.title + ' ' + article.content).toLowerCase();
    const politicalKeywords = ['prezydent', 'premier', 'rząd', 'sejm', 'senat', 'partia', 'wybory', 'głosowania'];
    return politicalKeywords.some(keyword => content.includes(keyword));
  });
  
  // Etsitään sotilaalliset/jännitteiden aiheet (myös kiinnostavia kansalaisille)
  const securityTopics = articles.filter(article => {
    const content = (article.title + ' ' + article.content).toLowerCase();
    const securityKeywords = ['ukraina', 'rosja', 'wojna', 'granica', 'bezpieczeństwo', 'armia', 'NATO'];
    return securityKeywords.some(keyword => content.includes(keyword));
  });
  
  // Etsitään talousaiheet (ei markkinataloutta, vaan kansalaisten näkökulmasta)
  const economyTopics = articles.filter(article => {
    const content = (article.title + ' ' + article.content).toLowerCase();
    const economyKeywords = ['bezrobocie', 'inflacja', 'ceny', 'gospodarka', 'budżet', 'subsidies', 'pomoc'];
    return economyKeywords.some(keyword => content.includes(keyword));
  });
  
  // Etsitään ympäristöaiheet
  const environmentTopics = articles.filter(article => {
    const content = (article.title + ' ' + article.content).toLowerCase();
    const envKeywords = ['klimat', 'środowisko', 'smog', 'zanieczyszczenie', 'odpady', 'recycling'];
    return envKeywords.some(keyword => content.includes(keyword));
  });

  const topicsSummary = [];
  
  if (citizenTopics.length > 0) {
    topicsSummary.push(`KANSALAISAIHEET (${citizenTopics.length} juttua): ` + 
      citizenTopics.slice(0, 5).map(a => `${a.title} (${a.category})`).join(', '));
  }
  
  if (politicalTopics.length > 0) {
    topicsSummary.push(`POLIITTINEN RIITA (${politicalTopics.length} juttua): ` + 
      politicalTopics.slice(0, 3).map(a => `${a.title}`).join(', '));
  }
  
  if (securityTopics.length > 0) {
    topicsSummary.push(`TURVALLISUUS (${securityTopics.length} juttua): ` + 
      securityTopics.slice(0, 3).map(a => `${a.title}`).join(', '));
  }
  
  if (economyTopics.length > 0) {
    topicsSummary.push(`TALOUS JA ELINTASO (${economyTopics.length} juttua): ` + 
      economyTopics.slice(0, 3).map(a => `${a.title}`).join(', '));
  }
  
  if (environmentTopics.length > 0) {
    topicsSummary.push(`YMPÄRISTÖ (${environmentTopics.length} juttua): ` + 
      environmentTopics.slice(0, 2).map(a => `${a.title}`).join(', '));
  }

  // Laske sentimentti
  let sentiment = 'neutraali';
  const negativeCount = articles.filter(a => a.sentiment === 'negatywny').length;
  const positiveCount = articles.filter(a => a.sentiment === 'pozytywny').length;
  
  if (negativeCount > positiveCount * 2) {
    sentiment = 'negatywny';
  } else if (positiveCount > negativeCount * 2) {
    sentiment = 'pozytywny';
  }
  
  return {
    main_topics: topicsSummary.length > 0 ? topicsSummary.join(' ;; ') : 'ei merkittäviä aiheita',
    trending_topics: JSON.stringify({
      citizen: citizenTopics.slice(0, 8),
      political: politicalTopics.slice(0, 5),
      security: securityTopics.slice(0, 5),
      economy: economyTopics.slice(0, 5),
      environment: environmentTopics.slice(0, 3)
    }),
    polish_sentiment: sentiment,
    summary_fi: `MITÄ PUOLALAISET PUHUVAT:\n\n` + 
      (topicsSummary.length > 0 ? topicsSummary.join('\n\n') : 'Ei merkittäviä aiheita tällä viikolla.') +
      `\n\nYLEINEN MIELIALA: ${sentiment === 'negatywny' ? 'Huolestunut' : sentiment === 'pozytywny' ? 'Positiivinen' : 'Neutraali'}`
  };
};