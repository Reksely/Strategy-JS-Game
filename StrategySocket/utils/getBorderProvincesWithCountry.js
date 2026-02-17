const getAdjoiningPaths = require('./getAdJoiningPaths.js');

function getBorderProvincesWithCountry(country, enemyCountry, countries) {
  const provinces = countries[country].provinces;

  const borderProvinces = [];

  provinces.forEach(province => {
    const paths = getAdjoiningPaths(province);

    paths.forEach(path => {
      const otherCountry = path.getAttribute('data-country');
      //console.log(otherCountry + " " + enemyCountry)
      if (otherCountry === enemyCountry) {
        //console.log(province + " is bordering atwar country")
        borderProvinces.push(province);
      }
      //else {
      //  console.log(province + " which is owned by " + country + " is not bordering " + enemyCountry)
      //}
    });
  });
  return borderProvinces;
}


module.exports = getBorderProvincesWithCountry;
