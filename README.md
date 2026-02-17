# Strategy Game

A browser-based grand strategy game inspired by Age of History 2, created as a personal project 3 years ago to learn game development and WebSocket programming using JS.

Took hours and multiple reverse engineering of logic in Age of History. This was made in pre-AI era.

## ⚠️ Disclaimer

This project is **buggy** and was made as a learning experiment. It was my attempt at recreating some of the mechanics from Age of History 2. Expect crashes, weird AI behavior, and unpolished gameplay. Use at your own risk!

## 🎮 Features

### Core Gameplay
- **Interactive Map**: Click on provinces to select and control territories
- **Country Management**: Control your selected nation and expand your territory
- **Provincial System**: Each province can have soldiers and belongs to a country
- **Treasury System**: Manage your nation's economy with income generation
- **Real-time Updates**: Game state updates every 5 seconds via WebSocket

### Military & Warfare
- **Soldier Recruitment**: Recruit armies in your provinces (costs treasury)
- **War Declaration**: Declare war on neighboring countries
- **Troop Movement**: Move soldiers between provinces
- **Border Warfare**: Armies automatically move to borders during wartime
- **Provincial Combat**: Fight for control of territories

### AI System
- **AI Opponents**: Computer-controlled nations with autonomous behavior
- **AI Aggression**: AI countries evaluate threats and declare wars
- **AI Recruitment**: Automated army recruitment for AI nations
- **Weak Neighbor Detection**: AI identifies vulnerable targets
- **War Management**: System limits maximum concurrent wars to 5

### Economic System
- **Automatic Income**: Treasury grows based on number of provinces owned
- **Province Value**: Each province contributes 45 gold per interval (increases by 4 per province)
- **Recruitment Costs**: Dynamic pricing that increases with each recruitment (starts at 0.25 gold per soldier)

### Technical Features
- **WebSocket Server**: Real-time multiplayer-ready architecture using `ws`
- **Session Management**: Each game creates a unique session with UUID
- **Express Backend**: Node.js server handling game operations
- **Operation Handler**: Message-based system for client-server communication
- **State Persistence**: Session data stored as JSON files

## 🚀 How to Run

### Prerequisites
- Node.js installed on your system
- A web browser

### Step 1: Start the Backend Server (StrategySocket)

```bash
cd StrategySocket
npm install
node index.js
```

The server will start on `http://localhost:3000`

### Step 2: Open the Game (Strategy)

1. Navigate to the `Strategy` folder
2. Open `index.html` in your web browser
3. The game will automatically connect to the WebSocket server

## 🎯 Supported Operations

The game uses a WebSocket message system with the following operations:

- `sessionInit` - Initialize a new game session
- `startSession` - Start gameplay with selected country
- `checkConnect` - Verify WebSocket connection
- `declareWar` - Declare war between two nations
- `recruitSoldiersByUser` - Recruit soldiers in a province
- `getValueFromSession` - Retrieve session data
- `setValueInSession` - Update session data
- `constantGameChange` - Periodic game state updates

## 🛠️ Technologies Used

- **Frontend**: Vanilla JavaScript, HTML, CSS, SVG
- **Backend**: Node.js, Express.js
- **WebSocket**: ws library for real-time communication
- **DOM Manipulation**: JSDOM for server-side HTML parsing
- **Session Management**: UUID for unique session IDs
- **Data Storage**: JSON file-based session storage

## 🐛 Known Issues

- Buggy AI decision-making
- Possible race conditions in WebSocket handlers
- Map rendering performance issues (large SVG file)
- Inconsistent game balance
- Limited error handling
- No save/load functionality
- Session cleanup may not work properly
- Probably many more undiscovered bugs!

## 📝 Notes

- This was a learning project from 3 years ago
- Code quality is not production-ready
- Many features are half-implemented
- The game was never fully completed
- Feel free to fork and improve it!

## 🤝 Contributing

This is a personal archive project, but feel free to fork it and make it better! I'm not actively maintaining it.

## 📜 License

This is a personal project. Use it however you want.
