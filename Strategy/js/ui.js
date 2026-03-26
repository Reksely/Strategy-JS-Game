class UIManager {
  constructor() {
    this.loadingScreen   = document.getElementById('loading-screen');
    this.overlayBox      = document.getElementById('overlay-box');
    this.countryFlagBox  = document.getElementById('country-flag-box');
    this.countryFlagImg  = document.getElementById('country-flag');
    this.moneyBox        = document.getElementById('money-box');
    this.moneyAmount     = document.getElementById('money-amount');
    this.infoContainer   = document.getElementById('info-container');
    this.infoFlag        = document.getElementById('info-flag');
    this.infoName        = document.getElementById('info-name');
    this.infoButtons     = document.getElementById('info-buttons');
    this.controlsBar     = document.getElementById('controls-bar');
    this.recruitBtn      = document.getElementById('btn-recruit');
    this.moveToBtn       = document.getElementById('btn-move');
    this.sliderContainer = document.getElementById('slider-container');
    this.slider          = document.getElementById('slider');
    this.sliderValue     = document.querySelector('#slider-container .slider-value');
    this.collapseModal   = document.getElementById('collapseModal');

    this.onRecruitClick    = null;
    this.onMoveToClick     = null;
    this.onDeclareWarClick = null;
    this.onSliderChange    = null;

    this._initListeners();
  }

  _initListeners() {
    this.recruitBtn.addEventListener('click', () => { if (this.onRecruitClick) this.onRecruitClick(); });
    this.moveToBtn.addEventListener('click', () => { if (this.onMoveToClick) this.onMoveToClick(); });
    this.slider.addEventListener('input', () => {
      const val = parseInt(this.slider.value, 10);
      this.sliderValue.textContent = val;
      if (this.onSliderChange) this.onSliderChange(val);
    });
  }

  setCallback(name, fn) { this[name] = fn; }

  hideLoading() {
    this.loadingScreen.style.opacity = '0';
    this.loadingScreen.style.transition = 'opacity 0.4s ease';
    setTimeout(() => { this.loadingScreen.style.display = 'none'; }, 400);
  }

  hideCountrySelection() {
    this.overlayBox.style.opacity = '0';
    this.overlayBox.style.transition = 'opacity 0.3s ease';
    setTimeout(() => { this.overlayBox.style.display = 'none'; }, 300);
  }

  showCountryFlag(code) {
    this.countryFlagImg.src = `https://flagpedia.net/data/flags/h60/${code.toLowerCase()}.png`;
    this.countryFlagBox.style.display = 'block';
  }

  updateTreasury(amount) {
    this.moneyAmount.textContent = this.formatNumber(amount);
    if (this.moneyBox.style.display !== 'flex') this.moneyBox.style.display = 'flex';
  }

  showInfoPanel(countryName, countryCode, isOwn, isAtWar) {
    this.infoFlag.src = `https://flagpedia.net/data/flags/h60/${countryCode.toLowerCase()}.png`;
    this.infoName.textContent = countryName;
    this.infoButtons.innerHTML = '';

    if (!isOwn && !isAtWar) {
      const btn = document.createElement('button');
      btn.className = 'game-btn game-btn-war';
      btn.textContent = 'Declare War';
      btn.addEventListener('click', () => { if (this.onDeclareWarClick) this.onDeclareWarClick(); });
      this.infoButtons.appendChild(btn);
    } else if (isAtWar) {
      const btn = document.createElement('button');
      btn.className = 'game-btn game-btn-peace';
      btn.textContent = 'At War';
      this.infoButtons.appendChild(btn);
    }

    this.infoContainer.style.display = 'block';
  }

  hideInfoPanel() { this.infoContainer.style.display = 'none'; }

  showButtons(showRecruit, showMove) {
    this.recruitBtn.style.display = showRecruit ? 'inline-block' : 'none';
    this.moveToBtn.style.display  = showMove    ? 'inline-block' : 'none';
    this.controlsBar.style.display = (showRecruit || showMove) ? 'flex' : 'none';
  }

  hideButtons() {
    this.recruitBtn.style.display = 'none';
    this.moveToBtn.style.display  = 'none';
    this.controlsBar.style.display = 'none';
  }

  showSlider(max, currentValue) {
    this.slider.max = max;
    this.slider.value = currentValue;
    this.sliderValue.textContent = currentValue;
    this.sliderContainer.style.display = 'block';
  }

  hideSlider() {
    this.sliderContainer.style.display = 'none';
    this.slider.value = 0;
    this.sliderValue.textContent = '0';
  }

  getSliderValue() { return parseInt(this.slider.value, 10); }

  showModal(title, body, buttonText) {
    this.collapseModal.querySelector('.modal-title').textContent = title;
    this.collapseModal.querySelector('.modal-body').textContent = body;
    const btn = this.collapseModal.querySelector('.modal-footer .btn');
    if (btn) btn.textContent = buttonText;
    bootstrap.Modal.getOrCreateInstance(this.collapseModal).show();
  }

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
