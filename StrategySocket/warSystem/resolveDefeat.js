function resolveDefeat(
  sourceCountry, sourceProvince, destCountry, attackStrength, defenderStrength, previousProvince, svg, client, countries
) {
  // Calculate battle losses
  const attackerSoldiers = countries[sourceCountry].ProvincesSoldiers[previousProvince] || 0;
  const defenderSoldiers = countries[destCountry].ProvincesSoldiers[sourceProvince] || 0;

  if (attackerSoldiers >= defenderSoldiers) {
    countries[sourceCountry].ProvincesSoldiers[previousProvince] = attackerSoldiers - defenderSoldiers;
    countries[destCountry].ProvincesSoldiers[sourceProvince] = 0;
  } else {
    countries[destCountry].ProvincesSoldiers[sourceProvince] = defenderSoldiers - attackerSoldiers;
    countries[sourceCountry].ProvincesSoldiers[previousProvince] = 0;
  }
}

module.exports = resolveDefeat;
