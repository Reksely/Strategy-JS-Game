const fs = require('fs');
const path = require('path');
const getBorderProvincesWithCountry = require('../utils/getBorderProvincesWithCountry.js')
const getBorderProvinces = require('../utils/getBorderProvinces.js')
const modifySoldiers = require("../utils/modifySoldiers.js")

// Recruitment cost for AI (fixed rate, not escalating)
const AI_RECRUIT_COST = 0.5;

function getMaxRecruits(country, countries) {
  let treasury = countries[country].treasury;
  let maxRecruits = Math.floor(treasury / AI_RECRUIT_COST);
  return Math.max(0, maxRecruits);
}


async function recruitAIArmies(sessionID, selectedCountry) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
  const countries = sessionData.countries;
  if (!countries) return console.log("There are no countries!");

  for (const country of Object.keys(countries)) {
    if (countries[country].provinces.length === 0) continue;
    if (country == selectedCountry) continue;

    const recruitChance = Math.min(countries[country].treasury / 500, 0.3);
    if (Math.random() < recruitChance) {
      let enemyCountries = countries[country].atWar;
      let maxRecruits = getMaxRecruits(country, countries);
      if (maxRecruits <= 0) continue;

      if (enemyCountries.length > 0) {
        let borders = getBorderProvincesWithCountry(country, enemyCountries[0], countries);
        if (borders.length === 0) continue;
        let province = borders[Math.floor(Math.random() * borders.length)];
        let amount = Math.max(1, Math.round(maxRecruits / 3));
        await modifySoldiers(country, province, amount, sessionID);
      } else {
        let borders = getBorderProvinces(country, countries);
        if (borders.length === 0) continue;
        let province = borders[Math.floor(Math.random() * borders.length)];
        let amount = Math.max(1, Math.round(maxRecruits / 4));
        await modifySoldiers(country, province, amount, sessionID);
      }
    }
  }
}

module.exports = recruitAIArmies;
