const runAIAggression = require("./runAIAggression")
const path = require('path')
const fs = require('fs')

function triggerAIAggression(sessionID, selectedCountry, client) {
  try {
    const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
    const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
    const currentWars = sessionData.currentWars || 0;
    const maxWars = sessionData.maxWars || 5;

    if (currentWars < maxWars) {
      const aggressionChance = 0.4;
      if (Math.random() < aggressionChance) {
        runAIAggression(sessionID, selectedCountry, client);
      }
    } else {
      console.log("max wars limit reached");
    }
  } catch (e) {
    console.log("Error in AI aggression:", e.message);
  }
}


function setupOwnAIAttacks(sessionID, selectedCountry, client) {
  return setInterval(() => {
    triggerAIAggression(sessionID, selectedCountry, client);
  }, 20000);
}

module.exports = setupOwnAIAttacks
