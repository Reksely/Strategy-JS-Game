const getAdjoiningPaths = require('./getAdJoiningPaths.js')

// Server-side move soldiers: direct transfer between provinces
function moveSoldiers(sourceCountry, sourceProvince, destinationProvince, amount, destCountry, IsAttacking, svg, countries) {
  if (!sourceCountry || !sourceProvince || !destinationProvince || amount <= 0) return;
  if (!countries[sourceCountry]) return;

  // Deduct from source
  if (countries[sourceCountry].ProvincesSoldiers[sourceProvince] !== undefined) {
    countries[sourceCountry].ProvincesSoldiers[sourceProvince] = Math.max(
      0,
      countries[sourceCountry].ProvincesSoldiers[sourceProvince] - amount
    );
  }

  // Add to destination (if not attacking - attacks handle this separately)
  if (!IsAttacking) {
    if (countries[sourceCountry].ProvincesSoldiers[destinationProvince] !== undefined) {
      countries[sourceCountry].ProvincesSoldiers[destinationProvince] += amount;
    } else {
      countries[sourceCountry].ProvincesSoldiers[destinationProvince] = amount;
    }
  }
}

module.exports = moveSoldiers
