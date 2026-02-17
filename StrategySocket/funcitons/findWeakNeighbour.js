const isWeaker = require("../utils/isWeaker")
const getBorderProvinces = require('../utils/getBorderProvinces.js')
const getAdjoiningPaths = require('../utils/getAdJoiningPaths')

function getNeighbours(borderProvinces) {
  return borderProvinces
    .map(p => getAdjoiningPaths(p))
    .flatMap(paths => paths.map(p => p.getAttribute('data-country')));  
}

function findWeakest(neighbours, countries) {
let weakest;
  neighbours.forEach(neighbour => {

    if(!weakest) {
      weakest = neighbour;
    } else if(isWeaker(neighbour, weakest, countries)) {
      weakest = neighbour;
    }

  });

  return weakest;

}

async function findWeakNeighbour(country, countries) {

  // Make sure to await the result of getBorderProvinces
  const borderProvinces = await getBorderProvinces(country, countries);  

  // Now borderProvinces should be an array, and you can safely use .map on it
  let neighbours = getNeighbours(borderProvinces);  

  // Continue as before
  neighbours = neighbours
    .filter(n => n !== country)
    .filter(n => !countries[country].atWar.includes(n))
    .filter(n => n);

  // Find weakest
  let weakest = findWeakest(neighbours, countries);
  //console.log("for " + country + " neighbours are " + neighbours)
  return weakest;

}

module.exports = findWeakNeighbour