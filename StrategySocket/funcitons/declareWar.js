const fs = require('fs');
const path = require('path');
const startWarAILoop = require('../AI/startWarAILoop')
const moveToBordersOnWar = require('../AI/moveToBordersOnWar')

async function declareWar(selectedCountry, enemyCountry, sessionID, client) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));

  const changedProvinces = moveToBordersOnWar(
    enemyCountry,  // ai
    selectedCountry, // player
    sessionData,
    sessionID,
  );

  startWarAILoop(enemyCountry, selectedCountry, sessionData, selectedCountry, client, sessionID);
  return changedProvinces;
}

async function declareWarWithoutAdditionalFunctions(selectedCountry, enemyCountry, sessionID) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
  const countries = sessionData.countries;

  sessionData.currentWars = (sessionData.currentWars || 0) + 1;

  // Only add if not already at war
  if (!countries[selectedCountry].atWar.includes(enemyCountry)) {
    countries[selectedCountry].atWar.push(enemyCountry);
  }
  if (!countries[enemyCountry].atWar.includes(selectedCountry)) {
    countries[enemyCountry].atWar.push(selectedCountry);
  }

  const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2));

  return { message: "War declared successfully", currentWars: sessionData.currentWars, countriesAtWar: [selectedCountry, enemyCountry] };
}

module.exports = {declareWar, declareWarWithoutAdditionalFunctions}
