const modifySoldiersForProvince = require('../utils/modifySoldiersForProvince.js')
const moveSoldiers = require('../utils/moveSoldiers.js')

function resolveVictory(
  sourceCountry,
  destCountry,
  province,
  remainingStrength, sourceProvince, defenderStrength, previousProvince, svg
) {

  // Remove province from defeated country's provinces
  const provinceIndex = countries[destCountry].provinces.indexOf(province);
  countries[destCountry].provinces.splice(provinceIndex, 1);

  // Add province to winning country's provinces
  countries[sourceCountry].provinces.push(province);

  // Remove soldiers from defeated province
  delete countries[destCountry].ProvincesSoldiers[province];


  // Add soldiers to capturing country
  modifySoldiersForProvince(
    sourceCountry,
    province,
    remainingStrength - defenderStrength,
    // text element id
  );

  moveSoldiers(sourceCountry, previousProvince, province, remainingStrength, destCountry, true, svg);

  

  
}


module.exports =  resolveVictory