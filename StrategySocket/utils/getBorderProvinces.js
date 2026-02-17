const getAdjoiningPaths = require('./getAdJoiningPaths.js')
async function getBorderProvinces(country, countries) {

  const provinces = countries[country].provinces;

  const borderProvinces = [];

  provinces.forEach( async province => {

    const paths = await getAdjoiningPaths(province);
    paths.forEach(path => {
      if (path) {
        const otherCountry = path.getAttribute('data-country');

        if (otherCountry !== country) {
          borderProvinces.push(province);
        }
      }
    });

  });

  return borderProvinces;

}
module.exports = getBorderProvinces