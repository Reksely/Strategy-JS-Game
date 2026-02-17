const fs = require("fs");
const path = require("path");

async function startSession(uniqueId) {
const defaultData = fs.readFileSync(path.resolve(__dirname, "../defaults/session.json"), "utf8");

  const sessionDataPath = path.resolve(__dirname, `../sessions/${uniqueId}.json`);

  fs.writeFileSync(sessionDataPath, defaultData);
  return fs.readFileSync(sessionDataPath, "utf8");
}

module.exports = startSession