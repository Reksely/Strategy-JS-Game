const getAdjoiningPaths = require('./getAdJoiningPaths.js')


// Move through path with delays
async function moveThroughPath(sourceCountry, path, amount, IsAttacking) {
  movingPaths = path;

  let current = path[1];

  for (let i = 1; i < path.length; i++) {
    console.log("Path is " + path)
    let next = path[i];
    // Move directly between provinces
    moveDirectly(sourceCountry, current, next, amount, IsAttacking);
    // Add delay 
    if (i != 1)
      await sleep(2000);

    // Update current
    current = next;
  }
  console.log("finished moving?")
  movingPaths = [];

}

// Construct path by tracing back parents
function constructPath(visited, current) {

  let path = [];

  while (current) {
    path.push(current);
    current = visited[current];
  }

  return path.reverse();

}

function findPath(start, end, sourceCountry) {
  const key = start + end;

  if(findPathCache[key]) {
    return findPathCache[key];
  }
  let queue = [start];
  let path = [];
  let visited = {};
  let provinces = countries[sourceCountry].provinces;

  visited[start] = true;

  while (queue.length > 0) {

    let current = queue.shift();

    if (current === end) {
      return constructPath(visited, current);
    }

    getAdjoiningProvinces(current).forEach(neighbor => {
      if (!visited[neighbor] && provinces.includes(neighbor)) {
        visited[neighbor] = current;
        queue.push(neighbor);
      }
    });
  }

  findPathCache[key] = path;
  return path;

}



function moveSoldiers(sourceCountry, sourceProvince, destinationProvince, amount, destCountry, IsAttacking, svg) {
  if (sourceCountry && sourceProvince && destinationProvince && amount > 0) {
    // Check if the source province belongs to the source country

    if (countries[sourceCountry].provinces.includes(sourceProvince) || countries[sourceCountry].atWar.includes(destCountry)) {
      const destinationPath = svg.querySelector(`#${destinationProvince}`);
      const sourceAdjoiningPaths = getAdjoiningPaths(sourceProvince);
      //    console.log(sourceProvince)
      //console.log(sourceAdjoiningPaths)
      //console.log(destinationPath)

      if (sourceAdjoiningPaths.includes(destinationPath)) {
        console.log("bordering")


        if (countries[sourceCountry].ProvincesSoldiers[sourceProvince] > 0)
          countries[sourceCountry].ProvincesSoldiers[sourceProvince] -= amount;
        // Add the soldiers to the destination province
        if (!IsAttacking) // attack does that already so this makes a mess
          countries[sourceCountry].ProvincesSoldiers[destinationProvince] += amount;


        console.log("source province is " + countries[sourceCountry].ProvincesSoldiers[sourceProvince] + sourceProvince)
        console.log("destination province is now " + countries[sourceCountry].ProvincesSoldiers[destinationProvince] + destinationProvince)



     
        console.log(destinationProvince)
        previousProvince = destinationProvince;
      }
      else {
        console.log("not bordering")


        const path = findPath(sourceProvince, destinationProvince, sourceCountry);
        if (path.length > 0) {

          moveThroughPath(sourceCountry, path, amount, IsAttacking);

        } else {
            console.log("No path found between provinces");
        }
      }

    } else {
        console.log("Not enough soldiers in the source province.");
    }
  } else {
    console.log("The source province doesn't belong to the selected country.");
  }
}


module.exports = moveSoldiers