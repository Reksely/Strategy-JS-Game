const fs = require('fs');
const path = require('path');
const getBorderProvincesWithCountry = require('../utils/getBorderProvincesWithCountry');
const getAdjoiningPaths = require('../utils/getAdJoiningPaths');
const attackProvince = require("../warSystem/attackProvince");

function startWarAILoop(attacker, defender, sessionData, selectedCountry, client, sessionID) {
  // Track war intervals on client for cleanup on disconnect
  if (!client._warIntervals) client._warIntervals = [];

  const TICK_MS = 6000; // Attack every 6 seconds

  const loop = setInterval(() => {
    // Re-read fresh session data each tick
    let currentSessionData;
    try {
      const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
      currentSessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
    } catch (e) {
      clearInterval(loop);
      return;
    }

    const countries = currentSessionData.countries;

    // Stop if either side is eliminated
    if (!countries[attacker] || !countries[defender] ||
        countries[attacker].provinces.length === 0 ||
        countries[defender].provinces.length === 0) {
      if (currentSessionData.currentWars > 0) currentSessionData.currentWars--;
      const writePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
      fs.writeFileSync(writePath, JSON.stringify(currentSessionData, null, 2));
      clearInterval(loop);
      return;
    }

    // Stop if no longer at war
    if (!countries[attacker].atWar.includes(defender)) {
      clearInterval(loop);
      return;
    }

    // Don't let the player's own country be auto-piloted
    if (attacker === selectedCountry) {
      clearInterval(loop);
      return;
    }

    const aiBorderProvinces = getBorderProvincesWithCountry(attacker, defender, countries);
    let attacked = false;

    for (const aiProvince of aiBorderProvinces) {
      if (attacked) break;
      if (!countries[attacker].provinces.includes(aiProvince)) continue;

      const aiPaths = getAdjoiningPaths(aiProvince);
      for (const adjPath of aiPaths) {
        if (attacked) break;
        const otherCountry = adjPath.getAttribute("data-country");
        if (otherCountry === defender) {
          const enemyProvince = adjPath.id;
          const enemySoldiers = countries[defender].ProvincesSoldiers[enemyProvince] || 0;
          const aiSoldiers = countries[attacker].ProvincesSoldiers[aiProvince] || 0;

          // Attack if AI has more soldiers (10% advantage is enough)
          if (aiSoldiers > enemySoldiers * 1.10 && aiSoldiers > 0) {
            console.log(`[WAR] ${attacker} (${aiSoldiers}) -> ${defender} ${enemyProvince} (${enemySoldiers})`);

            attackProvince(
              attacker, aiProvince, defender, enemyProvince,
              aiSoldiers, aiProvince, countries, client
            );

            // Save after attack
            const writePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
            fs.writeFileSync(writePath, JSON.stringify(currentSessionData, null, 2));
            attacked = true;
          }
        }
      }
    }

    // Send update to client
    try {
      client.send(JSON.stringify({
        operation: "warChange",
        sessionInfo: fs.readFileSync(
          path.resolve(__dirname, `../sessions/${sessionID}.json`), "utf8"
        ),
      }));
    } catch (e) {
      clearInterval(loop);
    }
  }, TICK_MS);

  client._warIntervals.push(loop);
}

module.exports = startWarAILoop;
