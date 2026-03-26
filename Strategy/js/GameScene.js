class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.mapData = null;
    this.countries = null;
    this.selectedCountry = null;
    this.selectedProvince = null;
    this.previousProvince = null;
    this.hoveredProvince = null;
    this.moveToMode = false;
    this.recruitMode = false;
    this.recruitCost = 0.25;

    // Graphics layers
    this.fillGfx = null;
    this.strokeGfx = null;
    this.hoverGfx = null;
    this.selectGfx = null;

    // Province polygon cache
    this.provincePolygons = {};
    this.soldierTexts = {};
    this.net = null;
    this.ui = null;

    // Smooth camera state
    this._targetZoom = 1;
    this._lastZoom = -1;
    this._isDragging = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
  }

  preload() {}

  create() {
    this.mapData = MAP_DATA;
    this.ui = new UIManager();
    this.net = new NetworkManager();

    // Graphics layers in draw order
    this.fillGfx = this.add.graphics();
    this.strokeGfx = this.add.graphics();
    this.hoverGfx = this.add.graphics();
    this.selectGfx = this.add.graphics();

    const vb = this.mapData.viewBox;
    this.cameras.main.setBounds(vb.x - 100, vb.y - 100, vb.width + 200, vb.height + 200);

    this.net.connect().then(() => {
      this.net.on('sessionInit', (msg) => this.onSessionInit(msg));
      this.net.on('startSession', (msg) => this.onStartSession(msg));
      this.net.on('constantGameChange', (msg) => this.onGameChange(msg));
      this.net.on('warChange', (msg) => this.onGameChange(msg));
      this.net.on('recruitSoldiersByUser', (msg) => this.onRecruit(msg));
      this.net.on('declareWar', (msg) => this.onDeclareWar(msg));
      this.net.on('playerAttack', (msg) => this.onGameChange(msg));
    });

    this.setupCamera();
    this.setupInput();
    this.setupUICallbacks();

    this.time.delayedCall(600, () => this.ui.hideLoading());
  }

  update() {
    const cam = this.cameras.main;

    // Smooth zoom lerp centered on pointer
    if (Math.abs(cam.zoom - this._targetZoom) > 0.001 && this._zoomPointerScreen) {
      // Get world point under pointer BEFORE zoom change
      const wp = cam.getWorldPoint(this._zoomPointerScreen.x, this._zoomPointerScreen.y);

      cam.zoom = Phaser.Math.Linear(cam.zoom, this._targetZoom, 0.12);

      // Get world point under pointer AFTER zoom change
      const wp2 = cam.getWorldPoint(this._zoomPointerScreen.x, this._zoomPointerScreen.y);

      // Shift camera so the same world point stays under the pointer
      cam.scrollX += wp.x - wp2.x;
      cam.scrollY += wp.y - wp2.y;
    }

    // Scale text to constant screen size
    const zoom = cam.zoom;
    if (Math.abs(zoom - this._lastZoom) > 0.002) {
      this._lastZoom = zoom;
      const s = 0.45 / zoom;
      for (const id in this.soldierTexts) {
        this.soldierTexts[id].setScale(s);
      }
    }

    // Hover detection
    const pointer = this.input.activePointer;
    if (!pointer.isDown) {
      const wp = cam.getWorldPoint(pointer.x, pointer.y);
      const hov = this.getProvinceAtPoint(wp.x, wp.y);
      if (hov !== this.hoveredProvince) {
        this.hoveredProvince = hov;
        this.drawHover(hov);
      }
    }
  }

  // ======================== NETWORK HANDLERS ========================

  onSessionInit(msg) {
    this.countries = JSON.parse(msg.sessionInfo).countries;
    this.buildPolygons();
    this.drawAllProvinces();
    this.createSoldierTexts();
    this.createCapitalStars();

    const vb = this.mapData.viewBox;
    this._targetZoom = Math.min(this.scale.width / vb.width, this.scale.height / vb.height) * 0.95;
    this.cameras.main.zoom = this._targetZoom;
    this.cameras.main.centerOn(vb.x + vb.width / 2, vb.y + vb.height / 2);
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
    if (this.selectedCountry) this.ui.updateTreasury(Math.floor(msg.updatedTreasury));
    if (this.selectedProvince && msg.updatedSoldiersCount !== undefined) {
      this.updateSoldierText(this.selectedProvince, msg.updatedSoldiersCount);
    }
  }

  onDeclareWar(msg) {
    this.countries = JSON.parse(msg.sessionInfo).countries;
    this.redrawProvinces();
    this.updateAllSoldierTexts();
  }

  // ======================== DRAWING ========================

  _drawPoly(gfx, pts) {
    gfx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) gfx.lineTo(pts[i], pts[i + 1]);
    gfx.closePath();
  }

  buildPolygons() {
    const provs = this.mapData.provinces;
    for (const id in provs) {
      const pts = provs[id].p;
      if (pts.length < 6) continue;
      const gp = [];
      for (let i = 0; i < pts.length; i += 2) gp.push(new Phaser.Geom.Point(pts[i], pts[i + 1]));
      this.provincePolygons[id] = new Phaser.Geom.Polygon(gp);
    }
  }

  drawAllProvinces() {
    this.fillGfx.clear();
    this.strokeGfx.clear();
    const provs = this.mapData.provinces;

    // Fills
    for (const id in provs) {
      const pts = provs[id].p;
      if (pts.length < 6) continue;
      const owner = this.getProvinceOwner(id);
      const color = (owner && this.countries[owner]) ? this.hexToInt(this.countries[owner].color) : 0xd0d0d0;

      this.fillGfx.fillStyle(color, 1);
      this.fillGfx.beginPath();
      this._drawPoly(this.fillGfx, pts);
      this.fillGfx.fillPath();
    }

    // Province borders (thin)
    this.strokeGfx.lineStyle(0.4, 0x1a1a1a, 0.5);
    for (const id in provs) {
      const pts = provs[id].p;
      if (pts.length < 6) continue;
      this.strokeGfx.beginPath();
      this._drawPoly(this.strokeGfx, pts);
      this.strokeGfx.strokePath();
    }

    // Country borders (thicker) - draw where neighboring provinces have different owners
    this.strokeGfx.lineStyle(1.0, 0x000000, 0.9);
    for (const id in provs) {
      const pts = provs[id].p;
      if (pts.length < 6) continue;
      const owner = this.getProvinceOwner(id);
      // Check if this province borders a different country
      const neighbors = this.getAdjacentProvinces(id);
      let isBorder = false;
      for (const nid of neighbors) {
        if (this.getProvinceOwner(nid) !== owner) { isBorder = true; break; }
      }
      if (isBorder) {
        this.strokeGfx.beginPath();
        this._drawPoly(this.strokeGfx, pts);
        this.strokeGfx.strokePath();
      }
    }
  }

  redrawProvinces() {
    this.drawAllProvinces();
    if (this.selectedProvince) this.drawSelection(this.selectedProvince);
  }

  drawHover(provinceId) {
    this.hoverGfx.clear();
    if (!provinceId || provinceId === this.selectedProvince) return;
    const prov = this.mapData.provinces[provinceId];
    if (!prov || prov.p.length < 6) return;

    const owner = this.getProvinceOwner(provinceId);
    const baseColor = (owner && this.countries[owner]) ? this.hexToInt(this.countries[owner].color) : 0xd0d0d0;
    const bright = this.brightenColor(baseColor, 0.25);

    this.hoverGfx.fillStyle(bright, 0.6);
    this.hoverGfx.beginPath();
    this._drawPoly(this.hoverGfx, prov.p);
    this.hoverGfx.fillPath();

    this.hoverGfx.lineStyle(0.8, 0xffffff, 0.5);
    this.hoverGfx.beginPath();
    this._drawPoly(this.hoverGfx, prov.p);
    this.hoverGfx.strokePath();
  }

  drawSelection(provinceId) {
    this.selectGfx.clear();
    if (!provinceId) return;
    const prov = this.mapData.provinces[provinceId];
    if (!prov || prov.p.length < 6) return;

    const owner = this.getProvinceOwner(provinceId);
    const baseColor = (owner && this.countries[owner]) ? this.hexToInt(this.countries[owner].color) : 0xd0d0d0;
    const bright = this.brightenColor(baseColor, 0.45);

    // Glow outline (wide, semi-transparent)
    this.selectGfx.lineStyle(2.5, 0xffffff, 0.35);
    this.selectGfx.beginPath();
    this._drawPoly(this.selectGfx, prov.p);
    this.selectGfx.strokePath();

    // Bright fill
    this.selectGfx.fillStyle(bright, 0.7);
    this.selectGfx.beginPath();
    this._drawPoly(this.selectGfx, prov.p);
    this.selectGfx.fillPath();

    // Sharp inner border
    this.selectGfx.lineStyle(1.0, 0xffffff, 0.8);
    this.selectGfx.beginPath();
    this._drawPoly(this.selectGfx, prov.p);
    this.selectGfx.strokePath();
  }

  // ======================== TEXT & ICONS ========================

  createSoldierTexts() {
    for (const id in this.mapData.provinces) {
      const prov = this.mapData.provinces[id];
      const text = this.add.text(prov.cx, prov.cy, '', {
        fontSize: '32px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        resolution: 3
      });
      text.setOrigin(0.5, 0.5);
      text.setVisible(false);
      text.setDepth(10);
      this.soldierTexts[id] = text;
    }
  }

  updateAllSoldierTexts() {
    if (!this.countries) return;
    if (this.selectedCountry) this.showSoldierTextsForCountry();
    else {
      for (const id in this.soldierTexts) this.soldierTexts[id].setVisible(false);
    }
  }

  updateSoldierText(provinceId, count) {
    const text = this.soldierTexts[provinceId];
    if (!text) return;
    if (!count || count === 0) { text.setVisible(false); return; }
    text.setText(String(count));
    // Only show if in the visible set (own + bordering)
    text.setVisible(this._visibleProvinces ? this._visibleProvinces.has(provinceId) : false);
  }

  showSoldierTextsForCountry() {
    if (!this.selectedCountry || !this.countries) return;
    const own = this.countries[this.selectedCountry].provinces;
    const visible = new Set(own);

    // Add provinces that directly border your country
    for (const pid of own) {
      for (const nid of this.getAdjacentProvinces(pid)) {
        if (this.getProvinceOwner(nid) !== this.selectedCountry) {
          visible.add(nid);
        }
      }
    }

    this._visibleProvinces = visible;

    for (const id in this.soldierTexts) {
      const t = this.soldierTexts[id];
      if (!visible.has(id)) { t.setVisible(false); continue; }
      const owner = this.getProvinceOwner(id);
      if (owner && this.countries[owner]) {
        const c = this.countries[owner].ProvincesSoldiers[id];
        if (c && c > 0) { t.setText(String(c)); t.setVisible(true); continue; }
      }
      t.setVisible(false);
    }
  }

  createCapitalStars() {
    if (!this.countries) return;
    for (const country in this.countries) {
      const data = this.countries[country];
      const prov = this.mapData.provinces[data.capital];
      if (!prov) continue;
      const star = this.add.star(prov.cx, prov.cy, 5, 1.2, 2.8, 0xffd700);
      star.setStrokeStyle(0.4, 0x000000);
      star.setDepth(11);
    }
  }

  // ======================== CAMERA ========================

  setupCamera() {
    const cam = this.cameras.main;

    // Drag to pan
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      // Only drag with left button or middle button
      if (pointer.button !== 0 && pointer.button !== 1) return;
      cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom;
      cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom;
    });

    // Scroll-to-zoom: store target + pointer world position for centering
    this.input.on('wheel', (pointer, _go, _dx, deltaY) => {
      const factor = deltaY > 0 ? 0.92 : 1.08;
      this._targetZoom = Phaser.Math.Clamp(this._targetZoom * factor, 0.4, 8);
      // Remember where the pointer is in world space so update() can zoom toward it
      this._zoomPointerWorld = cam.getWorldPoint(pointer.x, pointer.y);
      this._zoomPointerScreen = { x: pointer.x, y: pointer.y };
    });
  }

  // ======================== INPUT ========================

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      if (pointer.button !== 0) return;
      this._dragStartX = pointer.x;
      this._dragStartY = pointer.y;
      this._isDragging = false;
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown || pointer.button !== 0) return;
      const dist = Phaser.Math.Distance.Between(this._dragStartX, this._dragStartY, pointer.x, pointer.y);
      if (dist > 6) this._isDragging = true;
    });

    this.input.on('pointerup', (pointer) => {
      if (pointer.button !== 0 || this._isDragging) return;
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const clicked = this.getProvinceAtPoint(wp.x, wp.y);
      if (clicked) this.onProvinceClick(clicked);
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-R', () => {
      if (this.selectedCountry && this.selectedProvince &&
          this.getProvinceOwner(this.selectedProvince) === this.selectedCountry) {
        this.toggleRecruit();
      }
    });
    this.input.keyboard.on('keydown-M', () => {
      if (this.selectedCountry && this.selectedProvince &&
          this.getProvinceOwner(this.selectedProvince) === this.selectedCountry) {
        this.toggleMoveTo();
      }
    });
  }

  setupUICallbacks() {
    this.ui.setCallback('onRecruitClick', () => this.toggleRecruit());
    this.ui.setCallback('onMoveToClick', () => this.toggleMoveTo());
  }

  // ======================== PROVINCE CLICK ========================

  onProvinceClick(provinceId) {
    const clickedCountry = this.getProvinceOwner(provinceId);

    // Country selection phase
    if (!this.selectedCountry) {
      if (!clickedCountry) return;
      if (confirm(`Select ${clickedCountry}?`)) {
        this.selectedCountry = clickedCountry;
        this.ui.hideCountrySelection();
        this.ui.showCountryFlag(this.countries[clickedCountry].code);
        this.ui.updateTreasury(Math.floor(this.countries[clickedCountry].treasury));
        this.showSoldierTextsForCountry();
        this.net.startSession(this.selectedCountry);
      }
      return;
    }

    // Move-to / attack mode
    if (this.moveToMode && this.previousProvince) {
      const slider = this.ui.getSliderValue();
      if (clickedCountry === this.selectedCountry) {
        this.moveSoldiers(this.selectedCountry, this.previousProvince, provinceId, slider, clickedCountry, false);
        this.moveToMode = false;
        this.ui.hideSlider();
        this.previousProvince = provinceId;
      } else if (this.countries[this.selectedCountry].atWar.includes(clickedCountry)) {
        this.attackProvince(this.selectedCountry, this.selectedProvince, clickedCountry, provinceId, slider, this.previousProvince);
      } else {
        this.ui.showModal('Cannot Attack', 'Declare war on a country to attack it.', 'OK');
        this.moveToMode = false;
        this.ui.hideSlider();
      }
      return;
    }

    // Normal selection
    this.selectedProvince = provinceId;
    this.drawSelection(provinceId);

    if (clickedCountry) {
      const isOwn = clickedCountry === this.selectedCountry;
      const isAtWar = this.countries[this.selectedCountry].atWar.includes(clickedCountry);
      this.ui.showInfoPanel(clickedCountry, this.countries[clickedCountry].code, isOwn, isAtWar);
      this.ui.showButtons(isOwn, isOwn);

      this.ui.setCallback('onDeclareWarClick', () => {
        if (confirm(`Declare war on ${clickedCountry}?`)) {
          this.net.declareWar(this.selectedCountry, clickedCountry);
        }
      });
    }

    if (!this.moveToMode) this.previousProvince = provinceId;
  }

  // ======================== GAME ACTIONS ========================

  toggleRecruit() {
    this.recruitMode = !this.recruitMode;
    this.moveToMode = false;
    if (this.recruitMode) {
      this.ui.showSlider(this.getMaxRecruits(this.selectedCountry), this.getMaxRecruits(this.selectedCountry));
    } else {
      const recruits = this.ui.getSliderValue();
      const cost = this.getRecruitmentCost();
      if (recruits > 0 && this.countries[this.selectedCountry].treasury >= cost * recruits) {
        this.net.recruitSoldiers(recruits, this.selectedCountry, this.selectedProvince);
      } else if (recruits > 0) {
        this.ui.showModal('Insufficient Funds', 'Not enough money to recruit.', 'OK');
      }
      this.ui.hideSlider();
    }
  }

  toggleMoveTo() {
    this.moveToMode = !this.moveToMode;
    this.recruitMode = false;
    if (this.moveToMode && this.selectedProvince) {
      const s = this.countries[this.selectedCountry].ProvincesSoldiers[this.selectedProvince] || 0;
      this.ui.showSlider(s, s);
    } else {
      this.ui.hideSlider();
    }
  }

  getRecruitmentCost() { this.recruitCost += 0.06; return this.recruitCost; }

  getMaxRecruits(country) {
    return Math.max(0, Math.floor(this.countries[country].treasury / this.getRecruitmentCost()));
  }

  // ======================== COMBAT ========================

  attackProvince(srcCountry, srcProv, dstCountry, dstProv, strength, prevProv) {
    if (!this.countries[srcCountry].atWar.includes(dstCountry)) return;
    if (!this.areAdjacent(prevProv, dstProv)) {
      this.ui.showModal('Invalid Attack', 'You can only attack bordering provinces.', 'OK');
      return;
    }
    // Send to server - server resolves and sends back updated state
    this.net.playerAttack(srcCountry, srcProv, dstCountry, dstProv, strength, prevProv);
    this.moveToMode = false;
    this.ui.hideSlider();
  }

  moveSoldiers(src, from, to, amount, dst, isAttack) {
    if (!src || !from || !to || amount <= 0) return;
    if (this.countries[src].ProvincesSoldiers[from] !== undefined)
      this.countries[src].ProvincesSoldiers[from] = Math.max(0, this.countries[src].ProvincesSoldiers[from] - amount);
    if (!isAttack && this.countries[src].ProvincesSoldiers[to] !== undefined)
      this.countries[src].ProvincesSoldiers[to] += amount;
    this.updateSoldierText(from, this.countries[src].ProvincesSoldiers[from]);
    this.updateSoldierText(to, this.countries[src].ProvincesSoldiers[to]);

    // Sync to server
    this.net.send('moveSoldiers', {
      country: src, fromProvince: from, toProvince: to, amount: amount
    });
  }

  // ======================== HELPERS ========================

  getProvinceOwner(id) {
    if (!this.countries) return null;
    for (const c in this.countries) {
      if (this.countries[c].provinces.includes(id)) return c;
    }
    const p = this.mapData.provinces[id];
    return p ? p.c : null;
  }

  getProvinceAtPoint(x, y) {
    for (const id in this.provincePolygons) {
      if (Phaser.Geom.Polygon.Contains(this.provincePolygons[id], x, y)) return id;
    }
    return null;
  }

  areAdjacent(a, b) {
    if (!a || !b) return false;
    const d1 = this.mapData.provinces[a], d2 = this.mapData.provinces[b];
    if (!d1 || !d2) return false;
    let x1=Infinity,y1=Infinity,X1=-Infinity,Y1=-Infinity;
    for (let i=0;i<d1.p.length;i+=2){x1=Math.min(x1,d1.p[i]);y1=Math.min(y1,d1.p[i+1]);X1=Math.max(X1,d1.p[i]);Y1=Math.max(Y1,d1.p[i+1]);}
    let x2=Infinity,y2=Infinity,X2=-Infinity,Y2=-Infinity;
    for (let i=0;i<d2.p.length;i+=2){x2=Math.min(x2,d2.p[i]);y2=Math.min(y2,d2.p[i+1]);X2=Math.max(X2,d2.p[i]);Y2=Math.max(Y2,d2.p[i+1]);}
    return !(X1<x2||X2<x1||Y1<y2||Y2<y1);
  }

  getAdjacentProvinces(id) {
    const r = [];
    for (const o in this.mapData.provinces) {
      if (o !== id && this.areAdjacent(id, o)) r.push(o);
    }
    return r;
  }

  hexToInt(hex) {
    if (!hex) return 0xd0d0d0;
    if (hex === 'grey') return 0x808080;
    if (hex === 'red') return 0xff0000;
    if (hex === 'green') return 0x008000;
    return parseInt(hex.replace('#', ''), 16);
  }

  brightenColor(c, a) {
    let r=(c>>16)&0xff, g=(c>>8)&0xff, b=c&0xff;
    r=Math.min(255,r+Math.floor((255-r)*a));
    g=Math.min(255,g+Math.floor((255-g)*a));
    b=Math.min(255,b+Math.floor((255-b)*a));
    return (r<<16)|(g<<8)|b;
  }
}
