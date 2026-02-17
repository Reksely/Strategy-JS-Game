
const getAdjoiningPaths = require('../utils/getAdJoiningPaths')
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path')
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../html/index.html'), 'utf8');

const { window } = new JSDOM(htmlContent);


const parser = new window.DOMParser();

const doc = parser.parseFromString(htmlContent, 'text/html');

const svg = doc.querySelector('svg');


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
  const sourceAdjoiningPaths = getAdjoiningPaths(previousProvince);

  const destinationPath = svg.querySelector(`#${destProvince}`);


  if(!sourceAdjoiningPaths.includes(destinationPath)) {
   console.log("You can only attack bordering provinces");
    return;
 }

  // Get defender strength
  const defenderStrength = countries[destCountry].ProvincesSoldiers[destProvince];

  // Resolve battle
  if (attackStrength > defenderStrength) {
    // Attacker wins
    resolveVictory(sourceCountry, destCountry, destProvince, attackStrength, sourceProvince, defenderStrength, previousProvince, svg, client);
  } else {
    // Defender wins  
    resolveDefeat(sourceCountry, sourceProvince, destCountry, attackStrength, defenderStrength, previousProvince, svg, client);
  }

}

module.exports = attackProvince