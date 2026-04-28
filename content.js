(() => {
  const stateKey = "__oiiaSpinningCatState";

  if (window[stateKey]?.initialized) {
    return;
  }

  const state = {
    initialized: true,
    running: false,
    root: null,
    frame: null,
    audio: null,
    audioContext: null,
    audioSource: null,
    analyser: null,
    analyserData: null,
    analyserWaveData: null,
    analyserFrame: null,
    lastBeatTime: 0,
    averageEnergy: 0,
    settings: {
      volume: 85,
      catCount: 26,
      spin: 100,
      goRave: false,
      rave: 70
    }
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
    state.frame = frame;

    frame.addEventListener("load", () => {
      sendSettingsToViewer();
    });

    return root;
  }

  function normalizeSettings(rawSettings = {}) {
    return {
      volume: Math.min(100, Math.max(0, Number(rawSettings.volume ?? state.settings.volume))),
      catCount: Math.min(80, Math.max(1, Number(rawSettings.catCount ?? state.settings.catCount))),
      spin: Math.min(200, Math.max(0, Number(rawSettings.spin ?? state.settings.spin))),
      goRave: Boolean(rawSettings.goRave ?? state.settings.goRave),
      rave: Math.min(100, Math.max(0, Number(rawSettings.rave ?? state.settings.rave)))
    };
  }

  function sendSettingsToViewer() {
    state.frame?.contentWindow?.postMessage({
      type: "OIIA_SETTINGS",
      settings: state.settings
    }, "*");
  }

  function sendAudioSignalToViewer(signal) {
    state.frame?.contentWindow?.postMessage({
      type: "OIIA_AUDIO_SIGNAL",
      signal
    }, "*");
  }

  function applySettings(rawSettings) {
    state.settings = normalizeSettings(rawSettings);

    if (state.audio) {
      state.audio.volume = state.settings.volume / 100;
    }

    sendSettingsToViewer();
  }

  function startMusic() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    state.audio = new Audio(chrome.runtime.getURL("assets/W.mp3"));
    state.audio.loop = true;
    state.audio.volume = state.settings.volume / 100;

    if (AudioContext) {
      state.audioContext = new AudioContext();
      state.audioSource = state.audioContext.createMediaElementSource(state.audio);
      state.analyser = state.audioContext.createAnalyser();
      state.analyser.fftSize = 1024;
      state.analyser.smoothingTimeConstant = 0.18;
      state.analyserData = new Uint8Array(state.analyser.frequencyBinCount);
      state.analyserWaveData = new Uint8Array(state.analyser.fftSize);

      state.audioSource.connect(state.analyser);
      state.analyser.connect(state.audioContext.destination);
      state.audioContext.resume();
      startAudioAnalysis();
    }

    state.audio.play().catch(() => {
      state.audio = null;
      stopMusic();
    });
  }

  function startAudioAnalysis() {
    const analyze = () => {
      if (!state.running || !state.analyser || !state.analyserData || !state.analyserWaveData) {
        return;
      }

      state.analyser.getByteFrequencyData(state.analyserData);
      state.analyser.getByteTimeDomainData(state.analyserWaveData);

      let bassSum = 0;
      let midSum = 0;
      let totalSum = 0;
      const bassBins = Math.min(14, state.analyserData.length);
      const midStart = bassBins;
      const midEnd = Math.min(56, state.analyserData.length);

      for (let index = 0; index < state.analyserData.length; index += 1) {
        const value = state.analyserData[index] / 255;
        totalSum += value;

        if (index < bassBins) {
          bassSum += value;
        }

        if (index >= midStart && index < midEnd) {
          midSum += value;
        }
      }

      let waveSum = 0;

      for (const value of state.analyserWaveData) {
        const centeredValue = (value - 128) / 128;
        waveSum += centeredValue * centeredValue;
      }

      const bassEnergy = bassSum / bassBins;
      const midEnergy = midSum / Math.max(1, midEnd - midStart);
      const totalEnergy = totalSum / state.analyserData.length;
      const rmsEnergy = Math.sqrt(waveSum / state.analyserWaveData.length);
      const mixedEnergy = bassEnergy * 0.76 + midEnergy * 0.32 + totalEnergy * 0.18 + rmsEnergy * 0.92;
      const gatedEnergy = Math.max(0, mixedEnergy - 0.045);
      const energy = Math.min(1, Math.pow(gatedEnergy / 0.58, 1.35));
      const now = performance.now();

      state.averageEnergy = state.averageEnergy * 0.82 + energy * 0.18;

      const isBeat = energy >= 0.62 && energy > Math.max(0.24, state.averageEnergy * 1.45) && now - state.lastBeatTime > 140;

      if (isBeat) {
        state.lastBeatTime = now;
      }

      sendAudioSignalToViewer({
        energy,
        beat: isBeat
      });

      state.analyserFrame = requestAnimationFrame(analyze);
    };

    cancelAnimationFrame(state.analyserFrame);
    state.analyserFrame = requestAnimationFrame(analyze);
  }

  function stopMusic() {
    cancelAnimationFrame(state.analyserFrame);
    state.analyserFrame = null;

    if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
      state.audio = null;
    }

    state.audioSource?.disconnect();
    state.analyser?.disconnect();
    state.audioContext?.close();
    state.audioSource = null;
    state.analyser = null;
    state.audioContext = null;
    state.analyserData = null;
    state.analyserWaveData = null;
    state.averageEnergy = 0;
    state.lastBeatTime = 0;
    sendAudioSignalToViewer({ energy: 0, beat: false });
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
      if (message?.type === "OIIA_SETTINGS") {
        applySettings(message.settings);
        sendResponse({ ok: true });
        return true;
      }

      return false;
    }

    applySettings(message.settings);
    const running = state.running ? stop() : start();
    sendResponse({ running });
    return true;
  });
})();
