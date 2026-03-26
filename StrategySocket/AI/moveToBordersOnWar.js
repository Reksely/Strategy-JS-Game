const getBorderProvincesWithCountry = require('../utils/getBorderProvincesWithCountry.js')

const path = require('path')
const fs = require('fs')

function moveToBordersOnWar(
  country,// ai
  enemyCountry,  //player
  sessionData, sessionID) {
  const countries = sessionData.countries;

  if (!countries[country] || !countries[enemyCountry]) return [];

  // Only add to atWar if not already there
  if (!countries[country].atWar.includes(enemyCountry)) {
    countries[country].atWar.push(enemyCountry);
  }
  if (!countries[enemyCountry].atWar.includes(country)) {
    countries[enemyCountry].atWar.push(country);
  }

  // Get all border provinces (deduplicated)
  const borderProvincesRaw = getBorderProvincesWithCountry(country, enemyCountry, countries);
  const borderProvinces = [...new Set(borderProvincesRaw)];

  if (borderProvinces.length === 0) {
    const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
    fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2));
    return [];
  }

  // Get total soldiers across ALL provinces
  let totalSoldiers = 0;
  for (const province of countries[country].provinces) {
    totalSoldiers += countries[country].ProvincesSoldiers[province] || 0;
  }

  // Zero out all province soldiers first
  for (const province of countries[country].provinces) {
    countries[country].ProvincesSoldiers[province] = 0;
  }

  // Distribute soldiers evenly across border provinces
  const soldiersPerProvince = Math.floor(totalSoldiers / borderProvinces.length);
  let remainder = totalSoldiers - (soldiersPerProvince * borderProvinces.length);

  for (const province of borderProvinces) {
    countries[country].ProvincesSoldiers[province] = soldiersPerProvince;
    if (remainder > 0) {
      countries[country].ProvincesSoldiers[province]++;
      remainder--;
    }
  }

  // Write once after all modifications
  const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2));

  return borderProvinces;
}
module.exports = moveToBordersOnWar;
