const fs = require("fs");
const path = require("path");


async function setValueInSession(id, valuePath, changeTo) {
  const sessionDataPath = path.resolve(__dirname, `../sessions/${id}.json`);
  const currentSessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
  const valuePathArray = valuePath.substring(2, valuePath.length - 2).split('"]["');
  let sessionDataRef = currentSessionData;
  for (let i = 0; i < valuePathArray.length - 1; i++) {
    if (!sessionDataRef[valuePathArray[i]]) {
      sessionDataRef[valuePathArray[i]] = {};
    }
    sessionDataRef = sessionDataRef[valuePathArray[i]];
  }
  sessionDataRef[valuePathArray[valuePathArray.length - 1]] = changeTo;

  fs.writeFileSync(sessionDataPath, JSON.stringify(currentSessionData, null, 2));

  return fs.readFileSync(sessionDataPath, "utf8");

}

module.exports = setValueInSession