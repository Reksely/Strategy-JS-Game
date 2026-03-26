const fs = require('fs');
const path = require('path');

const INCREASE_PER_PROVINCE = 45; // Fixed increase per province per tick


async function incrementAllTreasuries(sessionID) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
  const countries = sessionData.countries;
  // Loop through all countries
  if(!countries) return console.log("There is no countries!");
  Object.keys(countries).forEach(country => {

    if(countries[country].provinces.length === 0) return;

    // Get number of provinces
    let numProvinces = countries[country].provinces.length;

    // Calculate increase amount (fixed rate per province)
    let increaseAmount = numProvinces * INCREASE_PER_PROVINCE;
    countries[country].treasury += increaseAmount;

  });
  // Save the updated countries data back to the session JSON file
  const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);

  
  fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2)); // Notice sessionData is being written back, not countries



}

module.exports = incrementAllTreasuries