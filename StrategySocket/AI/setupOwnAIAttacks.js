const runAIAggression = require("./runAIAggression")
const path = require('path')
const fs = require('fs')

function triggerAIAggression(sessionID, selectedCountry, client) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8")); 
  const currentWars= sessionData.currentWars
  const maxWars = sessionData.maxWars
  if(currentWars != maxWars || currentWars < maxWars){
  const aggressionChance = 1;

  if(Math.random() < aggressionChance) {
    // Call AI aggression functions
    runAIAggression(sessionID, selectedCountry, client); 
    // client
  }
  }
  else {
    console.log("max wars limit reached")
  }
}


async function setupOwnAIAttacks(sessionID, selectedCountry, client) {

  setInterval(() => {
    triggerAIAggression(sessionID, selectedCountry, client);
  }, 20000);
  
}

module.exports = setupOwnAIAttacks