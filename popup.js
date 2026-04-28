const toggleButton = document.querySelector("#toggle");
const statusText = document.querySelector("#status");

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

async function sendToggle() {
  const tab = await getActiveTab();

  if (!tab?.id) {
    statusText.textContent = "No active tab";
    return;
  }

  try {
    await ensureContentScript(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { type: "OIIA_TOGGLE" });
    const isRunning = Boolean(response?.running);
    toggleButton.textContent = isRunning ? "Stop" : "Start";
    statusText.textContent = isRunning ? "Cats are spinning" : "Stopped";
  } catch (error) {
    statusText.textContent = "Cannot run here";
  }
}

toggleButton.addEventListener("click", sendToggle);
