class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');

    this.mapData = null;
    this.countries = null;
    this.selectedCountry = null;
    this.selectedProvince = null;
    this.previousProvince = null;
    this.moveToMode = false;
    this.recruitMode = false;
    this._lastZoom = -1;

    // Graphics layers
    this.fillGfx = null;
    this.strokeGfx = null;
    this.highlightGfx = null;

    // Province polygon cache for hit testing
    this.provincePolygons = {}; // id -> Phaser.Geom.Polygon

    // Soldier text objects
    this.soldierTexts = {};

    // Network + UI
    this.net = null;
    this.ui = null;

    // Recruitment cost
    this.recruitCost = 0.25;
  }

  preload() {
    // Map data loaded via global MAP_DATA from js/mapdata.js (avoids CORS with file://)
  }

  create() {
    this.mapData = MAP_DATA;
    this.ui = new UIManager();
    this.net = new NetworkManager();

    // Set up graphics layers (draw order matters)
    this.fillGfx = this.add.graphics();
    this.strokeGfx = this.add.graphics();
    this.highlightGfx = this.add.graphics();

    // Set world bounds to match SVG viewBox
    const vb = this.mapData.viewBox;
    this.cameras.main.setBounds(vb.x - 50, vb.y - 50, vb.width + 100, vb.height + 100);

    // Connect to server
    this.net.connect().then(() => {
      this.net.on('sessionInit', (msg) => this.onSessionInit(msg));
      this.net.on('startSession', (msg) => this.onStartSession(msg));
      this.net.on('constantGameChange', (msg) => this.onGameChange(msg));
      this.net.on('warChange', (msg) => this.onGameChange(msg));
      this.net.on('recruitSoldiersByUser', (msg) => this.onRecruit(msg));
      this.net.on('declareWar', (msg) => this.onDeclareWar(msg));
    });

    this.setupCamera();
    this.setupInput();
    this.setupUICallbacks();

    // Hide loading after a moment
    this.time.delayedCall(800, () => {
      this.ui.hideLoading();
    });
  }

  update() {
    // Keep text at a constant screen-pixel size regardless of zoom
    const zoom = this.cameras.main.zoom;
    if (Math.abs(zoom - this._lastZoom) > 0.001) {
      this._lastZoom = zoom;
      const textScale = 0.5 / zoom;
      for (const id in this.soldierTexts) {
        this.soldierTexts[id].setScale(textScale);
      }
    }
  }

  // --- Network message handlers ---

  onSessionInit(msg) {
    this.countries = JSON.parse(msg.sessionInfo).countries;
    this.drawAllProvinces();
    this.createSoldierTexts();
    this.createCapitalStars();

    // Center camera on the map
    const vb = this.mapData.viewBox;
    this.cameras.main.centerOn(vb.x + vb.width / 2, vb.y + vb.height / 2);
    this.cameras.main.setZoom(Math.min(
      this.scale.width / vb.width,
      this.scale.height / vb.height
    ) * 0.9);
  }

  onStartSession(msg) {
    this.countries = JSON.parse(msg.sessionInfo).countries;
    this.redrawProvinces();
    this.updateAllSoldierTexts();
    this.ui.updateTreasury(Math.floor(this.countries[this.selectedCountry].treasury));
  }

  onGameChange(msg) {
    this.countries = JSON.parse(msg.sessionInfo).countries;
    this.redrawProvinces();
    this.updateAllSoldierTexts();
    if (this.selectedCountry && this.countries[this.selectedCountry]) {
      this.ui.updateTreasury(Math.floor(this.countries[this.selectedCountry].treasury));
    }
  }

  onRecruit(msg) {
    if (this.selectedCountry) {
      this.ui.updateTreasury(Math.floor(msg.updatedTreasury));
    }
    if (this.selectedProvince && msg.updatedSoldiersCount !== undefined) {
      this.updateSoldierText(this.selectedProvince, msg.updatedSoldiersCount);
    }
  }

  onDeclareWar(msg) {
    this.countries = JSON.parse(msg.sessionInfo).countries;
    this.redrawProvinces();
    this.updateAllSoldierTexts();
  }

  // --- Drawing ---

  drawAllProvinces() {
    this.fillGfx.clear();
    this.strokeGfx.clear();

    const provs = this.mapData.provinces;
    for (const id in provs) {
      const prov = provs[id];
      const pts = prov.p;
      if (pts.length < 6) continue;

      // Determine fill color
      let color = 0xececec; // default gray
      const ownerCountry = this.getProvinceOwner(id);
      if (ownerCountry && this.countries[ownerCountry]) {
        color = this.hexToInt(this.countries[ownerCountry].color);
      }

      // Draw fill
      this.fillGfx.fillStyle(color, 1);
      this.fillGfx.beginPath();
      this.fillGfx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) {
        this.fillGfx.lineTo(pts[i], pts[i + 1]);
      }
      this.fillGfx.closePath();
      this.fillGfx.fillPath();

      // Draw stroke
      this.strokeGfx.lineStyle(0.3, 0x000000, 0.6);
      this.strokeGfx.beginPath();
      this.strokeGfx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) {
        this.strokeGfx.lineTo(pts[i], pts[i + 1]);
      }
      this.strokeGfx.closePath();
      this.strokeGfx.strokePath();

      // Build polygon for hit testing
      const geomPoints = [];
      for (let i = 0; i < pts.length; i += 2) {
        geomPoints.push(new Phaser.Geom.Point(pts[i], pts[i + 1]));
      }
      this.provincePolygons[id] = new Phaser.Geom.Polygon(geomPoints);
    }
  }

  redrawProvinces() {
    this.fillGfx.clear();
    this.strokeGfx.clear();

    const provs = this.mapData.provinces;
    for (const id in provs) {
      const prov = provs[id];
      const pts = prov.p;
      if (pts.length < 6) continue;

      let color = 0xececec;
      const ownerCountry = this.getProvinceOwner(id);
      if (ownerCountry && this.countries[ownerCountry]) {
        color = this.hexToInt(this.countries[ownerCountry].color);
      }

      this.fillGfx.fillStyle(color, 1);
      this.fillGfx.beginPath();
      this.fillGfx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) {
        this.fillGfx.lineTo(pts[i], pts[i + 1]);
      }
      this.fillGfx.closePath();
      this.fillGfx.fillPath();

      this.strokeGfx.lineStyle(0.3, 0x000000, 0.6);
      this.strokeGfx.beginPath();
      this.strokeGfx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) {
        this.strokeGfx.lineTo(pts[i], pts[i + 1]);
      }
      this.strokeGfx.closePath();
      this.strokeGfx.strokePath();
    }

    // Redraw highlight if active
    if (this.selectedProvince) {
      this.drawHighlight(this.selectedProvince);
    }
  }

  drawHighlight(provinceId) {
    this.highlightGfx.clear();
    const prov = this.mapData.provinces[provinceId];
    if (!prov) return;

    const pts = prov.p;
    if (pts.length < 6) return;

    // Bright highlight fill
    let color = 0xffffff;
    const owner = this.getProvinceOwner(provinceId);
    if (owner && this.countries[owner]) {
      color = this.brightenColor(this.hexToInt(this.countries[owner].color), 0.4);
    }

    this.highlightGfx.fillStyle(color, 0.8);
    this.highlightGfx.beginPath();
    this.highlightGfx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) {
      this.highlightGfx.lineTo(pts[i], pts[i + 1]);
    }
    this.highlightGfx.closePath();
    this.highlightGfx.fillPath();

    // Thick bright stroke
    this.highlightGfx.lineStyle(1, 0xffffff, 0.9);
    this.highlightGfx.beginPath();
    this.highlightGfx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) {
      this.highlightGfx.lineTo(pts[i], pts[i + 1]);
    }
    this.highlightGfx.closePath();
    this.highlightGfx.strokePath();
  }

  createSoldierTexts() {
    const provs = this.mapData.provinces;
    for (const id in provs) {
      const prov = provs[id];
      const text = this.add.text(prov.cx, prov.cy, '', {
        fontSize: '32px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
        resolution: 4
      });
      text.setOrigin(0.5, 0.5);
      text.setVisible(false);
      this.soldierTexts[id] = text;
    }
  }

  updateAllSoldierTexts() {
    if (!this.countries) return;
    for (const country in this.countries) {
      const data = this.countries[country];
      for (const province in data.ProvincesSoldiers) {
        this.updateSoldierText(province, data.ProvincesSoldiers[province]);
      }
    }
  }

  updateSoldierText(provinceId, count) {
    const text = this.soldierTexts[provinceId];
    if (!text) return;
    if (count === 0 || count === undefined) {
      text.setVisible(false);
    } else {
      text.setText(String(count));
      text.setVisible(this.selectedCountry !== null);
    }
  }

  showSoldierTextsForCountry() {
    if (!this.selectedCountry || !this.countries) return;
    // Show texts for own provinces and bordering provinces
    const ownProvinces = this.countries[this.selectedCountry].provinces;
    const visibleSet = new Set(ownProvinces);

    // Also show neighboring provinces
    for (const pid of ownProvinces) {
      const neighbors = this.getAdjacentProvinces(pid);
      for (const nid of neighbors) visibleSet.add(nid);
    }

    for (const id in this.soldierTexts) {
      const shouldShow = visibleSet.has(id);
      const text = this.soldierTexts[id];
      if (shouldShow) {
        const owner = this.getProvinceOwner(id);
        if (owner && this.countries[owner]) {
          const count = this.countries[owner].ProvincesSoldiers[id];
          if (count !== undefined && count > 0) {
            text.setText(String(count));
            text.setVisible(true);
            continue;
          }
        }
      }
      text.setVisible(false);
    }
  }

  createCapitalStars() {
    if (!this.countries) return;
    for (const country in this.countries) {
      const data = this.countries[country];
      const capitalId = data.capital;
      const prov = this.mapData.provinces[capitalId];
      if (!prov) continue;

      // Draw a small star at the capital
      const star = this.add.star(prov.cx, prov.cy, 5, 1.5, 3, 0xffff00);
      star.setStrokeStyle(0.3, 0x000000);
    }
  }

  // --- Camera ---

  setupCamera() {
    const cam = this.cameras.main;

    // Drag to pan
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && pointer.button === 0) {
        const dx = (pointer.x - pointer.prevPosition.x) / cam.zoom;
        const dy = (pointer.y - pointer.prevPosition.y) / cam.zoom;
        cam.scrollX -= dx;
        cam.scrollY -= dy;
      }
    });

    // Scroll to zoom
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Phaser.Math.Clamp(cam.zoom * zoomFactor, 0.3, 10);

      // Zoom toward pointer position
      const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
      cam.zoom = newZoom;
      const newWorldPoint = cam.getWorldPoint(pointer.x, pointer.y);
      cam.scrollX += worldPoint.x - newWorldPoint.x;
      cam.scrollY += worldPoint.y - newWorldPoint.y;
    });
  }

  // --- Input ---

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      if (pointer.button !== 0) return;
      this._dragStartX = pointer.x;
      this._dragStartY = pointer.y;
    });

    this.input.on('pointerup', (pointer) => {
      if (pointer.button !== 0) return;

      // Ignore if this was a drag (moved more than 5px)
      const dist = Phaser.Math.Distance.Between(
        this._dragStartX, this._dragStartY, pointer.x, pointer.y
      );
      if (dist > 5) return;

      // Convert screen to world coordinates
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const clickedId = this.getProvinceAtPoint(worldPoint.x, worldPoint.y);

      if (clickedId) {
        this.onProvinceClick(clickedId);
      }
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-R', () => {
      if (this.selectedCountry && this.selectedProvince) {
        const owner = this.getProvinceOwner(this.selectedProvince);
        if (owner === this.selectedCountry) this.toggleRecruit();
      }
    });

    this.input.keyboard.on('keydown-M', () => {
      if (this.selectedCountry && this.selectedProvince) {
        const owner = this.getProvinceOwner(this.selectedProvince);
        if (owner === this.selectedCountry) this.toggleMoveTo();
      }
    });
  }

  setupUICallbacks() {
    this.ui.setCallback('onRecruitClick', () => this.toggleRecruit());
    this.ui.setCallback('onMoveToClick', () => this.toggleMoveTo());
  }

  // --- Province click handling ---

  onProvinceClick(provinceId) {
    const clickedCountry = this.getProvinceOwner(provinceId);

    // Country selection phase
    if (!this.selectedCountry) {
      if (!clickedCountry) return;
      if (confirm(`Are you sure you want to select ${clickedCountry}?`)) {
        this.selectedCountry = clickedCountry;
        this.ui.hideCountrySelection();
        this.ui.showCountryFlag(this.countries[clickedCountry].code);
        this.ui.updateTreasury(Math.floor(this.countries[clickedCountry].treasury));
        this.showSoldierTextsForCountry();
        this.net.startSession(this.selectedCountry);
      }
      return;
    }

    // Handle move-to mode
    if (this.moveToMode && this.previousProvince) {
      const destCountry = clickedCountry;
      const sliderValue = this.ui.getSliderValue();

      if (destCountry === this.selectedCountry) {
        // Move soldiers within own territory
        this.moveSoldiers(this.selectedCountry, this.previousProvince, provinceId, sliderValue, destCountry, false);
        this.moveToMode = false;
        this.ui.hideSlider();
        this.previousProvince = provinceId;
      } else if (this.countries[this.selectedCountry].atWar.includes(destCountry)) {
        // Attack enemy province
        this.attackProvince(this.selectedCountry, this.selectedProvince, destCountry, provinceId, sliderValue, this.previousProvince);
      } else {
        this.ui.showModal('Cannot Attack', 'Declare war on a country to attack it.', 'OK');
        this.moveToMode = false;
        this.ui.hideSlider();
      }
      return;
    }

    // Normal province selection
    this.selectedProvince = provinceId;
    this.drawHighlight(provinceId);

    // Show info panel
    if (clickedCountry) {
      const isOwn = clickedCountry === this.selectedCountry;
      const isAtWar = this.countries[this.selectedCountry].atWar.includes(clickedCountry);
      this.ui.showInfoPanel(clickedCountry, this.countries[clickedCountry].code, isOwn, isAtWar);

      if (isOwn) {
        this.ui.showButtons(true, true);
      } else {
        this.ui.showButtons(false, false);
      }

      // Set war button callback
      this.ui.setCallback('onDeclareWarClick', () => {
        if (confirm(`Are you sure you want to declare war on ${clickedCountry}?`)) {
          this.net.declareWar(this.selectedCountry, clickedCountry);
        }
      });
    }

    if (!this.moveToMode) {
      this.previousProvince = provinceId;
    }
  }

  // --- Game actions ---

  toggleRecruit() {
    this.recruitMode = !this.recruitMode;
    this.moveToMode = false;

    if (this.recruitMode) {
      const maxRecruits = this.getMaxRecruits(this.selectedCountry);
      this.ui.showSlider(maxRecruits, maxRecruits);
    } else {
      // Confirm recruitment
      const recruits = this.ui.getSliderValue();
      const cost = this.getRecruitmentCost();

      if (recruits > 0 && this.countries[this.selectedCountry].treasury >= cost * recruits) {
        this.net.recruitSoldiers(recruits, this.selectedCountry, this.selectedProvince);
      } else if (recruits > 0) {
        this.ui.showModal('Insufficient Funds', 'Not enough money. Select fewer soldiers.', 'OK');
      }
      this.ui.hideSlider();
    }
  }

  toggleMoveTo() {
    this.moveToMode = !this.moveToMode;
    this.recruitMode = false;

    if (this.moveToMode && this.selectedProvince) {
      const soldiers = this.countries[this.selectedCountry].ProvincesSoldiers[this.selectedProvince] || 0;
      this.ui.showSlider(soldiers, soldiers);
    } else {
      this.ui.hideSlider();
    }
  }

  getRecruitmentCost() {
    this.recruitCost += 0.06;
    return this.recruitCost;
  }

  getMaxRecruits(country) {
    const treasury = this.countries[country].treasury;
    const cost = this.getRecruitmentCost();
    return Math.max(0, Math.floor(treasury / cost));
  }

  // --- Combat (client-side resolution for player actions) ---

  attackProvince(sourceCountry, sourceProvince, destCountry, destProvince, attackStrength, previousProv) {
    if (!this.countries[sourceCountry].atWar.includes(destCountry)) return;

    // Check adjacency
    if (!this.areAdjacent(previousProv, destProvince)) {
      this.ui.showModal('Invalid Attack', 'You can only attack bordering provinces.', 'OK');
      return;
    }

    const defenderStrength = this.countries[destCountry].ProvincesSoldiers[destProvince] || 0;

    if (attackStrength > defenderStrength) {
      this.resolveVictory(sourceCountry, destCountry, destProvince, attackStrength, sourceProvince, defenderStrength, previousProv);
    } else {
      this.resolveDefeat(sourceCountry, sourceProvince, destCountry, attackStrength, defenderStrength, previousProv);
    }

    this.moveToMode = false;
    this.ui.hideSlider();
    this.showSoldierTextsForCountry();
  }

  resolveVictory(sourceCountry, destCountry, province, attackStrength, sourceProvince, defenderStrength, previousProv) {
    // Transfer province
    const idx = this.countries[destCountry].provinces.indexOf(province);
    if (idx !== -1) this.countries[destCountry].provinces.splice(idx, 1);
    this.countries[sourceCountry].provinces.push(province);

    // Update soldiers
    delete this.countries[destCountry].ProvincesSoldiers[province];
    this.countries[sourceCountry].ProvincesSoldiers[province] = attackStrength - defenderStrength;

    // Deduct from source
    if (this.countries[sourceCountry].ProvincesSoldiers[previousProv] !== undefined) {
      this.countries[sourceCountry].ProvincesSoldiers[previousProv] = Math.max(0,
        this.countries[sourceCountry].ProvincesSoldiers[previousProv] - attackStrength);
    }

    this.redrawProvinces();
    this.updateAllSoldierTexts();

    // Check for country elimination
    if (this.countries[destCountry].provinces.length === 0) {
      if (destCountry === this.selectedCountry) {
        this.ui.showModal('Defeat!', 'Your country has collapsed! All provinces lost.', 'It was fun!');
      } else {
        this.ui.showModal(`${destCountry} Collapsed!`, `${destCountry} has lost all provinces.`, 'Good news!');
      }
    }
  }

  resolveDefeat(sourceCountry, sourceProvince, destCountry, attackStrength, defenderStrength, previousProv) {
    const attackerSoldiers = this.countries[sourceCountry].ProvincesSoldiers[previousProv] || 0;
    const defenderSoldiers = this.countries[destCountry].ProvincesSoldiers[sourceProvince] || 0;

    if (attackerSoldiers >= defenderSoldiers) {
      this.countries[sourceCountry].ProvincesSoldiers[previousProv] = attackerSoldiers - defenderSoldiers;
      this.countries[destCountry].ProvincesSoldiers[sourceProvince] = 0;
    } else {
      this.countries[destCountry].ProvincesSoldiers[sourceProvince] = defenderSoldiers - attackerSoldiers;
      this.countries[sourceCountry].ProvincesSoldiers[previousProv] = 0;
    }

    this.updateAllSoldierTexts();
  }

  moveSoldiers(sourceCountry, sourceProv, destProv, amount, destCountry, isAttacking) {
    if (!sourceCountry || !sourceProv || !destProv || amount <= 0) return;

    if (this.countries[sourceCountry].ProvincesSoldiers[sourceProv] !== undefined) {
      this.countries[sourceCountry].ProvincesSoldiers[sourceProv] = Math.max(0,
        this.countries[sourceCountry].ProvincesSoldiers[sourceProv] - amount);
    }

    if (!isAttacking) {
      if (this.countries[sourceCountry].ProvincesSoldiers[destProv] !== undefined) {
        this.countries[sourceCountry].ProvincesSoldiers[destProv] += amount;
      }
    }

    this.updateSoldierText(sourceProv, this.countries[sourceCountry].ProvincesSoldiers[sourceProv]);
    this.updateSoldierText(destProv, this.countries[sourceCountry].ProvincesSoldiers[destProv]);
  }

  // --- Helpers ---

  getProvinceOwner(provinceId) {
    if (!this.countries) return null;
    // First check mapdata (static assignment)
    const prov = this.mapData.provinces[provinceId];
    if (prov && prov.c) {
      // But verify against live countries data (ownership can change)
      for (const country in this.countries) {
        if (this.countries[country].provinces.includes(provinceId)) {
          return country;
        }
      }
      return prov.c;
    }
    // Fallback: search countries
    for (const country in this.countries) {
      if (this.countries[country].provinces.includes(provinceId)) {
        return country;
      }
    }
    return null;
  }

  getProvinceAtPoint(x, y) {
    // Check all province polygons for containment
    // Check smaller provinces first (more specific) by sorting by area estimate
    const ids = Object.keys(this.provincePolygons);
    for (const id of ids) {
      if (Phaser.Geom.Polygon.Contains(this.provincePolygons[id], x, y)) {
        return id;
      }
    }
    return null;
  }

  areAdjacent(prov1, prov2) {
    if (!prov1 || !prov2) return false;
    const d1 = this.mapData.provinces[prov1];
    const d2 = this.mapData.provinces[prov2];
    if (!d1 || !d2) return false;

    // Simple bbox overlap check (same as the backend bboxesIntersect)
    const margin = 2; // Small margin for adjacent provinces
    const ax = d1.cx - margin, ay = d1.cy - margin;
    const bx = d2.cx - margin, by = d2.cy - margin;

    // Compute bboxes from points
    let minX1=Infinity, minY1=Infinity, maxX1=-Infinity, maxY1=-Infinity;
    for (let i = 0; i < d1.p.length; i += 2) {
      minX1 = Math.min(minX1, d1.p[i]); minY1 = Math.min(minY1, d1.p[i+1]);
      maxX1 = Math.max(maxX1, d1.p[i]); maxY1 = Math.max(maxY1, d1.p[i+1]);
    }
    let minX2=Infinity, minY2=Infinity, maxX2=-Infinity, maxY2=-Infinity;
    for (let i = 0; i < d2.p.length; i += 2) {
      minX2 = Math.min(minX2, d2.p[i]); minY2 = Math.min(minY2, d2.p[i+1]);
      maxX2 = Math.max(maxX2, d2.p[i]); maxY2 = Math.max(maxY2, d2.p[i+1]);
    }

    return !(maxX1 < minX2 || maxX2 < minX1 || maxY1 < minY2 || maxY2 < minY1);
  }

  getAdjacentProvinces(provinceId) {
    const result = [];
    const provs = this.mapData.provinces;
    for (const otherId in provs) {
      if (otherId !== provinceId && this.areAdjacent(provinceId, otherId)) {
        result.push(otherId);
      }
    }
    return result;
  }

  hexToInt(hex) {
    if (!hex) return 0xececec;
    if (hex === 'grey') return 0x808080;
    if (hex === 'red') return 0xff0000;
    if (hex === 'green') return 0x008000;
    hex = hex.replace('#', '');
    return parseInt(hex, 16);
  }

  brightenColor(color, amount) {
    let r = (color >> 16) & 0xff;
    let g = (color >> 8) & 0xff;
    let b = color & 0xff;
    r = Math.min(255, r + Math.floor((255 - r) * amount));
    g = Math.min(255, g + Math.floor((255 - g) * amount));
    b = Math.min(255, b + Math.floor((255 - b) * amount));
    return (r << 16) | (g << 8) | b;
  }
}
