const fs = require('fs');
const path = require('path');

let INCREASE_PER_PROVINCE = 45; // Initial increase amount
const INCREMENT_AMOUNT = 4; // Amount to increase per province each time


async function incrementAllTreasuries(sessionID) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));  
  const countries = sessionData.countries;
  // Loop through all countries
if(!countries) return console.log("There is no countries!")
  Object.keys(countries).forEach(country => {

    if(countries[country].provinces.length === 0) return;

    // Get number of provinces   
    let numProvinces = countries[country].provinces.length;

    // Calculate increase amount and increment the variable
    let increaseAmount = numProvinces * INCREASE_PER_PROVINCE;
    INCREASE_PER_PROVINCE += INCREMENT_AMOUNT;
    countries[country].treasury += increaseAmount;

  });
  // Save the updated countries data back to the session JSON file
  const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);

  
  fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2)); // Notice sessionData is being written back, not countries



}

module.exports = incrementAllTreasuries