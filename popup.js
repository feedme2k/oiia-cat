const toggleButton = document.querySelector("#toggle");
const statusText = document.querySelector("#status");
const volumeInput = document.querySelector("#volume");
const volumeValue = document.querySelector("#volumeValue");
const catCountInput = document.querySelector("#catCount");
const catCountValue = document.querySelector("#catCountValue");
const spinInput = document.querySelector("#spin");
const spinValue = document.querySelector("#spinValue");
const goRaveInput = document.querySelector("#goRave");
const raveInput = document.querySelector("#rave");
const raveValue = document.querySelector("#raveValue");

const defaultSettings = {
  volume: 85,
  catCount: 26,
  spin: 100,
  goRave: false,
  rave: 70
};

let settings = { ...defaultSettings };
let persistTimer = null;

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

function normalizeSettings(rawSettings) {
  return {
    volume: Math.min(100, Math.max(0, Number(rawSettings.volume ?? defaultSettings.volume))),
    catCount: Math.min(80, Math.max(1, Number(rawSettings.catCount ?? defaultSettings.catCount))),
    spin: Math.min(200, Math.max(0, Number(rawSettings.spin ?? defaultSettings.spin))),
    goRave: Boolean(rawSettings.goRave ?? defaultSettings.goRave),
    rave: Math.min(100, Math.max(0, Number(rawSettings.rave ?? defaultSettings.rave)))
  };
}

function renderSettings() {
  volumeInput.value = String(settings.volume);
  volumeValue.textContent = `${settings.volume}%`;
  catCountInput.value = String(settings.catCount);
  catCountValue.textContent = String(settings.catCount);
  spinInput.value = String(settings.spin);
  spinValue.textContent = `${settings.spin}%`;
  goRaveInput.checked = settings.goRave;
  raveInput.value = String(settings.rave);
  raveValue.textContent = `${settings.rave}%`;
}

async function loadSettings() {
  const storedSettings = await chrome.storage.sync.get(defaultSettings);
  settings = normalizeSettings(storedSettings);
  renderSettings();
}

async function persistSettings() {
  try {
    await chrome.storage.sync.set(settings);
  } catch {
    statusText.textContent = "Settings will save later";
  }
}

function schedulePersistSettings() {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(persistSettings, 800);
}

async function applySettings(nextSettings, shouldPersist = false) {
  settings = normalizeSettings(nextSettings);
  renderSettings();
  await sendSettingsToActiveTab();

  if (shouldPersist) {
    await persistSettings();
    return;
  }

  schedulePersistSettings();
}

async function sendSettingsToActiveTab() {
  const tab = await getActiveTab();

  if (!tab?.id) {
    return;
  }

  try {
    await ensureContentScript(tab.id);
    await chrome.tabs.sendMessage(tab.id, {
      type: "OIIA_SETTINGS",
      settings
    });
  } catch {
    // Some pages cannot receive extension scripts.
  }
}

async function sendToggle() {
  const tab = await getActiveTab();

  if (!tab?.id) {
    statusText.textContent = "No active tab";
    return;
  }

  try {
    await ensureContentScript(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "OIIA_TOGGLE",
      settings
    });
    const isRunning = Boolean(response?.running);
    toggleButton.textContent = isRunning ? "Stop" : "Start";
    statusText.textContent = isRunning ? "Cats are spinning" : "Stopped";
  } catch (error) {
    statusText.textContent = "Cannot run here";
  }
}

toggleButton.addEventListener("click", sendToggle);
volumeInput.addEventListener("input", () => {
  applySettings({
    ...settings,
    volume: Number(volumeInput.value)
  });
});
catCountInput.addEventListener("input", () => {
  applySettings({
    ...settings,
    catCount: Number(catCountInput.value)
  });
});
spinInput.addEventListener("input", () => {
  applySettings({
    ...settings,
    spin: Number(spinInput.value)
  });
});
goRaveInput.addEventListener("change", () => {
  applySettings({
    ...settings,
    goRave: goRaveInput.checked
  }, true);
});
raveInput.addEventListener("input", () => {
  applySettings({
    ...settings,
    rave: Number(raveInput.value)
  });
});
volumeInput.addEventListener("change", () => {
  applySettings({
    ...settings,
    volume: Number(volumeInput.value)
  }, true);
});
catCountInput.addEventListener("change", () => {
  applySettings({
    ...settings,
    catCount: Number(catCountInput.value)
  }, true);
});
spinInput.addEventListener("change", () => {
  applySettings({
    ...settings,
    spin: Number(spinInput.value)
  }, true);
});
raveInput.addEventListener("change", () => {
  applySettings({
    ...settings,
    rave: Number(raveInput.value)
  }, true);
});

loadSettings();
