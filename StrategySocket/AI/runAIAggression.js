const findWeakNeighbour = require('../funcitons/findWeakNeighbour')
const moveToBordersOnWar = require('../AI/moveToBordersOnWar')
const startWarAILoop = require('../AI/startWarAILoop')
const {declareWarWithoutAdditionalFunctions} = require("../funcitons/declareWar");
const sleep = require('../utils/sleep')
const fs = require('fs')
const path = require('path')

async function runAIActions(country, sessionData, sessionID, client, selectedCountry) {
const countries = sessionData.countries;
  // Find neighbour with fewer provinces/soldiers
  const target =  await findWeakNeighbour(country, countries);
console.log(target + " is weak")
  // Attack neighbour
  if(target) {



    
    moveToBordersOnWar(country, target, sessionData, sessionID);
    /*moveToBordersOnWar(
      country,// ai
      enemyCountry,  //player
      sessionData, sessionID) */
    await sleep(Math.floor(Math.random() * (20000 - 10000 + 1) + 10000))
      declareWarWithoutAdditionalFunctions(country, target, sessionID);
    moveToBordersOnWar(
      target,  
      country 
    );
    //    startWarAILoop(enemyCountry, selectedCountry, sessionData, selectedCountry, client, sessionID);

      startWarAILoop(country, target,  sessionData, selectedCountry, client, sessionID);
    await sleep(5000)
      startWarAILoop(target, country,  sessionData, selectedCountry, client, sessionID);

  }

}

async function runAIAggression(sessionID, selectedCountry, client) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));  
  const countries = sessionData.countries;
  // Get all AI countries
  const aiCountries = Object.keys(countries).filter(c => c != selectedCountry);

  // Pick two random AI countries to be aggressive
  const aggressor1 = aiCountries[Math.floor(Math.random() * aiCountries.length)];
  const aggressor2 = aiCountries[Math.floor(Math.random() * aiCountries.length)];  
// runAIActions(country, sessionData, sessionID, client, selectedCountry)
  // Run aggression functions for each country after delay
  await runAIActions(aggressor1, sessionData,  sessionID, client, selectedCountry);
  //await sleep(40000); 
  await runAIActions(aggressor2, sessionData,  sessionID, client, selectedCountry);
}


module.exports = runAIAggression