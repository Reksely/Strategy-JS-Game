function modifySoldiersForProvince(country, province, amount, countries) {
  if (country && countries[country]) {
    if (countries[country].ProvincesSoldiers[province] !== undefined) {
      countries[country].ProvincesSoldiers[province] += amount;
    } else {
      // Province doesn't exist yet (e.g. newly captured) - initialize it
      countries[country].ProvincesSoldiers[province] = amount;
    }
  }
}

module.exports = modifySoldiersForProvince;
