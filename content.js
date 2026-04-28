(() => {
  const stateKey = "__oiiaSpinningCatState";

  if (window[stateKey]?.initialized) {
    return;
  }

  const state = {
    initialized: true,
    running: false,
    root: null,
    audio: null
  };

  window[stateKey] = state;

  const css = `
    #oiia-cat-root {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      pointer-events: none;
      overflow: hidden;
    }

    #oiia-cat-root iframe {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
      background: transparent;
      pointer-events: none;
    }
  `;

  function getRoot() {
    if (state.root) {
      return state.root;
    }

    const root = document.createElement("div");
    const style = document.createElement("style");
    const frame = document.createElement("iframe");

    root.id = "oiia-cat-root";
    style.textContent = css;
    frame.src = chrome.runtime.getURL("viewer.html");
    frame.allow = "autoplay";
    frame.title = "OIIA spinning cat overlay";

    root.append(style, frame);
    document.documentElement.append(root);
    state.root = root;

    return root;
  }

  function startMusic() {
    state.audio = new Audio(chrome.runtime.getURL("assets/W.mp3"));
    state.audio.loop = true;
    state.audio.volume = 0.85;
    state.audio.play().catch(() => {
      state.audio = null;
    });
  }

  function stopMusic() {
    if (!state.audio) {
      return;
    }

    state.audio.pause();
    state.audio.currentTime = 0;
    state.audio = null;
  }

  function start() {
    if (state.running) {
      return true;
    }

    state.running = true;
    getRoot();
    startMusic();

    return true;
  }

  function stop() {
    state.running = false;
    stopMusic();
    state.root?.remove();
    state.root = null;

    return false;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "OIIA_TOGGLE") {
      return false;
    }

    const running = state.running ? stop() : start();
    sendResponse({ running });
    return true;
  });
})();
