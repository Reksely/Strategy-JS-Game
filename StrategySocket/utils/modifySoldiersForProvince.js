 function modifySoldiersForProvince(country, province, amount, countries) {

  
  if (country && countries[country] && countries[country].ProvincesSoldiers[province] !== undefined) {
    countries[country].ProvincesSoldiers[province] += amount;
  }


}



module.exports = modifySoldiersForProvince;