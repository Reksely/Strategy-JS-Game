
function isWeaker(neighbor1, neighbor2, countries) {
  const country1 = countries[neighbor1];
  const country2 = countries[neighbor2];

  const provinces1 = country1.provinces.length;
  const provinces2 = country2.provinces.length;

  const soldiers1 = calculateTotalSoldiers(country1);
  const soldiers2 = calculateTotalSoldiers(country2);

 // if (provinces1 === provinces2) {
    return soldiers1 < soldiers2;
 // }

 // return provinces1 < provinces2;
}

function calculateTotalSoldiers(country) {
  const provinces = country.provinces;
  let totalSoldiers = 0;

  for (const province of provinces) {
    const provinceSoldiers = country.ProvincesSoldiers[province] || 0;
    totalSoldiers += provinceSoldiers;
  }

  return totalSoldiers;
}

module.exports = isWeaker;