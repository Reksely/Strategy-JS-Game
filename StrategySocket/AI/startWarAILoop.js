const fs = require('fs');
const path = require('path');
const getBorderProvincesWithCountry = require('../utils/getBorderProvincesWithCountry');
const getAdjoiningPaths = require('../utils/getAdJoiningPaths');
const attackProvince = require("../warSystem/attackProvince");
function startWarAILoop(attacker, defender, sessionData, selectedCountry, client, sessionID) {

  let currentWars = sessionData.currentWars;
  const countries = sessionData.countries;
  let loopCount = 0;

  const loop = setInterval(() => {
    if (loopCount >= 5) {
      clearInterval(loop);
      startWarAILoop(attacker, defender, sessionData, selectedCountry, client, sessionID);
      return;
    }

    if (countries[attacker].provinces.length === 0 || countries[defender].provinces.length === 0) {
      currentWars--;
      clearInterval(loop);
      return;
    }

    const aiCountries = Object.keys(countries);
    aiCountries.forEach((aiCountry) => {
      const enemyCountries = countries[aiCountry].atWar;
      enemyCountries.forEach(async (enemyCountry) => {
        const aiBorderProvinces = getBorderProvincesWithCountry(aiCountry, enemyCountry, countries);

        aiBorderProvinces.forEach((aiProvince) => {
          // Validate AI province belongs to AI
          if (!countries[aiCountry].provinces.includes(aiProvince)) return console.log("it doesn't belong to AI");

          const aiPaths = getAdjoiningPaths(aiProvince);
          aiPaths.forEach((path) => {
            // Check if path borders
            const otherCountry = path.getAttribute("data-country");
            if (otherCountry == enemyCountry) {
              const enemyProvince = path.id;
              const enemySoldiers = countries[enemyCountry].ProvincesSoldiers[enemyProvince];
              const aiSoldiers = countries[aiCountry].ProvincesSoldiers[aiProvince];

              if (aiSoldiers >= enemySoldiers * 1.30 && aiCountry !== selectedCountry) {
                console.log(
                  `${aiCountry} from province ${aiProvince} attacking ${enemyCountry} province ${enemyProvince} with ${aiSoldiers} amount of soldiers`
                );

                attackProvince(
                  aiCountry,
                  aiProvince,
                  enemyCountry,
                  enemyProvince,
                  aiSoldiers,
                  aiProvince,
                  countries,
                  client
                );

                const sessionDataWritePath = `${__dirname}/../sessions/${sessionID}.json`;
                
              console.log(`Resolved path: ${sessionDataWritePath}`);
              fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2)); 
              }
            }
          });
        });
      });
    });

    loopCount++;
    client.send(
      JSON.stringify({
        message: "War changed successfully",
        operation: "warChange",
        sessionInfo: fs.readFileSync(
          path.resolve(__dirname, `../sessions/${sessionID}.json`),
          "utf8"
        ),
      })
    );
  }, 10000);
}

module.exports = startWarAILoop;