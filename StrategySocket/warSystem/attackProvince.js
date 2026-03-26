const getAdjoiningPaths = require('../utils/getAdJoiningPaths')
const resolveVictory = require('./resolveVictory')
const resolveDefeat = require('./resolveDefeat')

function attackProvince(
  sourceCountry,
  sourceProvince,
  destCountry,
  destProvince,
  attackStrength, previousProvince, countries, client
) {

  // Validate countries are at war
  if (!countries[sourceCountry].atWar.includes(destCountry)) {
    return;
  }

  // Check adjacency by comparing IDs (not DOM node references)
  const adjoiningPaths = getAdjoiningPaths(previousProvince);
  const adjoiningIds = adjoiningPaths.map(p => p.id || p.getAttribute('id'));

  if (!adjoiningIds.includes(destProvince)) {
    console.log("You can only attack bordering provinces");
    return;
  }

  // Get defender strength
  const defenderStrength = countries[destCountry].ProvincesSoldiers[destProvince] || 0;

  // Resolve battle
  if (attackStrength > defenderStrength) {
    resolveVictory(sourceCountry, destCountry, destProvince, attackStrength, sourceProvince, defenderStrength, previousProvince, null, client, countries);
  } else {
    resolveDefeat(sourceCountry, sourceProvince, destCountry, attackStrength, defenderStrength, previousProvince, null, client, countries);
  }
}

module.exports = attackProvince
