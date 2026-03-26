const incrementAllTreasuries = require("./incrementAllTreasuries.js");
const recruitAIArmies = require("./recruitAIArmies.js")
const fs = require('fs');
const path = require('path');
const setupOwnAIAttacks = require("../AI/setupOwnAIAttacks")

function setupDefaultUserValues(selectedCountry, sessionID) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));

  const countries = sessionData.countries;

  sessionData.maxWars = 5;
  sessionData.currentWars = 0;
  countries[selectedCountry].recruitCost = 0.25;
  const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);

  fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2));
}


async function setupSession(sessionID, client, selectedCountry) {
  // adding additional values
  setupDefaultUserValues(selectedCountry, sessionID);
  console.log("Started session: " + sessionID);

  const aiInterval = setupOwnAIAttacks(sessionID, selectedCountry, client);

  const gameInterval = setInterval(async () => {
    try {
      await incrementAllTreasuries(sessionID);
      await recruitAIArmies(sessionID, selectedCountry);

      client.send(JSON.stringify({
        operation: "constantGameChange",
        sessionInfo: fs.readFileSync(
          path.resolve(__dirname, `../sessions/${sessionID}.json`), "utf8"
        )
      }));
    } catch (e) {
      console.log("Game loop error:", e.message);
    }
  }, 5000);

  // Store interval handles on the client for cleanup
  client._gameInterval = gameInterval;
  client._aiInterval = aiInterval;
}

module.exports = setupSession
