const incrementAllTreasuries = require("./incrementAllTreasuries.js");
const recruitAIArmies = require("./recruitAIArmies.js")
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const setupOwnAIAttacks = require("../AI/setupOwnAIAttacks")
function setupDefaultUserValues(selectedCountry, sessionID) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));  

  const countries = sessionData.countries;
 
  sessionData.maxWars = 5
  sessionData.currentWars = 0
  countries[selectedCountry].recruitCost = 0.25;
  const sessionDataWritePath = path.resolve(__dirname, `../sessions/${sessionID}.json`);


  fs.writeFileSync(sessionDataWritePath, JSON.stringify(sessionData, null, 2));
}


function setupDefaultSVG(sessionID) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${sessionID}.json`);
  const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));

  const countries = sessionData.countries;

  const htmlContent = fs.readFileSync(path.resolve(__dirname, '../html/index.html'), 'utf8');
  const { window } = new JSDOM(htmlContent);
  const doc = new window.DOMParser().parseFromString(htmlContent, 'text/html');

  const svg = doc.querySelector('svg');

  Object.keys(countries).forEach(country => {
    const data = countries[country];
    // Get provinces
    const provinces = data.provinces;
    provinces.forEach(province => {
      // Select path by id
      const provincePath = svg.querySelector(`#${province}`);
      if (provincePath) { // Check if the provincePath exists to avoid errors
        provincePath.setAttribute('data-country', country);
      }
    });
  });

  // Write the changes once after all modifications to avoid repeated file writes
  fs.writeFileSync(path.resolve(__dirname, `../html/index.html`), doc.documentElement.outerHTML);
}


async function setupSession(sessionID, client, selectedCountry) {
  // adding additional values
  setupDefaultUserValues(selectedCountry, sessionID)
 // setupDefaultSVG(sessionID)
console.log("Started session: " + sessionID)
  setupOwnAIAttacks(sessionID, selectedCountry, client)
setInterval( async () => {

  await incrementAllTreasuries(sessionID);
  await recruitAIArmies(sessionID, selectedCountry);

  
  client.send(JSON.stringify({operation: "constantGameChange", sessionInfo: fs.readFileSync(path.resolve(__dirname, `../sessions/${sessionID}.json`), "utf8")}));

}, 5000);
}

module.exports = setupSession