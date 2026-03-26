const startSession = require("./sessionManager/startSession");
const { v4: uuidv4 } = require("uuid");
const setValueInSession = require("./sessionManager/setValueInSession");
const getValueFromSession = require("./sessionManager/getValueFromSession");
const setupSession = require("./funcitons/setupSession");
const recruitSoldiers = require("./funcitons/recruitSoldiers");
const attackProvince = require("./warSystem/attackProvince");
const fs = require("fs");
const {declareWar} = require("./funcitons/declareWar");
const path = require("path");
async function operationHandler(message, client) {
  const { selectedCountry, valuePath, changeTo, id, value, selectedProvince } =
    message;
  const sessionID = client.sessionID;
  switch (message.operation) {
    case "getValueFromSession":
      const getValue = await getValueFromSession(sessionID, valuePath);
      console.log(getValue);
      client.send(
        JSON.stringify({
          message: "value got successfully",
          operation: "getValueFromSession",
          value: getValue,
        }),
      );
      break;

    case "setValueInSession":
      const valueSet = await setValueInSession(id, valuePath, changeTo);
      client.send(
        JSON.stringify({
          message: "value set successfully",
          operation: "setValueInSession",
          sessionInfo: valueSet,
        }),
      );
      break;

    case "checkConnect":
      client.send(JSON.stringify({ message: "ok" }));
      break;

    case "declareWar":
      const { attacker, defender } = message;

      const changedProvinces = await declareWar(attacker, defender, sessionID, client);
      client.send(
        JSON.stringify({
          message: "War declared successfully",
          operation: "declareWar",
          changedProvinces,
          provinceCountry: defender,
          sessionInfo: fs.readFileSync(
            path.resolve(__dirname, `./sessions/${sessionID}.json`),
            "utf8",
          ),
        }),
      );

      break;
    case "recruitSoldiersByUser":
      const { updatedSoldiersCount, updatedTreasury } = await recruitSoldiers(
        value,
        selectedCountry,
        selectedProvince,
        sessionID,
      );

      client.send(
        JSON.stringify({
          message: "recruited successfully",
          operation: "recruitSoldiersByUser",
          updatedTreasury,
          updatedSoldiersCount,
        }),
      );

      break;
    case "moveSoldiers": {
      const sessionDataPath2 = path.resolve(__dirname, `./sessions/${sessionID}.json`);
      const sd = JSON.parse(fs.readFileSync(sessionDataPath2, "utf8"));
      const c = sd.countries;
      const { country, fromProvince, toProvince, amount } = message;
      if (c[country] && c[country].ProvincesSoldiers[fromProvince] !== undefined) {
        c[country].ProvincesSoldiers[fromProvince] = Math.max(0, c[country].ProvincesSoldiers[fromProvince] - amount);
        if (c[country].ProvincesSoldiers[toProvince] !== undefined) {
          c[country].ProvincesSoldiers[toProvince] += amount;
        }
      }
      fs.writeFileSync(sessionDataPath2, JSON.stringify(sd, null, 2));
      break;
    }
    case "playerAttack": {
      const sessionDataPath = path.resolve(__dirname, `./sessions/${sessionID}.json`);
      const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, "utf8"));
      const countries = sessionData.countries;

      const { sourceCountry, sourceProvince, destCountry, destProvince, attackStr, previousProvince } = message;

      attackProvince(sourceCountry, sourceProvince, destCountry, destProvince, attackStr, previousProvince, countries, client);

      // Write updated state
      fs.writeFileSync(sessionDataPath, JSON.stringify(sessionData, null, 2));

      client.send(JSON.stringify({
        operation: "playerAttack",
        sessionInfo: fs.readFileSync(sessionDataPath, "utf8"),
      }));
      break;
    }
    case "startSession":
      const sessionJSON = await startSession(sessionID);
      setupSession(sessionID, client, message.selectedCountry);
      client.send(
        JSON.stringify({
          message: "done",
          operation: "startSession",
          operationID: sessionID,
          sessionInfo: sessionJSON,
        }),
      );

      break;
    default:
      client.send(
        JSON.stringify({
          receivedOperation: message.operation,
          message: "unknown operation",
        }),
      );
  }
}

module.exports = operationHandler;
