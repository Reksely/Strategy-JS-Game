const findWeakNeighbour = require('../funcitons/findWeakNeighbour')
const moveToBordersOnWar = require('../AI/moveToBordersOnWar')
const startWarAILoop = require('../AI/startWarAILoop')
const {declareWarWithoutAdditionalFunctions} = require("../funcitons/declareWar");
const sleep = require('../utils/sleep')
const fs = require('fs')
const path = require('path')

async function runAIActions(country, sessionID, client, selectedCountry) {
  // Re-read fresh session data
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  let sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
  const countries = sessionData.countries;

  if (!countries[country] || countries[country].provinces.length === 0) return;

  // Find neighbour with fewer provinces/soldiers
  const target = findWeakNeighbour(country, countries);
  console.log(target + " is weak for " + country);

  if (target && countries[target] && countries[target].provinces.length > 0) {
    // Check not already at war with target
    if (countries[country].atWar.includes(target)) return;

    // Move attacker troops to borders
    moveToBordersOnWar(country, target, sessionData, sessionID);

    await sleep(Math.floor(Math.random() * (20000 - 10000 + 1) + 10000));

    // Declare war (reads fresh data internally)
    declareWarWithoutAdditionalFunctions(country, target, sessionID);

    // Re-read after war declaration for fresh state
    sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));

    // Move defender troops to borders
    moveToBordersOnWar(target, country, sessionData, sessionID);

    // Start war loops for both sides
    startWarAILoop(country, target, sessionData, selectedCountry, client, sessionID);
    await sleep(5000);
    startWarAILoop(target, country, sessionData, selectedCountry, client, sessionID);
  }
}

async function runAIAggression(sessionID, selectedCountry, client) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
  const countries = sessionData.countries;
  // Get all AI countries
  const aiCountries = Object.keys(countries).filter(c => c != selectedCountry && countries[c].provinces.length > 0);

  if (aiCountries.length < 2) return;

  // Pick one random AI country to be aggressive
  const aggressor = aiCountries[Math.floor(Math.random() * aiCountries.length)];

  await runAIActions(aggressor, sessionID, client, selectedCountry);
}


module.exports = runAIAggression
