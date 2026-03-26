/**
 * NetworkManager - WebSocket connection manager for the strategy game.
 * Handles all communication with the game server.
 */
class NetworkManager {
  /**
   * @param {string} url - WebSocket server URL.
   */
  constructor(url) {
    this.url = url || 'ws://localhost:3000';
    this.socket = null;
    this.sessionID = null;
    this.messageHandlers = new Map();
  }

  /**
   * Open a WebSocket connection to the server.
   * @returns {Promise<void>} Resolves when the connection is open.
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('Connected to server');
        resolve();
      };

      this.socket.onmessage = (event) => {
        var message = JSON.parse(event.data);

        // Store session ID from sessionInit messages
        if (message.operation === 'sessionInit' && message.sessionID) {
          this.sessionID = message.sessionID;
        }

        var handler = this.messageHandlers.get(message.operation);
        if (handler) {
          handler(message);
        } else {
          console.log('Unhandled operation:', message.operation, message);
        }
      };

      this.socket.onclose = () => {
        console.log('Disconnected from server');
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  /**
   * Send a JSON message to the server.
   * @param {string} operation - The operation name.
   * @param {Object} [data] - Additional data to include in the message.
   */
  send(operation, data) {
    var message = Object.assign({ operation: operation }, data || {});
    this.socket.send(JSON.stringify(message));
  }

  /**
   * Register a handler for a specific operation.
   * @param {string} operation - The operation name to listen for.
   * @param {Function} callback - Called with the parsed message object.
   */
  on(operation, callback) {
    this.messageHandlers.set(operation, callback);
  }

  /**
   * Remove the handler for a specific operation.
   * @param {string} operation - The operation name to stop listening for.
   */
  off(operation) {
    this.messageHandlers.delete(operation);
  }

  /**
   * Start a new game session.
   * @param {string} selectedCountry - The country the player chose.
   */
  startSession(selectedCountry) {
    this.send('startSession', { selectedCountry: selectedCountry });
  }

  /**
   * Recruit soldiers in a province.
   * @param {number} value - Number of soldiers to recruit.
   * @param {string} selectedCountry - The recruiting country.
   * @param {string} selectedProvince - The province to recruit in.
   */
  recruitSoldiers(value, selectedCountry, selectedProvince) {
    this.send('recruitSoldiersByUser', {
      value: value,
      selectedCountry: selectedCountry,
      selectedProvince: selectedProvince
    });
  }

  /**
   * Declare war between two countries.
   * @param {string} attacker - The attacking country.
   * @param {string} defender - The defending country.
   */
  declareWar(attacker, defender) {
    this.send('declareWar', {
      attacker: attacker,
      defender: defender
    });
  }

  /**
   * Request a value from the current session.
   * @param {string} valuePath - Dot-notation path to the value.
   */
  getValueFromSession(valuePath) {
    this.send('getValueFromSession', { valuePath: valuePath });
  }

  /**
   * Update a value in the current session.
   * @param {string} id - Identifier for the target object.
   * @param {string} valuePath - Dot-notation path to the value.
   * @param {*} changeTo - The new value to set.
   */
  setValueInSession(id, valuePath, changeTo) {
    this.send('setValueInSession', {
      valuePath: valuePath,
      changeTo: changeTo
    });
  }
}
