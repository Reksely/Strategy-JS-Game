const fs = require("fs");
const path = require("path");

async function getValueFromSession(id, valuePath) {
  try {
    const sessionDataPath = path.resolve(__dirname, `../sessions/${id}.json`);
    const currentSessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
    const valuePathArray = valuePath.substring(2, valuePath.length - 2).split('"]["');
    let sessionDataRef = currentSessionData;
    for (let i = 0; i < valuePathArray.length; i++) {
      if (sessionDataRef.hasOwnProperty(valuePathArray[i])) {
        sessionDataRef = sessionDataRef[valuePathArray[i]];
      } else {
        // Property does not exist
        return null; // Or any other value indicating the property was not found
      }
    }
    return sessionDataRef;
  } catch (error) {
    // Handle errors (e.g., file not found, JSON parse error)
    console.error("Error getting value from session:", error);
    return null; // Or any other value indicating an error occurred
  }
}

module.exports = getValueFromSession;
