

  // Connect to the WebSocket
  const socket = new WebSocket("ws://localhost:3000");

let countries = JSON.parse(localStorage.getItem("countries"));


    // Event listener for socket open
    socket.onopen =async function(event) {
        console.log("Connected");
     await checkConnect()
    };



async function startSession() {
  return new Promise((resolve, reject) => {

    const message = {
        operation: "startSession",
      selectedCountry: selectedCountry
    };

      socket.send(JSON.stringify(message));
    

  })
}

// Function to get value from session based on instructions
function getValueFromSession( valuePath) {
        const message = {
            operation: "getValueFromSession",
            valuePath: valuePath
        };

        socket.send(JSON.stringify(message));

 
}
// Function to set value in session based on instructions
function setValueInSession(id, valuePath, changeTo) {
        const message = {
            operation: "setValueInSession",
            valuePath: valuePath,
            changeTo: changeTo
        };

          socket.send(JSON.stringify(message));

}

  // Define the async function to check the connection
  async function checkConnect() {
      const message = {
        operation: "checkConnect",
      };

      // Send the message
      socket.send(JSON.stringify(message));

 

    
  }



let selectedCountry = null;
let selectedProvince = null;
let previousProvince = null;
let movingPaths = [];


// Recruitment cost starts at 1
let recruitCost = 0.25;


socket.onmessage = function(event) {
    // Parse the incoming message
    var message = JSON.parse(event.data);

      
switch(message.operation) {
  case "startSession":
  case "sessionInit":

            localStorage.setItem("countries", JSON.stringify(JSON.parse(message.sessionInfo).countries));




    break;

  case "declareWar":
    countries = JSON.parse(message.sessionInfo).countries;

    const changedProvinces = message.changedProvinces;
    const provinceCountry = message.provinceCountry;

    for (const province of changedProvinces) {
    const textElementId = `soldiers-text-${province}`;
      
    if (textElementId) {
      const textElement = document.getElementById(textElementId);
      if (textElement) {
        textElement.textContent = countries[provinceCountry].ProvincesSoldiers[province];
      }
    }
    }
    break;
  case "recruitSoldiersByUser": 


    document.getElementById("money-amount").innerHTML = formatNumberWithSpaces( Math.floor(message.updatedTreasury));


    
     const textElementId = `soldiers-text-${selectedProvince}`;
      if (textElementId) {
        const textElement = document.getElementById(textElementId);
        if (textElement) {

          if (message.updatedSoldiersCount === 0) {
            // Hide text
            textElement.style.display = 'none';
          } else {
            // Show text  
            textElement.style.display = 'block';
            textElement.textContent = message.updatedSoldiersCount;
          }


        }
      }
    break;
  case "checkConnect":
console.log("connection is valid")
    break;
  case "setValueInSession":
console.log("set value")
    break;

  case "getValueFromSession":
const valueReceived = message.value
    break;
  case "warChange":
  case "constantGameChange":
    const countriesReceived = JSON.parse(message.sessionInfo).countries;
    countries = countriesReceived;

    Object.keys(countriesReceived).forEach(country => {

      Object.keys(countriesReceived[country].ProvincesSoldiers).forEach(province => {
      // UI Update
      const textElementId = `soldiers-text-${province}`;
      if (textElementId) {
        const textElement = document.getElementById(textElementId);
        if (textElement) {
            textElement.textContent = countriesReceived[country].ProvincesSoldiers[province];
        }
      }
        // Update province colors based on ownership
        const provincePath = document.querySelector(`svg #${province}`);
        if (provincePath) {
          provincePath.setAttribute('data-country', country);
          if (countriesReceived[country].color) {
            provincePath.setAttribute('fill', countriesReceived[country].color);
          }
        }
      });

    })

    if (selectedCountry && countriesReceived[selectedCountry]) {
      let treasury = countriesReceived[selectedCountry].treasury;
      // Remove decimals
      treasury = Math.floor(treasury);
      document.getElementById("money-amount").innerHTML = formatNumberWithSpaces(treasury);
    }

    break;
}

};


function getRecruitmentCost() {

  // Increment cost each time
  recruitCost += 0.06;

  return recruitCost;

}



function updateSliderValueText() {

  // Get current slider value
  let value = parseInt(slider.value);

  // Update text element
  sliderValueText.innerText = value;

}

function updateSoldierText() {
  requestAnimationFrame(() => {

  // Get updated soldier count
  let count = countries[selectedCountry].ProvincesSoldiers[selectedProvince];

  // Get corresponding text element
  let textElement = document.getElementById(`soldiers-text-${selectedProvince}`);

  if (textElement) {

    // Update text

    // if its zero then dont show

    textElement.innerText = count;

  } else {
    console.error("Soldier text element not found");
  }
     });

}

const INCREASE_PER_PROVINCE = 45; // Fixed increase per province per tick

function incrementAllTreasuries() {
  updateTreasuryDisplay();

  // Loop through all countries
  Object.keys(countries).forEach(country => {

    if(countries[country].provinces.length === 0) return;

    // Get number of provinces
    let numProvinces = countries[country].provinces.length;

    // Calculate increase amount (fixed rate)
    let increaseAmount = numProvinces * INCREASE_PER_PROVINCE;

    // Increment treasury
    incrementTreasury(country, increaseAmount);
  });

  updateTreasuryDisplay();
}

function incrementTreasury(country, amount) {
  countries[country].treasury += amount;
}
/*
setInterval(() => {

  //incrementAllTreasuries();
  recruitAIArmies();

}, 5000);
*/

/*
let treasuryIncrease = 140;

setInterval(function() {
  incrementTreasury(treasuryIncrease);
  treasuryIncrease += 40;
}, 5000);
function incrementTreasury(amount) {
  countries[selectedCountry].treasury += amount;

  updateTreasuryDisplay();
}

*/

function modifyTreasury(country, amount) {

  let treasury = countries[country].treasury;

  // Remove decimals 
  treasury += Math.floor(amount);

  countries[country].treasury = treasury;

}

function formatNumberWithSpaces(number) {
  // Convert the number to a string and split it into groups of three digits
  const parts = number.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // Join the integer and fractional parts back together
  return parts.join('.');
}

function updateTreasuryDisplay() {
  if (selectedCountry == null) return;
  let treasury = countries[selectedCountry].treasury;
  // Remove decimals
  treasury = Math.floor(treasury);

  document.getElementById("money-amount").innerHTML = formatNumberWithSpaces(treasury);

}
// Clicks

// Add a "Recruit" button element
const recruitButton = document.createElement('button');
recruitButton.textContent = 'Recruit';
recruitButton.style.position = 'absolute';
recruitButton.style.left = '10px';
recruitButton.style.margin = '5px';
recruitButton.style.display = 'none';
recruitButton.classList.add("btn", "btn-secondary");
recruitButton.setAttribute("id", "recruitBtn");
// Append the "Recruit" button to the document body
// move to button
const moveToButton = document.createElement('button');
moveToButton.textContent = 'Move To';
moveToButton.style.position = 'absolute';
moveToButton.style.left = '90px';
moveToButton.style.margin = '5px';
moveToButton.setAttribute("id", "moveToBtn");
moveToButton.classList.add("btn", "btn-secondary");
moveToButton.style.display = 'none'

// Create a black box div
const controlsBox = document.createElement('div');
controlsBox.style.position = 'absolute';
controlsBox.style.bottom = '0';
controlsBox.style.left = '0';
controlsBox.style.width = '100%';
controlsBox.style.height = '50px';
controlsBox.style.backgroundColor = 'black';

// Add buttons to box
controlsBox.appendChild(recruitButton);
controlsBox.appendChild(moveToButton);

// Append box to body
document.body.appendChild(controlsBox);


// Initialize the Bootstrap tooltip

// Create a soldier amount slider

const sliderDiv = document.createElement("div");
sliderDiv.classList.add("range-slider"); // Add a class to the div


const slider = document.createElement('input');
slider.type = 'range';
slider.style.left = '50%'; // Center the slider
slider.style.position = 'absolute';
slider.style.transform = 'translateX(-50%)'; // Center the slider horizontally
//slider.style.width = '200px'; // Adjust the width as needed
//slider.style.bottom = '10px'; // Adjust as needed

slider.style.display = 'none'; // Initially, hide the slider
sliderDiv.appendChild(slider);
 document.body.appendChild(sliderDiv);
// Create a text element to display the selected value
const sliderValueText = document.createElement('div');
sliderValueText.textContent = '0'; // Initial value
sliderValueText.style.position = 'absolute';
sliderValueText.style.bottom = '10px'; // Adjust as needed
sliderValueText.style.left = '50%'; // Center the text
sliderValueText.style.display = 'none'; // Initially, hide the slider
sliderValueText.style.userSelect = 'none'; // Prevent text selection
sliderValueText.style.pointerEvents = 'none'; // Allow clicks to pass through
sliderValueText.style.transform = 'translateX(-50%)'; // Center the text horizontally
document.body.appendChild(sliderValueText);


// move logic
let moveToMode = false; // Flag to indicate if "Move To" mode is active
moveToButton.addEventListener('click', () => {
  moveToMode = !moveToMode; // Toggle the mode
  if (moveToMode) {
    slider.style.display = 'block';
    sliderValueText.style.display = 'block';
    // Set the slider value to the maximum available in the source province
    const maxSoldiers = countries[selectedCountry].ProvincesSoldiers[selectedProvince];
    //slider.max = maxSoldiers;
    slider.max = countries[selectedCountry].ProvincesSoldiers[selectedProvince]
    slider.value = countries[selectedCountry].ProvincesSoldiers[selectedProvince]
    sliderValueText.textContent = maxSoldiers; // Update the displayed value
  } else {
    slider.style.display = 'none';
    sliderValueText.style.display = 'none';
  }

});


// Add a change event listener to the slider
slider.addEventListener('change', () => {
  const sliderValue = parseInt(slider.value);
  sliderValueText.textContent = sliderValue; // Update the displayed value
  slider.value = sliderValue;

});



const paths = document.querySelectorAll("path");
// Add event listeners to each path element
paths.forEach(path => {

  path.addEventListener('click', async () => {

    
    selectedProvince = path.getAttribute('id');

    if(movingPaths.includes(selectedProvince)) {
      return;
    }
    
    // Remove the 'highlighted' class from all paths
    paths.forEach(path => {
      path.classList.remove('highlight');
    });

    // Add the 'highlighted' class to the clicked path
    path.classList.add('highlight');

    if (selectedCountry) {

      // Get the country name and code from the clicked path
      const countryName = path.getAttribute('data-country');
      const countryCode = countries[countryName].code;

      // Create the flag image element
      const flagImg = document.createElement('img');
      flagImg.src = `https://flagpedia.net/data/flags/h60/${countryCode.toLowerCase()}.png`;

      // Create the country name element
      const countryNameElement = document.createElement('div');
      countryNameElement.textContent = countryName;

      // Clear the previous flag and country name elements
      const infoContainer = document.getElementById('info-container');
      infoContainer.innerHTML = '';

      const declareWarBtn = document.createElement('button');
      declareWarBtn.textContent = 'Declare War';
      const peaceNegBtn = document.createElement('button');
      peaceNegBtn.textContent = 'Peace Negotiation';
      // Append the flag and country name elements to the info container
      infoContainer.appendChild(flagImg);
      infoContainer.appendChild(countryNameElement);


      if (countryName != selectedCountry && !countries[selectedCountry].atWar.includes(countryName))
        infoContainer.appendChild(declareWarBtn);
      if (countries[selectedCountry].atWar.includes(countryName)) {
        infoContainer.appendChild(peaceNegBtn);
      }

      peaceNegBtn.addEventListener('click', () => {
        //alert("Soon!")
      })
      declareWarBtn.addEventListener('click', () => {


        if (confirm(`Are you sure you want to declare war on ${countryName}?`)) {
       /*   countries[selectedCountry].atWar.push(countryName);
          countries[countryName].atWar.push(selectedCountry);

          moveToBordersOnWar(
            countryName,  // ai
            selectedCountry // player
          );

          startAILoop(countryName, selectedCountry);
*/

          socket.send(JSON.stringify({
            operation: "declareWar",
              attacker: selectedCountry,
              defender: countryName
          }))

          infoContainer.removeChild(declareWarBtn);
          infoContainer.appendChild(peaceNegBtn);
        }
      })



      // Show or hide the "Recruit" button based on the condition

      console.log(path.getAttribute('data-country') + selectedCountry)
      if (path.getAttribute('data-country') == selectedCountry) {
        moveToButton.style.display = 'block'

        recruitButton.style.display = 'block';
      } else {
        moveToButton.style.display = 'none'

        recruitButton.style.display = 'none';
      }


      if (moveToMode && selectedCountry) {
        const destinationProvince = path.getAttribute('id');
        const destinationCountry = path.getAttribute('data-country');
        const sliderValue = parseInt(slider.value);

        if (destinationCountry === selectedCountry) {
          if (previousProvince !== null) {
            moveSoldiers(selectedCountry, previousProvince, destinationProvince, sliderValue, destinationCountry, false);
            moveToMode = false;
            slider.style.display = 'none';
            sliderValueText.style.display = 'none';
            slider.value = 0;
            previousProvince = path.getAttribute('id');
          }
        } else {
          // If destination province doesn't belong to the same country, don't consider it as the previous province

          if (countries[selectedCountry].atWar.includes(path.getAttribute('data-country'))) {
            attackProvince(
              selectedCountry,
              selectedProvince,
              destinationCountry,
              destinationProvince,
              sliderValue, previousProvince
            );
            //  alert("meowing at " + path.getAttribute('data-country'))
          }
          else {
            alert("Declare war on a country to attack it")
            moveToMode = false;
            slider.style.display = 'none';
            sliderValueText.style.display = 'none';
            slider.value = 0;

          }
          // previousProvince = null;
        }
      } else {
        // If not in "Move To" mode, set the current province as the previous province
        previousProvince = path.getAttribute('id');
      }

    }
    else {
      // if not selected
      const confirmMessage = `Are you sure you want to select ${path.getAttribute("name") || path.getAttribute("data-country")}?`;
      const confirmSelection = confirm(confirmMessage);
      if (confirmSelection) {
        document.getElementById("overlay-box").style.display = "none";
        selectedCountry = path.getAttribute("data-country");

        const flagImg = document.getElementById("country-flag");
        flagImg.src = `https://flagpedia.net/data/flags/h60/${countries[selectedCountry].code.toLowerCase()}.png`;

        // set treasury
        let treasury = countries[selectedCountry].treasury;
        // Remove decimals
        treasury = Math.floor(treasury);

        document.getElementById("money-amount").innerHTML = formatNumberWithSpaces(treasury);

        document.getElementById("country-flag-box").style.display = "block";
        document.getElementById("money-box").style.display = "block";

       // const provinces = countries[selectedCountry].provinces;
        showBorderingProvinces(selectedCountry);

        await startSession()


      }
    }



  });
});

// Function to check if a country is at war with another country
function isAtWar(country1, country2) {
  return countries[country1].atWar.includes(country2);
}

function attackProvince(
  sourceCountry,
  sourceProvince,
  destCountry,
  destProvince,
  attackStrength, previousProvince
) {

  // Validate countries are at war
  if (!countries[sourceCountry].atWar.includes(destCountry)) {
    return;
  }
  const sourceAdjoiningPaths = getAdjoiningPaths(previousProvince);

  const destinationPath = svg.querySelector(`#${destProvince}`);

    
  if(!sourceAdjoiningPaths.includes(destinationPath)) {
   alert("You can only attack bordering provinces");
    return;
 }
  
  // Get defender strength
  const defenderStrength = countries[destCountry].ProvincesSoldiers[destProvince];

  // Resolve battle
  if (attackStrength > defenderStrength) {
    // Attacker wins
    resolveVictory(sourceCountry, destCountry, destProvince, attackStrength, sourceProvince, defenderStrength, previousProvince);
  } else {
    // Defender wins  
    resolveDefeat(sourceCountry, sourceProvince, destCountry, attackStrength, defenderStrength, previousProvince);
  }

}

function resolveVictory(
  sourceCountry,
  destCountry,
  province,
  remainingStrength, sourceProvince, defenderStrength, previousProvince
) {

  // Remove province from defeated country's provinces
  const provinceIndex = countries[destCountry].provinces.indexOf(province);
  countries[destCountry].provinces.splice(provinceIndex, 1);

  // Add province to winning country's provinces
  countries[sourceCountry].provinces.push(province);

  // Remove soldiers from defeated province
  delete countries[destCountry].ProvincesSoldiers[province];


  // Add soldiers to capturing country
  modifySoldiersForProvinceWithoutGUIChange(
    sourceCountry,
    province,
    remainingStrength - defenderStrength,
    // text element id
  );

  // UI updates

  

  // Remove captured province highlight
  const provincePath = svg.querySelector(`#${province}`);
  provincePath.classList.remove('highlight');

  // Add country attribute 
  provincePath.setAttribute('data-country', sourceCountry);

  // Change fill color
  provincePath.setAttribute('fill', countries[sourceCountry].color);

  // Moves attackers

  //             moveSoldiers(selectedCountry, previousProvince, destinationProvince, sliderValue, destinationCountry);


  moveSoldiers(sourceCountry, previousProvince, province, remainingStrength, destCountry, true);

  if(countries[destCountry].provinces.length === 0) {

    // Open modal

    // random button name
    // TODO: Random description and title
    const buttonOptions = [
      "Good news!",
      "Finally its over!", 
      "Good job boys",
      "It was tough!"
    ];
    const randomIndex = Math.floor(Math.random() * buttonOptions.length);
    if(destCountry == selectedCountry) 
      showSimpleModal(`Your country has collapsed!`, `You have lost all provinces and now it is for winning country to decide what to do with new gained territory`, "It was fun playing!")
    else 
      showSimpleModal(`${destCountry} has collapsed!`, `${destCountry} have lost all provinces and now it is for winning side to decide what to do with new gained territory`, buttonOptions[randomIndex])

  }
  
  if (sourceCountry == selectedCountry)
    showBorderingProvinces(selectedCountry)
  moveToMode = false;
  slider.style.display = 'none';
  sliderValueText.style.display = 'none';
  slider.value = 0;

}

function modifySoldiersForProvinceWithoutGUIChange(country, province, amount) {

  countries[country].ProvincesSoldiers[province] = amount;
  console.log("done")

}



function modifySoldiers(country, province, amount) {

  if (country && countries[country] && countries[country].ProvincesSoldiers[province] !== undefined) {

    countries[country].ProvincesSoldiers[province] += amount;

  }

  // UI Update
  const textElementId = `soldiers-text-${province}`;
  if (textElementId) {
    const textElement = document.getElementById(textElementId);
    if (textElement) {
      textElement.textContent = countries[country].ProvincesSoldiers[province];
    }
  }

}

function attack(attacker, target) {
  if (attacker >= target) {
    attacker -= target;
    target = 0;
  } else {
    target -= attacker;
    attacker = 0;
  }
  return { "attacker": attacker, "target": target }
}
function resolveDefeat(
  sourceCountry, sourceProvince, destCountry, attackStrength, defenderStrength, previousProvince
) {

  const attackResult = attack(countries[sourceCountry].ProvincesSoldiers[previousProvince], countries[destCountry].ProvincesSoldiers[sourceProvince])
  // Removes losses from attackers
  countries[sourceCountry].ProvincesSoldiers[previousProvince] = attackResult.attacker;
  console.log(destCountry) // Belarus
  console.log(sourceProvince) // right city
  console.log(attackResult.target) // 90
  // Kills soldiers of defenders anyway
  countries[destCountry].ProvincesSoldiers[sourceProvince] = attackResult.target

  // UI updates

  const sourceSoldierTextElement = document.getElementById(`soldiers-text-${previousProvince}`);

  if (sourceSoldierTextElement) {
    sourceSoldierTextElement.textContent = countries[sourceCountry].ProvincesSoldiers[previousProvince];
  }
  else {
    console.log("no source")
  }

  // defender

  const sourceSoldierTextElementDefender = document.getElementById(`soldiers-text-${sourceProvince}`);

  if (sourceSoldierTextElementDefender) {
    console.log(sourceCountry)
    console.log(sourceProvince)
    console.log(countries[destCountry].ProvincesSoldiers[sourceProvince])

    sourceSoldierTextElementDefender.textContent = countries[destCountry].ProvincesSoldiers[sourceProvince];
    // Remove captured province highlight
    const provincePath = svg.querySelector(`#${sourceProvince}`);
    provincePath.classList.remove('highlight');
  }
  else {
    console.log("no defender source")
  }




  moveToMode = false;
  slider.style.display = 'none';
  sliderValueText.style.display = 'none';
  slider.value = 0;
  
  if (sourceCountry == selectedCountry)
    showBorderingProvinces(selectedCountry)
}

const svg = document.querySelector('svg');


function moveSoldiers(sourceCountry, sourceProvince, destinationProvince, amount, destCountry, IsAttacking) {
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


        // Update the soldier count text for both provinces
        const sourceSoldierTextElement = document.getElementById(`soldiers-text-${sourceProvince}`);
        const destinationSoldierTextElement = document.getElementById(`soldiers-text-${destinationProvince}`);

        if (sourceSoldierTextElement) {
          //if(countries[sourceCountry].ProvincesSoldiers[sourceProvince] == 0) return sourceSoldierTextElement.textContent = " "
          if (countries[sourceCountry].ProvincesSoldiers[sourceProvince] === 0) {
            // Hide text
            sourceSoldierTextElement.style.display = 'none';
          } else {
            // Show text  
            sourceSoldierTextElement.style.display = 'block';
            sourceSoldierTextElement.textContent = countries[sourceCountry].ProvincesSoldiers[sourceProvince];
          }



        }
        else {
          console.log("no source")
        }

        if (destinationSoldierTextElement) {

          if (countries[sourceCountry].ProvincesSoldiers[destinationProvince] === 0) {
            // Hide text
            destinationSoldierTextElement.style.display = 'none';
          } else {
            // Show text  
            destinationSoldierTextElement.style.display = 'block';
            destinationSoldierTextElement.textContent = countries[sourceCountry].ProvincesSoldiers[destinationProvince];

          }


        }
        else {
          console.log("no destination")
        }
        console.log(destinationProvince)
        previousProvince = destinationProvince;
      }
      else {
        console.log("not bordering")

        // Provinces do not border, move through intermediates

        const path = findPath(sourceProvince, destinationProvince, sourceCountry);
        if (path.length > 0) {

          moveThroughPath(sourceCountry, path, amount, IsAttacking);

        } else {
          alert("No path found between provinces");
        }
      }

    } else {
      alert("Not enough soldiers in the source province.");
    }
  } else {
    alert("The source province doesn't belong to the selected country.");
  }
}



// Move directly if source and destination border
function moveDirectly(sourceCountry, sourceProvince, destinationProvince, amount, IsAttacking) {
  if (sourceCountry && sourceProvince && destinationProvince && amount > 0) {

    console.log(" amount is " + amount)
    if (countries[sourceCountry].ProvincesSoldiers[sourceProvince] >= amount)
      countries[sourceCountry].ProvincesSoldiers[sourceProvince] -= amount;

    // Add the soldiers to the destination province
    if (!IsAttacking) // attack does that already so this makes a mess
      countries[sourceCountry].ProvincesSoldiers[destinationProvince] += amount;


    // Update the soldier count text for both provinces
    const sourceSoldierTextElement = document.getElementById(`soldiers-text-${sourceProvince}`);
    const destinationSoldierTextElement = document.getElementById(`soldiers-text-${destinationProvince}`);

    if (sourceSoldierTextElement) {
      //if(countries[sourceCountry].ProvincesSoldiers[sourceProvince] == 0) return sourceSoldierTextElement.textContent = " "
      if (countries[sourceCountry].ProvincesSoldiers[sourceProvince] === 0) {
        // Hide text
        sourceSoldierTextElement.style.display = 'none';
      } else {
        // Show text  
        sourceSoldierTextElement.style.display = 'block';
        sourceSoldierTextElement.textContent = countries[sourceCountry].ProvincesSoldiers[sourceProvince];
      }
    }
    else {
      console.log("no source")
    }

    if (destinationSoldierTextElement) {

      if (countries[sourceCountry].ProvincesSoldiers[destinationProvince] === 0) {
        // Hide text
        destinationSoldierTextElement.style.display = 'none';
      } else {
        // Show text  
        destinationSoldierTextElement.style.display = 'block';
        destinationSoldierTextElement.textContent = countries[sourceCountry].ProvincesSoldiers[destinationProvince];

      }
    }


    updateSoldierTexts(sourceCountry, sourceProvince, destinationProvince);
  }
}
const findPathCache = {};

// Find path between provinces if they do not border
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

// Construct path by tracing back parents
function constructPath(visited, current) {

  let path = [];

  while (current) {
    path.push(current);
    current = visited[current];
  }

  return path.reverse();

}

// Get adjoining provinces
function getAdjoiningProvinces(province) {

  let provinces = [];

  getAdjoiningPaths(province).forEach(path => {
    provinces.push(path.id);
  });

  return provinces;

}

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


// Update texts
function updateSoldierTexts(sourceCountry, sourceProvince, destinationProvince) {

  updateSoldierText(sourceCountry, sourceProvince);
  updateSoldierText(sourceCountry, destinationProvince);

}

let recruitsMade = 0;

function modifySoldiersForProvince(country, province, amount, textElementId) {
  if (country && countries[country] && countries[country].ProvincesSoldiers[province] !== undefined) {
    countries[country].ProvincesSoldiers[province] += amount;
    const updatedSoldiersCount = countries[country].ProvincesSoldiers[province];
    if (textElementId) {
      const textElement = document.getElementById(textElementId);
      if (textElement) {

        if (updatedSoldiersCount === 0) {
          // Hide text
          textElement.style.display = 'none';
        } else {
          // Show text  
          textElement.style.display = 'block';
          textElement.textContent = updatedSoldiersCount;
        }


      }
    }

    recruitsMade += amount;

  }

}



// Add click event listener to the "Recruit"

function getMaxRecruits(countr) {

  // Get max recruit amount based on treasury

  let treasury = countries[countr].treasury;
  let cost = getRecruitmentCost();

  return Math.max(0, Math.floor(treasury / cost));

}


let recruitMode = false; // Flag to indicate if "Move To" mode is active

recruitButton.addEventListener('click', () => {
  recruitMode = !recruitMode; // Toggle the mode
  if (recruitMode)
    showRecruitmentSlider();
  else {

    // recruiting


    // Get recruits amount
    let recruits = parseInt(slider.value);

    // Get cost per recruit
    let cost = getRecruitmentCost();

    // Validate funds
    if (countries[selectedCountry].treasury >= cost * recruits) {

      socket.send(JSON.stringify(
        {
          value: recruits,
            operation: "recruitSoldiersByUser",
          selectedCountry: selectedCountry,
          selectedProvince: selectedProvince}
      ))

      // Increment counter
      recruitsMade += recruits;

      // Update displays
      updateTreasuryDisplay();
      updateSoldierText();

    } else {
      alert("Not enough money. Please select less soldiers to recruit");
    }

    slider.style.display = 'none';
    sliderValueText.style.display = 'none';
  }
});

function showRecruitmentSlider() {

  sliderMode = "recruit";

  slider.style.display = "block";
  sliderValueText.style.display = "block";
  const maxRecruits = getMaxRecruits(selectedCountry)
  slider.max = maxRecruits
  slider.value = maxRecruits
  sliderValueText.textContent = maxRecruits; // Update the displayed value
  console.log(maxRecruits)
  // Reset slider values
  // slider.value = 0;
  updateSliderValueText();

}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Loading
document.addEventListener('DOMContentLoaded', async function() {
  await sleep(1000);

  // Hide the loading screen
  document.getElementById("loading-screen").style.display = "none";

  // Show the main content
  document.getElementById("content").style.display = "block";


  //if (!selectedCountry) alert("Click on the country you want:");

  const svg = document.querySelector('svg');
  Object.keys(countries).forEach(country => {
    console.log(country)

    const data = countries[country];
    // Set country color
    const color = data.color;

    // Get provinces
    const provinces = data.provinces;

    // Loop through provinces
    provinces.forEach(province => {
      // Select path by id  
      const path = svg.querySelector(`#${province}`);

      // Add country data attribute
      try {
        path.classList.add('country-path');
        path.setAttribute('data-country', country);
        path.setAttribute('fill', color);

        const bbox = path.getBBox();

        if (province === data.capital) {

          const starSize = 0.17563079833984374 // Math.min(bbox.width, bbox.height) * 0.005;

          // Create a smaller yellow star element
          const star = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          star.setAttribute('points', '50,15 55,28 68,28 58,38 62,55 50,45 38,55 42,38 32,28 45,28');
          star.setAttribute('fill', 'yellow');
          // Add a black border
          star.setAttribute('stroke', 'black');
          star.setAttribute('stroke-width', '1');

          // Scale and position the star within the province
          star.setAttribute('transform', `translate(${bbox.x + bbox.width / 2 - starSize / 2}, ${bbox.y + bbox.height / 2 - starSize / 2}) scale(${starSize})`);

          // Append the star to the SVG
          svg.appendChild(star);




        }

        // Add the number of soldiers as text
        const soldiersText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        soldiersText.textContent = data.ProvincesSoldiers[province];
        soldiersText.setAttribute('x', bbox.x + bbox.width / 2 - 5); // Adjust the position as needed
        soldiersText.setAttribute('y', bbox.y + bbox.height / 2 + 1); // Adjust the position as needed
        soldiersText.setAttribute('font-size', '4'); // Adjust the font size as needed
        soldiersText.setAttribute('fill', 'black');
        soldiersText.setAttribute('id', `soldiers-text-${province}`); // Add an 'id'
        svg.appendChild(soldiersText);
        soldiersText.style.userSelect = 'none'; // Prevent text selection
        soldiersText.style.visibility = "hidden";
        soldiersText.style.pointerEvents = 'none'; // Allow clicks to pass through

        path.setAttribute('data-country', country);

        // Set fill color
        path.setAttribute('fill', color);
      } catch { }
    });

  });

}, false);


// keybinds
// Define key codes for the 'M' key (for Move To) and 'R' key (for Recruit)
const MOVE_TO_KEY = 77; // 'M' key
const RECRUIT_KEY = 82; // 'R' key

// Event listener for keydown events
document.addEventListener('keydown', function(event) {
  // Check if the 'M' key is pressed and the 'Move To' button is visible
  if (event.keyCode === MOVE_TO_KEY && moveToButton.style.display === 'block') {
    // Trigger the 'Move To' button click event
    moveToButton.click();
  }
  // Check if the 'R' key is pressed and the 'Recruit' button is visible
  else if (event.keyCode === RECRUIT_KEY && recruitButton.style.display === 'block') {
    // Trigger the 'Recruit' button click event
    recruitButton.click();
  }
});


function getBorderProvinces(country) {

  const provinces = countries[country].provinces;

  const borderProvinces = [];

  provinces.forEach(province => {

    const paths = getAdjoiningPaths(province);
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

function showBorderingProvinces(country) {
  const provinces = countries[country].provinces;

  provinces.forEach(province => {
    const paths = getAdjoiningPaths(province);

    paths.forEach(path => {
      let textElement = document.getElementById(`soldiers-text-${path.id}`);

      if (textElement) {
        textElement.style.visibility = 'visible';
      }
    });
  });
}
const provinceCache = {};

function getProvinceFromPath(path) {

  const key = path;

  if(provinceCache[key]) {
    return provinceCache[key];
  }
  
  for (const country in countries) {
    const countryProvinces = countries[country].provinces;
    if (countryProvinces.includes(path)) {
      provinceCache[key] = path;
      return path;
      
    }
  }
provinceCache[key] = null;
return null;

}

// Get paths that share a border
function getAdjoiningPaths(provinceId) {
  const path = svg.querySelector(`#${provinceId}`);
  const adjoiningPaths = [];
  if (path) {
    const bbox = path.getBBox();


    Object.values(svg.children).forEach(element => {

      if (element.tagName === 'path') {

        const elementBbox = element.getBBox();

        if (bboxesIntersect(bbox, elementBbox)) {
          adjoiningPaths.push(element);
        }

      }

    });
  }

  return adjoiningPaths;

}
const intersectCache = {};

function bboxesIntersect(b1, b2) {
  const key = b1 + b2;

  if(intersectCache[key]) {
    return intersectCache[key]; 
  }
  let result = true;
  // Check boundaries
  if (b1.x > b2.x + b2.width) result = false;
  if (b1.y > b2.y + b2.height) result = false;

  if (b1.x + b1.width < b2.x) result = false;
  if (b1.y + b1.height < b2.y) result = false;

  // If no boundaries crossed, bboxes overlap
  return result;

}

function getBorderProvincesWithCountry(country, enemyCountry) {
  const provinces = countries[country].provinces;

  const borderProvinces = [];

  provinces.forEach(province => {
    const paths = getAdjoiningPaths(province);

    paths.forEach(path => {
      const otherCountry = path.getAttribute('data-country');
      if (otherCountry === enemyCountry) {
        console.log(province + " is bordering atwar country")
        borderProvinces.push(province);
      }
      //else {
      //  console.log(province + " which is owned by " + country + " is not bordering " + enemyCountry)
      //}
    });
  });
  console.log(borderProvinces)
  return borderProvinces;
}


// AI Actions


// Recruitment
function recruitAIArmies() {
  Object.keys(countries).forEach(country => {

    if(countries[country].provinces.length === 0) return;
    if (country == selectedCountry) return;

    // Higher treasury = higher chance, capped at 50% 
    const recruitChance = Math.min(countries[country].treasury / 500, 0.3);


    if (Math.random() < recruitChance) {

      let enemyCountries = countries[country].atWar;

      // If at war, get border provinces with enemy countries
      if (enemyCountries.length > 0) {
        let borders = getBorderProvincesWithCountry(country, enemyCountries[0]);

        // Pick random border province
        let province = borders[Math.floor(Math.random() * borders.length)];
        modifySoldiers(country, province, Math.round(getMaxRecruits(country) / 3));

        // If not at war, get all border provinces  
      } else {
        let borders = getBorderProvinces(country);

        // Pick random province
        let province = borders[Math.floor(Math.random() * borders.length)];
        modifySoldiers(country, province, Math.round(getMaxRecruits(country) / 4));

      }

      // Recruit soldiers   

    }
  })
}
function moveToBordersOnWar(country, enemyCountry) {

  // Get all border provinces
  const borderProvinces = getBorderProvincesWithCountry(country, enemyCountry);

  // Get total soldiers
  let totalSoldiers = 0;
  Object.values(countries[country].ProvincesSoldiers).forEach(count => {
    totalSoldiers += count;
  });
  console.log(totalSoldiers)
  // Distribute soldiers evenly
  const soldiersPerProvince = Math.floor(totalSoldiers / borderProvinces.length);

  borderProvinces.forEach(province => {
    // Move soldiers to border province
    modifySoldiers(country, province, soldiersPerProvince);
    console.log("moved for " + province)

  });
  console.log("done moving")
}


const maxWars = 5;
let currentWars = 0;
function startAILoop(attacker, defender) {
  let loopCount = 0;
  const loop = setInterval(() => {
    if (loopCount >= 5) {
    clearInterval(loop);
      startAILoop(attacker, defender)
     // loopCount = 0
      return;
    }
    if (
      countries[attacker].provinces.length === 0 ||
      countries[defender].provinces.length === 0
    ) {
      currentWars--;
      clearInterval(loop);
      return;
    }
    const aiCountries = Object.keys(countries);
    aiCountries.forEach((aiCountry) => {
      const enemyCountries = countries[aiCountry].atWar;
      enemyCountries.forEach((enemyCountry) => {
        const aiBorderProvinces = getBorderProvincesWithCountry(
          aiCountry,
          enemyCountry
        );
        aiBorderProvinces.forEach((aiProvince) => {
          // Validate AI province belongs to AI
          if (!countries[aiCountry].provinces.includes(aiProvince)) return;
          const aiPaths = getAdjoiningPaths(aiProvince);
          aiPaths.forEach((path) => {
            // Check if path borders
            const otherCountry = path.getAttribute("data-country");
            if (otherCountry == enemyCountry) {
              const enemyProvince = path.id;
              const enemySoldiers =
                countries[enemyCountry].ProvincesSoldiers[enemyProvince];
              const aiSoldiers =
                countries[aiCountry].ProvincesSoldiers[aiProvince];
              if (aiSoldiers >= enemySoldiers * 1.30) {
                if (aiCountry != selectedCountry) {
                  console.log(
                    aiCountry +
                      " from province " +
                      aiProvince +
                      " attacking " +
                      enemyCountry +
                      " province " +
                      enemyProvince +
                      " with " +
                      aiSoldiers +
                      " amount of soldiers"
                  );
                  attackProvince(
                    aiCountry,
                    aiProvince,
                    enemyCountry,
                    enemyProvince,
                    aiSoldiers,
                    aiProvince
                  );
                }
              }
            }
          });
        });
      });
    });
    loopCount++;
  }, 10000);
}
// Limit concurrent wars


// AI Declare War
// Function to trigger AI aggression with chance
function triggerAIAggression() {
  if(currentWars != maxWars || currentWars < maxWars){
  const aggressionChance = 0.4;

  if(Math.random() < aggressionChance) {
    // Call AI aggression functions
    runAIAggression(); 
  }
  }
  else {
    console.log("max wars limit reached")
  }
}

function getNeighbours(borderProvinces) {
  return borderProvinces
    .map(p => getAdjoiningPaths(p))
    .flatMap(paths => paths.map(p => p.getAttribute('data-country')));  
}

function findWeakNeighbour(country) {

  // Get borders
  const borderProvinces = getBorderProvinces(country);  

  // Map to neighbors
  let neighbours = getNeighbours(borderProvinces);  

  // Filter out self, at war, null values
  neighbours = neighbours
    .filter(n => n !== country)
    .filter(n => !countries[country].atWar.includes(n))
    .filter(n => n);

  // Find weakest
  let weakest = findWeakest(neighbours);
console.log("for " + country + " neighbours are " + neighbours)
  return weakest;

}

function findWeakest(neighbours) {
let weakest;
  neighbours.forEach(neighbour => {

    if(!weakest) {
      weakest = neighbour;
    } else if(isWeaker(neighbour, weakest)) {
      weakest = neighbour;
    }

  });

  return weakest;

}


function isWeaker(neighbor1, neighbor2) {
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

// AI aggression functions
async function runAIAggression() {

  // Get all AI countries
  const aiCountries = Object.keys(countries).filter(c => c != selectedCountry);

  // Pick two random AI countries to be aggressive
  const aggressor1 = aiCountries[Math.floor(Math.random() * aiCountries.length)];
  const aggressor2 = aiCountries[Math.floor(Math.random() * aiCountries.length)];  

  // Run aggression functions for each country after delay
  await runAIActions(aggressor1);
  //await sleep(40000); 
  await runAIActions(aggressor2);
}

async function runAIActions(country) {

  // Find neighbour with fewer provinces/soldiers
  const target = findWeakNeighbour(country);
console.log(target + " is weak")
  // Attack neighbour
  if(target) {
    moveToBordersOnWar(country, target);
    await sleep(Math.floor(Math.random() * (20000 - 10000 + 1) + 10000))
    declareWar(country, target);
    moveToBordersOnWar(
      target,  
      country 
    );
    startAILoop(country, target);
    await sleep(5000)
    startAILoop(target, country);

  }

}

// Declare war
function declareWar(attacker, defender) {
 // console.log(attacker + " declared war on " + defender)
  currentWars++
  showSimpleModal(`${attacker} has declared war on ${defender}!`, `Looks like ${attacker} really wants to build an empire so now invades innocent countries.`, "Scary time we live in!")

  countries[attacker].atWar.push(defender);
  countries[defender].atWar.push(attacker);  
}




// AI aggression is handled server-side to avoid state conflicts


// UI

function showSimpleModal(title, description, closeButtonText) {

  // Update title
  $('#collapseModal .modal-title').html(title);

  // Update description
  $('#collapseModal .modal-body p').html(description);
  // Update close button text
  $('#collapseModal .modal-footer button').text(closeButtonText);
  // Show modal
  $('#collapseModal').modal('show');
}