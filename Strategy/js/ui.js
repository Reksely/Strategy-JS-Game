// UIManager -- HTML overlay controller for the Phaser strategy game.
// Loaded as a plain <script>; exposes the global class UIManager.

class UIManager {
  constructor() {
    // ---- DOM references ----
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

    // ---- Callbacks (set externally via setCallback) ----
    this.onRecruitClick    = null;
    this.onMoveToClick     = null;
    this.onDeclareWarClick = null;
    this.onSliderChange    = null;

    // ---- Wire up permanent event listeners ----
    this._initListeners();
  }

  // ------------------------------------------------------------------
  // Internal: attach event listeners once
  // ------------------------------------------------------------------

  _initListeners() {
    // Recruit button
    this.recruitBtn.addEventListener('click', () => {
      if (this.onRecruitClick) this.onRecruitClick();
    });

    // Move-to button
    this.moveToBtn.addEventListener('click', () => {
      if (this.onMoveToClick) this.onMoveToClick();
    });

    // Slider input -- update display text and fire callback
    this.slider.addEventListener('input', () => {
      const val = parseInt(this.slider.value, 10);
      this.sliderValue.textContent = val;
      if (this.onSliderChange) this.onSliderChange(val);
    });
  }

  // ------------------------------------------------------------------
  // Callback registration
  // ------------------------------------------------------------------

  /**
   * Set a named callback.
   * @param {'onRecruitClick'|'onMoveToClick'|'onDeclareWarClick'|'onSliderChange'} name
   * @param {Function} fn
   */
  setCallback(name, fn) {
    if (this.hasOwnProperty(name) || name in this) {
      this[name] = fn;
    } else {
      console.warn('[UIManager] Unknown callback name:', name);
    }
  }

  // ------------------------------------------------------------------
  // Loading screen
  // ------------------------------------------------------------------

  hideLoading() {
    this.loadingScreen.style.display = 'none';
  }

  // ------------------------------------------------------------------
  // Country selection overlay
  // ------------------------------------------------------------------

  hideCountrySelection() {
    this.overlayBox.style.display = 'none';
  }

  // ------------------------------------------------------------------
  // Country flag (top-left badge)
  // ------------------------------------------------------------------

  showCountryFlag(countryCode) {
    const code = countryCode.toLowerCase();
    this.countryFlagImg.src = `https://flagpedia.net/data/flags/h60/${code}.png`;
    this.countryFlagBox.style.display = 'block';
  }

  // ------------------------------------------------------------------
  // Treasury
  // ------------------------------------------------------------------

  updateTreasury(amount) {
    this.moneyAmount.textContent = this.formatNumber(amount);
    if (this.moneyBox.style.display === 'none' || !this.moneyBox.style.display) {
      this.moneyBox.style.display = 'flex';
    }
  }

  // ------------------------------------------------------------------
  // Info panel (province / country info)
  // ------------------------------------------------------------------

  /**
   * Show the info panel for a selected province.
   * @param {string}  countryName  Display name of the country
   * @param {string}  countryCode  Two-letter ISO code (for flag)
   * @param {boolean} isOwn        True if the player owns this province
   * @param {boolean} isAtWar      True if the player is at war with this country
   */
  showInfoPanel(countryName, countryCode, isOwn, isAtWar) {
    // Flag
    const code = countryCode.toLowerCase();
    this.infoFlag.src = `https://flagpedia.net/data/flags/h60/${code}.png`;
    this.infoFlag.alt = countryName + ' flag';

    // Name
    this.infoName.textContent = countryName;

    // Action buttons
    this.infoButtons.innerHTML = '';

    if (!isOwn && !isAtWar) {
      const warBtn = document.createElement('button');
      warBtn.className = 'btn btn-danger btn-sm declare-war-btn';
      warBtn.textContent = 'Declare War';
      warBtn.addEventListener('click', () => {
        if (this.onDeclareWarClick) this.onDeclareWarClick(countryCode);
      });
      this.infoButtons.appendChild(warBtn);
    } else if (isAtWar) {
      const peaceBtn = document.createElement('button');
      peaceBtn.className = 'btn btn-warning btn-sm';
      peaceBtn.textContent = 'Peace Negotiation';
      peaceBtn.disabled = true;
      this.infoButtons.appendChild(peaceBtn);
    }

    this.infoContainer.style.display = 'block';
  }

  hideInfoPanel() {
    this.infoContainer.style.display = 'none';
  }

  // ------------------------------------------------------------------
  // Controls bar buttons
  // ------------------------------------------------------------------

  /**
   * Show or hide the recruit / move buttons individually.
   * @param {boolean} showRecruit
   * @param {boolean} showMove
   */
  showButtons(showRecruit, showMove) {
    this.recruitBtn.style.display = showRecruit ? 'inline-block' : 'none';
    this.moveToBtn.style.display  = showMove    ? 'inline-block' : 'none';
    this.controlsBar.style.display =
      (showRecruit || showMove) ? 'flex' : 'none';
  }

  hideButtons() {
    this.recruitBtn.style.display  = 'none';
    this.moveToBtn.style.display   = 'none';
    this.controlsBar.style.display = 'none';
  }

  // ------------------------------------------------------------------
  // Slider
  // ------------------------------------------------------------------

  /**
   * Show the slider with a given max and initial value.
   * @param {number} max
   * @param {number} currentValue
   */
  showSlider(max, currentValue) {
    this.slider.max   = max;
    this.slider.value = currentValue;
    this.sliderValue.textContent = currentValue;
    this.sliderContainer.style.display = 'block';
  }

  hideSlider() {
    this.sliderContainer.style.display = 'none';
    this.slider.value = 0;
    this.sliderValue.textContent = '0';
  }

  /** @returns {number} Current slider value as an integer. */
  getSliderValue() {
    return parseInt(this.slider.value, 10);
  }

  // ------------------------------------------------------------------
  // Bootstrap modal
  // ------------------------------------------------------------------

  /**
   * Populate and show the Bootstrap modal.
   * @param {string} title
   * @param {string} body       Inserted as text content of the modal body
   * @param {string} buttonText Text for the footer dismiss button
   */
  showModal(title, body, buttonText) {
    this.collapseModal.querySelector('.modal-title').textContent = title;

    const modalBody = this.collapseModal.querySelector('.modal-body');
    modalBody.textContent = body;

    const footerBtn = this.collapseModal.querySelector('.modal-footer .btn');
    if (footerBtn) footerBtn.textContent = buttonText;

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById('collapseModal')
    ).show();
  }

  // ------------------------------------------------------------------
  // Utility
  // ------------------------------------------------------------------

  /**
   * Format a number with space-separated thousands.
   * e.g. 14567 -> "14 567"
   * @param {number} num
   * @returns {string}
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
