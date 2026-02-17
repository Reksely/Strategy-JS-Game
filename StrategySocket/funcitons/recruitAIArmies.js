const fs = require('fs');
const path = require('path');
const getBorderProvincesWithCountry = require('../utils/getBorderProvincesWithCountry.js')
const getBorderProvinces = require('../utils/getBorderProvinces.js')
const modifySoldiers = require("../utils/modifySoldiers.js")

// Recruitment cost starts at 1
let recruitCost = 0.25;

function getRecruitmentCost() {

  // Increment cost each time
  recruitCost += 0.06;

  return recruitCost;

}

function getMaxRecruits(countr, countries) {

  // Get max recruit amount based on treasury

  let treasury = countries[countr].treasury;
  let cost = getRecruitmentCost();

  return Math.floor(treasury / cost) - 500;

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
      if (enemyCountries.length > 0) {
        let borders = await getBorderProvincesWithCountry(country, enemyCountries[0], countries);
        let province = borders[Math.floor(Math.random() * borders.length)];
        await modifySoldiers(country, province, Math.round(getMaxRecruits(country, countries) / 3), sessionID);
      } else {
        let borders =  await getBorderProvinces(country, countries);

        let province = borders[Math.floor(Math.random() * borders.length)];
        await modifySoldiers(country, province, Math.round(getMaxRecruits(country, countries) / 4), sessionID);
      }
    }
  }
}

module.exports = recruitAIArmies;
