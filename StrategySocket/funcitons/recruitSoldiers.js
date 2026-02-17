const modifySoldiersForProvince = require('../utils/modifySoldiersForProvince.js')
const fs = require('fs');
const path = require('path');

function getRecruitmentCost(recruitCost) {

  // Increment cost each time
  recruitCost += 0.06;

  return recruitCost;

}


async function recruitSoldiers(value, selectedCountry, selectedProvince, sessionID) {

  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));  
  
  const countries = sessionData.countries;

  

  // Get recruits amount
  let recruits = parseInt(value);

  // Get cost per recruit
  let cost = getRecruitmentCost(countries[selectedCountry].recruitCost);
  // Validate funds
  if (countries[selectedCountry].treasury >= cost * recruits) {

    // Deduct cost
    countries[selectedCountry].treasury -= cost * recruits;
    // Add recruits
    const updatedSoldiersCount = modifySoldiersForProvince(selectedCountry, selectedProvince, recruits, countries)

    const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);


    fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2)); // Notice sessionData is being written back, not countries

    return {
      updatedSoldiersCount: countries[selectedCountry].ProvincesSoldiers[selectedProvince],
      updatedTreasury: countries[selectedCountry].treasury
    };
  
  }
  else {
    return "Not enough funds";
  }

}

module.exports = recruitSoldiers