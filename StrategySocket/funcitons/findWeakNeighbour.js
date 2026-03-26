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
    if (!countries[neighbour] || countries[neighbour].provinces.length === 0) return;
    if (!weakest) {
      weakest = neighbour;
    } else if (isWeaker(neighbour, weakest, countries)) {
      weakest = neighbour;
    }
  });
  return weakest;
}

function findWeakNeighbour(country, countries) {
  // getBorderProvinces is now synchronous
  const borderProvinces = getBorderProvinces(country, countries);

  if (!borderProvinces || borderProvinces.length === 0) return null;

  let neighbours = getNeighbours(borderProvinces);

  // Filter out self, already at war, null, and eliminated countries
  neighbours = neighbours
    .filter(n => n !== country)
    .filter(n => !countries[country].atWar.includes(n))
    .filter(n => n && countries[n] && countries[n].provinces.length > 0);

  // Find weakest
  let weakest = findWeakest(neighbours, countries);
  return weakest;
}

module.exports = findWeakNeighbour
