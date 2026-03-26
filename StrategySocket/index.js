const express = require("express");
const app = express();
const server = require("http").createServer(app);
const { v4: uuidv4 } = require("uuid"); // Make sure to require uuid
const operationHandler = require("./operationHandler.js");
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server }); // Attach the WebSocket server to the HTTP server

const fs = require('fs');
const path = require('path');

// Delete existing sessions as startup cleanup, ensure this runs once
const sessionDirectory = path.resolve(__dirname, "./sessions");
fs.readdirSync(sessionDirectory).forEach(file => {
  try {
    fs.unlinkSync(path.join(sessionDirectory, file));
  } catch (e) {
    console.log("Failed to clean session file:", e.message);
  }
});

// WebSocket connection handling
wss.on('connection', function connection(ws) {
  const sessionID = uuidv4();
  ws.sessionID = sessionID; // Store session ID directly in the WebSocket object

  ws.on('message', function incoming(message) {
    const parsedMessage = JSON.parse(message);
    operationHandler(parsedMessage, ws).catch(console.error);
  });

  // Cleanup intervals on disconnect
  ws.on('close', function() {
    console.log("Client disconnected: " + sessionID);
    if (ws._gameInterval) clearInterval(ws._gameInterval);
    if (ws._aiInterval) clearInterval(ws._aiInterval);
    if (ws._warIntervals) {
      ws._warIntervals.forEach(interval => clearInterval(interval));
    }

    // Clean up session file after intervals are cleared
    setTimeout(() => {
      try {
        const sessionFile = path.resolve(__dirname, `./sessions/${sessionID}.json`);
        if (fs.existsSync(sessionFile)) {
          fs.unlinkSync(sessionFile);
        }
      } catch (e) {
        // Ignore - file may already be gone
      }
    }, 1000);
  });

  const defaultSessionJSON = fs.readFileSync(
      path.resolve(__dirname, `./defaults/session.json`),
      "utf8",
    )
  // Send a welcome message with the session ID
  ws.send(JSON.stringify({
    message: "Welcome!",
    operation: "sessionInit",
    sessionID: sessionID,
    sessionInfo: defaultSessionJSON,
  }));
})
// You may define express routes here
app.get('/', (req, res) => {
  res.send('Bye World!');
});

// Specify a port for the HTTP server to listen on
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
