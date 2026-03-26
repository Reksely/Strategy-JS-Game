# Strategy JS Game

Real-time browser strategy game where players control European countries on a map, recruit armies, and wage wars against AI opponents.

## Architecture

```
Strategy/                  # Frontend (Phaser 3 game, opened in browser)
  index.html               # HTML shell - loads Phaser CDN + game scripts + overlay UI
  style.css                # Styles for HTML overlay elements (not the game canvas)
  mapdata.json             # Pre-extracted SVG province polygons (193KB, generated)
  js/
    main.js                # Phaser game config and launch
    GameScene.js           # Main scene: province rendering, camera, input, game logic
    network.js             # WebSocket connection manager (NetworkManager class)
    ui.js                  # HTML overlay controller (UIManager class)
  cdn/
    money-icon.png         # Treasury icon

extractMapData.js          # One-time Node script: SVG -> mapdata.json

StrategySocket/            # Backend (Node.js WebSocket server)
  index.js                 # Server entry point, WebSocket setup, session cleanup
  operationHandler.js      # Message router (switch on operation name)

  sessionManager/          # Session CRUD (JSON files on disk)
  funcitons/               # Core game functions (note: folder name is intentionally misspelled)
  warSystem/               # Combat resolution (attack, victory, defeat)
  AI/                      # AI behavior (aggression, war loops, troop movement)
  utils/                   # Shared helpers (adjacency, soldiers, pathfinding)

  defaults/session.json    # Template for new game sessions
  sessions/                # Runtime session files (created per player, cleaned on disconnect)
  html/index.html          # Server-side copy of SVG for JSDOM adjacency parsing
```

## Running

```bash
cd StrategySocket
npm install
node index.js              # Starts WebSocket server on port 3000
```

Then open `Strategy/index.html` in browser. It connects to `ws://localhost:3000`.

## Regenerating Map Data

If the SVG map changes, regenerate `mapdata.json`:
```bash
node extractMapData.js     # Parses SVG paths -> polygon points JSON
```

## Tech Stack

- **Frontend**: Phaser 3.80, Bootstrap 5.2.2, jQuery 3.6.0, plain JS (no bundler)
- **Backend**: Node.js, Express, ws (WebSocket), JSDOM, uuid
- **State**: JSON files in `sessions/` directory (one per connected player)
- **No database** - all state is in-memory JSON written to disk

## Frontend Architecture (Phaser)

The game uses Phaser 3 for rendering with HTML overlay elements for UI:

- **Map rendering**: Province polygons pre-computed from SVG bezier curves (Douglas-Peucker simplified), drawn as Phaser Graphics fills + strokes
- **Camera**: Phaser camera with drag-to-pan and scroll-to-zoom (pointer-centric)
- **Hit testing**: `Phaser.Geom.Polygon.Contains()` on province polygons
- **UI overlay**: HTML elements (modals, buttons, slider, info panel) float over the canvas via CSS `z-index`
- **Soldier labels**: Phaser Text objects positioned at province centers
- **Capital stars**: `Phaser.GameObjects.Star` at capital provinces

Key classes:
- `GameScene` - Single Phaser scene handling all gameplay
- `NetworkManager` - WebSocket wrapper with operation-based message routing
- `UIManager` - DOM controller for overlay elements (buttons, slider, modal, info panel)

## Communication Protocol

All messages are JSON over WebSocket with an `operation` field:

| Operation | Direction | Purpose |
|-----------|-----------|---------|
| `sessionInit` | server->client | Welcome message with default state |
| `startSession` | client->server | Player selects country, starts game |
| `recruitSoldiersByUser` | bidirectional | Player recruits soldiers |
| `declareWar` | bidirectional | Player declares war on AI country |
| `constantGameChange` | server->client | Periodic state sync (every 5s) |
| `warChange` | server->client | AI war action completed |
| `getValueFromSession` | bidirectional | Read nested session value |
| `setValueInSession` | bidirectional | Write nested session value |

## Game State Structure

```json
{
  "countries": {
    "Ukraine": {
      "color": "#bfd64a",
      "capital": "path13",
      "code": "UA",
      "treasury": 1000,
      "provinces": ["path6", "path9", ...],
      "ProvincesSoldiers": { "path6": 100, "path9": 100 },
      "atWar": []
    }
  },
  "currentWars": 0,
  "maxWars": 5
}
```

## Map Data Format (mapdata.json)

```json
{
  "viewBox": { "x": -3, "y": 92, "width": 1248, "height": 854 },
  "provinces": {
    "path6": {
      "p": [x1,y1,x2,y2,...],  // flat polygon points array
      "c": "Ukraine",           // owning country (from SVG data-country)
      "cx": 827.9,              // center X
      "cy": 491.9               // center Y
    }
  }
}
```

## Server Timers

- **Game loop** (5s): Increment treasuries, AI recruitment, broadcast state
- **AI aggression** (20s): 40% chance to start a new AI war
- **War loop** (10s per war): AI attacks border provinces where it has 30% advantage

All intervals are stored on the WebSocket client object (`_gameInterval`, `_aiInterval`, `_warIntervals`) and cleared on disconnect.

## Key Mechanics

- **Treasury**: +45 gold per province every 5 seconds (constant rate)
- **Recruitment cost**: Starts at 0.25, increases +0.06 per recruitment action
- **Combat**: Attacker wins if `attackStrength > defenderStrength`. Winner takes province, loser loses soldiers proportionally.
- **Adjacency**: Bounding box intersection (parsed from SVG `d` attribute on server via JSDOM, polygon data on client)
- **AI targeting**: Finds weakest neighbor by total soldier count, declares war, redistributes troops to borders

## Conventions

- Province IDs follow SVG path naming: `path1`, `path2`, ..., or country codes (`UA`, `LT`)
- `ProvincesSoldiers` uses PascalCase (matches existing convention throughout)
- The `funcitons/` folder name is a known typo - do not rename (would break requires everywhere)
- Backend writes full session JSON on every change (no partial updates)
- All AI runs server-side; frontend only handles player actions and renders server state
- Frontend uses plain `<script>` tags, no module bundler
