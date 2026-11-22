// "Puola puhuu" – laadunvartija. Estää ohuen tai tyhjän raportin julkaisun.
// Heittää virheen, jos aineistossa ei ole tarpeeksi lähteitä, domaineja, teemoja
// tai tekstiä. Tällöin GitHub-commitia ei tehdä ja ajo näkyy FAILED-tilassa.
export const code = async (inputs) => {
  const num = (v) => {
    const x = Number(v);
    return isFinite(x) ? x : 0;
  };

  const sourceCount = num(inputs.sourceCount);
  const domainCount = num(inputs.domainCount);
  const themeCount = num(inputs.themeCount);
  const nonEmptyBlocks = num(inputs.nonEmptyBlocks);
  const totalChars = num(inputs.totalChars);
  const warnings = Array.isArray(inputs.warnings) ? inputs.warnings : [];

  const problems = [];
  if (themeCount < 3) problems.push('tunnistettuja teemoja vain ' + themeCount + ' (minimi 3)');
  if (sourceCount < 8) problems.push('lähteitä vain ' + sourceCount + ' (minimi 8)');
  if (domainCount < 5) problems.push('eri domaineja vain ' + domainCount + ' (minimi 5)');
  if (nonEmptyBlocks < 3) problems.push('täytettyjä aineistolohkoja vain ' + nonEmptyBlocks + ' (minimi 3)');
  if (totalChars < 6000) problems.push('aineistoa vain ' + totalChars + ' merkkiä (minimi 6000)');

  if (problems.length > 0) {
    throw new Error('Laadunvartija: raporttia EI julkaistu. ' + problems.join('; ')
      + (warnings.length ? ' | Varoitukset: ' + warnings.join('; ') : ''));
  }

  return {
    ok: true,
    themeCount: themeCount,
    sourceCount: sourceCount,
    domainCount: domainCount,
    nonEmptyBlocks: nonEmptyBlocks,
    totalChars: totalChars,
    warnings: warnings
  };
};
