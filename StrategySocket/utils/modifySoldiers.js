const fs = require('fs');
const path = require('path');

async function modifySoldiers(country, province, amount, sessionID) {

  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);

  
    const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));  
    const countries = sessionData.countries;

  if (country && countries[country] && countries[country].ProvincesSoldiers[province] !== undefined) {

    countries[country].ProvincesSoldiers[province] += amount;

  }


  const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);


  fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2)); // Notice sessionData is being written back, not countries


}
module.exports = modifySoldiers