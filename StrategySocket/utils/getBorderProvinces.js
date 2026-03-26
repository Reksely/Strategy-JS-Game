const getAdjoiningPaths = require('./getAdJoiningPaths.js')

function getBorderProvinces(country, countries) {
  const provinces = countries[country].provinces;
  const borderProvinces = [];

  for (const province of provinces) {
    const paths = getAdjoiningPaths(province);
    for (const path of paths) {
      if (path) {
        const otherCountry = path.getAttribute('data-country');
        if (otherCountry !== country) {
          borderProvinces.push(province);
          break; // Only need to add province once
        }
      }
    }
  }

  return borderProvinces;
}
module.exports = getBorderProvinces
