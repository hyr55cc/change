/**
 * محوّل العملات — Currency Converter
 * Vanilla JS · PWA · Arabic RTL
 * ============================================================
 */

'use strict';

/* ── Constants ────────────────────────────────────────────── */
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'BAM', 'SAR'];

const CURRENCY_META = {
  USD: { name: 'دولار أمريكي',   flag: '🇺🇸', symbol: '$'  },
  EUR: { name: 'يورو أوروبي',    flag: '🇪🇺', symbol: '€'  },
  GBP: { name: 'جنيه إسترليني',  flag: '🇬🇧', symbol: '£'  },
  BAM: { name: 'مارك بوسني',     flag: '🇧🇦', symbol: 'KM' },
  SAR: { name: 'ريال سعودي',     flag: '🇸🇦', symbol: 'SR' },
};

// Sensible fallback rates (USD base) for first-run / offline cold-start
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.9243,
  GBP: 0.7891,
  BAM: 1.8082,
  SAR: 3.75,
};

const STORAGE_KEYS = {
  rates:       'ccRatesData',
  lastUpdated: 'ccLastUpdated',
  baseUsed:    'ccBaseUsed',
};

// Frankfurter v2 API — returns array of { base, quote, rate, date }
const API_URL = 'https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR,GBP,BAM,SAR';

/* ── State ────────────────────────────────────────────────── */
let state = {
  rates: null,
  lastUpdated: null,
  dataSource: 'none',
  baseCurrency: 'USD',
  isOnline: navigator.onLine,
  isFetching: false,
};

/* ── DOM References ───────────────────────────────────────── */
const dom = {
  amountInput:    document.getElementById('amountInput'),
  fromCurrency:   document.getElementById('fromCurrency'),
  toCurrency:     document.getElementById('toCurrency'),
  convertBtn:     document.getElementById('convertBtn'),
  swapBtn:        document.getElementById('swapBtn'),
  refreshBtn:     document.getElementById('refreshBtn'),
  resultLabel:    document.getElementById('resultLabel'),
  resultValue:    document.querySelector('.result-value'),
  resultMeta:     document.getElementById('resultMeta'),
  rateRow:        document.getElementById('rateRow'),
  rateBadge:      document.getElementById('rateBadge'),
  ratesGrid:      document.getElementById('ratesGrid'),
  lastUpdated:    document.getElementById('lastUpdated'),
  dataSource:     document.getElementById('dataSource'),
  statusDot:      document.getElementById('statusDot'),
  statusLabel:    document.getElementById('statusLabel'),
  networkBanner:  document.getElementById('networkBanner'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  toastContainer: document.getElementById('toastContainer'),
  baseChips:      document.getElementById('baseChips'),
  refreshIcon:    document.getElementById('refreshIcon'),
  btnText:        document.querySelector('.btn-text'),
  btnSpinner:     document.querySelector('.btn-spinner'),
  btnIcon:        document.querySelector('.btn-icon'),
};

/* ── Utilities ────────────────────────────────────────────── */
function formatNumber(num, decimals = 4) {
  if (isNaN(num) || num === null) return '—';
  const d = num < 1 ? 4 : num < 100 ? 3 : 2;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.max(d, decimals > 0 ? 2 : 0),
  }).format(num);
}

function formatDateTime(isoString) {
  if (!isoString) return 'غير معروف';
  try {
    return new Intl.DateTimeFormat('ar-SA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/* ── Storage ──────────────────────────────────────────────── */
function saveRatesToStorage(rates, timestamp) {
  try {
    localStorage.setItem(STORAGE_KEYS.rates,       JSON.stringify(rates));
    localStorage.setItem(STORAGE_KEYS.lastUpdated, timestamp);
    localStorage.setItem(STORAGE_KEYS.baseUsed,    'USD');
  } catch (e) {
    console.warn('[Storage] Could not save rates:', e);
  }
}

function loadRatesFromStorage() {
  try {
    const raw  = localStorage.getItem(STORAGE_KEYS.rates);
    const time = localStorage.getItem(STORAGE_KEYS.lastUpdated);
    if (!raw) return null;
    return { rates: JSON.parse(raw), lastUpdated: time };
  } catch (e) {
    console.warn('[Storage] Could not load rates:', e);
    return null;
  }
}

/* ── API Fetch ────────────────────────────────────────────── */
async function fetchLiveRates(silent = false) {
  if (state.isFetching) return;
  state.isFetching = true;

  if (!silent) {
    dom.loadingOverlay.classList.remove('hidden');
  }
  dom.refreshBtn.classList.add('spinning');

  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Frankfurter v2 returns an array: [{ base, quote, rate, date }, ...]
    const rates = { USD: 1 };
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.quote && item.rate) rates[item.quote] = item.rate;
      });
    }

    // Ensure all supported currencies present (fallback for missing)
    SUPPORTED_CURRENCIES.forEach(c => {
      if (!(c in rates)) rates[c] = FALLBACK_RATES[c];
    });

    const timestamp = new Date().toISOString();
    state.rates       = rates;
    state.lastUpdated = timestamp;
    state.dataSource  = 'api';

    saveRatesToStorage(rates, timestamp);
    updateRatesUI();

    if (!silent) {
      showToast('تم تحديث أسعار الصرف بنجاح ✓', 'success');
    }
  } catch (err) {
    console.warn('[API] Fetch failed:', err.message);
    if (!silent) {
      showToast('تعذّر جلب الأسعار. يتم استخدام البيانات المخزّنة.', 'error');
    }
    if (!state.rates) initFallbackRates();
  } finally {
    state.isFetching = false;
    dom.loadingOverlay.classList.add('hidden');
    dom.refreshBtn.classList.remove('spinning');
  }
}

function initFallbackRates() {
  const cached = loadRatesFromStorage();
  if (cached) {
    state.rates       = cached.rates;
    state.lastUpdated = cached.lastUpdated;
    state.dataSource  = 'cache';
  } else {
    state.rates       = { ...FALLBACK_RATES };
    state.lastUpdated = null;
    state.dataSource  = 'fallback';
  }
  updateRatesUI();
}

/* ── Conversion ───────────────────────────────────────────── */
function convertAmount(amount, from, to, rates) {
  if (!rates || isNaN(amount) || amount === '') return null;
  const amtNum = parseFloat(amount);
  if (isNaN(amtNum) || amtNum < 0) return null;

  const rateFrom = rates[from];
  const rateTo   = rates[to];
  if (!rateFrom || !rateTo) return null;

  return (amtNum / rateFrom) * rateTo;
}

function handleConvert() {
  const amount = dom.amountInput.value.trim();
  const from   = dom.fromCurrency.value;
  const to     = dom.toCurrency.value;

  if (amount === '' || isNaN(parseFloat(amount))) {
    shakeElement(dom.amountInput);
    showToast('يرجى إدخال مبلغ صحيح', 'error');
    return;
  }

  if (from === to) {
    showToast('يرجى اختيار عملتين مختلفتين', 'info');
    return;
  }

  if (!state.rates) {
    showToast('الأسعار غير متاحة بعد، يرجى الانتظار…', 'info');
    return;
  }

  const result = convertAmount(parseFloat(amount), from, to, state.rates);
  if (result === null) {
    showToast('حدث خطأ أثناء التحويل', 'error');
    return;
  }

  dom.convertBtn.disabled = true;
  dom.btnText.textContent = 'جاري…';
  dom.btnSpinner.classList.remove('hidden');
  dom.btnIcon.style.display = 'none';

  setTimeout(() => {
    dom.convertBtn.disabled = false;
    dom.btnText.textContent = 'تحويل';
    dom.btnSpinner.classList.add('hidden');
    dom.btnIcon.style.display = '';
    renderResult(amount, from, to, result);
  }, 320);
}

function renderResult(amount, from, to, result) {
  const fromMeta = CURRENCY_META[from];
  const toMeta   = CURRENCY_META[to];

  dom.resultValue.classList.remove('animating');
  void dom.resultValue.offsetWidth;
  dom.resultValue.classList.add('animating');
  dom.resultValue.textContent = `${formatNumber(result)} ${to}`;

  dom.resultLabel.textContent = `${formatNumber(parseFloat(amount))} ${from} =`;
  dom.resultMeta.textContent  =
    `${fromMeta.flag} ${fromMeta.name} → ${toMeta.flag} ${toMeta.name}`;

  const rate = (state.rates[to] / state.rates[from]);
  dom.rateBadge.textContent = `1 ${from} = ${formatNumber(rate, 4)} ${to}`;
  dom.rateRow.hidden = false;
}

/* ── Rates Table UI ───────────────────────────────────────── */
function updateRatesUI() {
  renderRatesGrid(state.baseCurrency);
  renderFooter();
}

function renderRatesGrid(base) {
  if (!state.rates) {
    dom.ratesGrid.innerHTML =
      `<p style="grid-column:1/-1;text-align:center;color:var(--c-text-3);font-size:.85rem;padding:16px">
        لا تتوفر بيانات
      </p>`;
    return;
  }

  const baseRate = state.rates[base];
  const cards = SUPPORTED_CURRENCIES.map((c, i) => {
    const meta   = CURRENCY_META[c];
    const value  = c === base ? 1 : (state.rates[c] / baseRate);
    const isBase = c === base;

    return `
      <div class="rate-card ${isBase ? 'is-base' : ''}"
           data-currency="${c}"
           style="animation-delay: ${i * 60}ms"
           title="${meta.name}">
        <div class="rate-card-flag">${meta.flag}</div>
        <div class="rate-card-code">${c}</div>
        <div class="rate-card-name">${meta.name}</div>
        <div class="rate-card-value">${isBase ? '1.0000' : formatNumber(value, 4)}</div>
      </div>`;
  }).join('');

  dom.ratesGrid.innerHTML = cards;
}

function renderFooter() {
  if (state.lastUpdated) {
    dom.lastUpdated.textContent = `آخر تحديث: ${formatDateTime(state.lastUpdated)}`;
  } else {
    dom.lastUpdated.textContent = 'تم استخدام أسعار افتراضية';
  }

  const sourceMap = {
    api:      '🟢 مباشر',
    cache:    '🟡 مخزّن',
    fallback: '🔴 افتراضي',
    none:     '',
  };
  dom.dataSource.textContent = sourceMap[state.dataSource] || '';
}

/* ── Base currency chips ──────────────────────────────────── */
function initBaseChips() {
  dom.baseChips.querySelectorAll('.base-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const currency = chip.dataset.currency;
      state.baseCurrency = currency;

      dom.baseChips.querySelectorAll('.base-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-checked', 'true');

      renderRatesGrid(currency);
    });
  });
}

/* ── Online / Offline ─────────────────────────────────────── */
function updateNetworkStatus() {
  const online    = navigator.onLine;
  const wasOffline = !state.isOnline;
  state.isOnline  = online;

  dom.statusDot.className     = `status-dot ${online ? 'online' : 'offline'}`;
  dom.statusLabel.textContent = online ? 'متصل' : 'غير متصل';

  if (online) {
    dom.networkBanner.className   = 'network-banner online';
    dom.networkBanner.textContent = '🌐 تم استعادة الاتصال — جاري تحديث الأسعار…';
    dom.networkBanner.classList.remove('hidden');
    setTimeout(() => dom.networkBanner.classList.add('hidden'), 4000);

    if (wasOffline) {
      fetchLiveRates(true).then(() => {
        showToast('🔄 تم تحديث الأسعار تلقائياً عند استعادة الاتصال', 'success');
      });
    }
  } else {
    dom.networkBanner.className   = 'network-banner offline';
    dom.networkBanner.textContent = '⚡ لا يوجد اتصال — يتم استخدام الأسعار المخزّنة';
    dom.networkBanner.classList.remove('hidden');
  }
}

/* ── Swap currencies ──────────────────────────────────────── */
function swapCurrencies() {
  const from = dom.fromCurrency.value;
  const to   = dom.toCurrency.value;
  dom.fromCurrency.value = to;
  dom.toCurrency.value   = from;

  if (dom.amountInput.value) handleConvert();
}

/* ── Toast notifications ──────────────────────────────────── */
function showToast(message, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-msg">${message}</span>
  `;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

/* ── Shake animation ──────────────────────────────────────── */
function shakeElement(el) {
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'shake 0.35s ease';
  el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
}

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-6px)}
    40%{transform:translateX(6px)}
    60%{transform:translateX(-4px)}
    80%{transform:translateX(4px)}
  }`;
document.head.appendChild(shakeStyle);

/* ── Service Worker registration ─────────────────────────── */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err));
  }
}

/* ── Real-time conversion (as user types) ─────────────────── */
let convertDebounce = null;
function handleLiveConvert() {
  clearTimeout(convertDebounce);
  convertDebounce = setTimeout(() => {
    const amount = dom.amountInput.value.trim();
    const from   = dom.fromCurrency.value;
    const to     = dom.toCurrency.value;
    if (amount && from !== to && state.rates) {
      const result = convertAmount(parseFloat(amount), from, to, state.rates);
      if (result !== null) renderResult(amount, from, to, result);
    }
  }, 400);
}

/* ── Initialise ───────────────────────────────────────────── */
function init() {
  initFallbackRates();
  updateNetworkStatus();

  if (state.isOnline) {
    fetchLiveRates(false);
  }

  registerServiceWorker();

  dom.convertBtn.addEventListener('click', handleConvert);
  dom.swapBtn.addEventListener('click', swapCurrencies);
  dom.refreshBtn.addEventListener('click', () => {
    if (!state.isOnline) {
      showToast('لا يوجد اتصال بالإنترنت، يتم استخدام الأسعار المخزّنة', 'error');
      return;
    }
    fetchLiveRates(false);
  });

  dom.amountInput.addEventListener('input', handleLiveConvert);
  dom.fromCurrency.addEventListener('change', handleLiveConvert);
  dom.toCurrency.addEventListener('change', handleLiveConvert);

  dom.amountInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleConvert();
  });

  window.addEventListener('online',  updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  initBaseChips();

  dom.fromCurrency.value = 'USD';
  dom.toCurrency.value   = 'EUR';
}

document.addEventListener('DOMContentLoaded', init);
