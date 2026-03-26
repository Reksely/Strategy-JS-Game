const modifySoldiersForProvince = require('../utils/modifySoldiersForProvince.js')
const getAdjoiningPaths = require('../utils/getAdJoiningPaths.js')

function resolveVictory(
  sourceCountry,
  destCountry,
  province,
  remainingStrength, sourceProvince, defenderStrength, previousProvince, svg, client, countries
) {

  // Remove province from defeated country's provinces
  const provinceIndex = countries[destCountry].provinces.indexOf(province);
  if (provinceIndex !== -1) {
    countries[destCountry].provinces.splice(provinceIndex, 1);
  }

  // Add province to winning country's provinces
  countries[sourceCountry].provinces.push(province);

  // Remove soldiers from defeated province
  delete countries[destCountry].ProvincesSoldiers[province];

  // Add soldiers to capturing country
  const remainingSoldiers = remainingStrength - defenderStrength;
  modifySoldiersForProvince(
    sourceCountry,
    province,
    remainingSoldiers,
    countries
  );

  // Deduct soldiers from source province (they moved to captured province)
  if (countries[sourceCountry].ProvincesSoldiers[previousProvince] !== undefined) {
    countries[sourceCountry].ProvincesSoldiers[previousProvince] = Math.max(
      0,
      countries[sourceCountry].ProvincesSoldiers[previousProvince] - remainingStrength
    );
  }
}


module.exports = resolveVictory
