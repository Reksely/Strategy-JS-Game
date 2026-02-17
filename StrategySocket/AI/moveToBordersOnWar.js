const modifySoldiers = require("../utils/modifySoldiers.js")
const getBorderProvincesWithCountry = require('../utils/getBorderProvincesWithCountry.js')

const path = require('path')
const fs = require('fs')

async function moveToBordersOnWar(
  country,// ai
  enemyCountry,  //player
  sessionData, sessionID) {
const countries = sessionData.countries
  //console.log(enemyCountry)
  //console.log(countries[enemyCountry])
  countries[country].atWar.push(enemyCountry);
  countries[enemyCountry].atWar.push(country);

  // Get all border provinces
  const borderProvinces =  getBorderProvincesWithCountry(country, enemyCountry, countries);
//console.log("border provinces: "+ borderProvinces)
  // Get total soldiers
  let totalSoldiers = 0;
  Object.values(countries[country].ProvincesSoldiers).forEach(count => {
    totalSoldiers += count;
  });
  //console.log(totalSoldiers)
  // Distribute soldiers evenly
  const soldiersPerProvince = Math.floor(totalSoldiers / borderProvinces.length);
const changedProvinces = []
  borderProvinces.forEach(province => {
    if (changedProvinces.includes(province))  return;

    // Move soldiers to border province
    modifySoldiers(country, province, soldiersPerProvince, sessionID);
    console.log("moved for " + province)
      changedProvinces.push(province);
    
  })
  console.log("done moving")
  const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);


  fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2)); // Notice sessionData is being written back, not countries
  return changedProvinces
}
module.exports = moveToBordersOnWar;