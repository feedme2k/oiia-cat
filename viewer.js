import * as THREE from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { clone as cloneModel } from "./vendor/SkeletonUtils.js";

const DEFAULT_CAT_COUNT = 26;
const MODEL_URL = "assets/oiiaioooooiai_cat.glb";
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
const cats = [];

let sourceModel = null;
let beat = 0;
let startTime = performance.now();
let previousFrameTime = startTime;
let catCount = DEFAULT_CAT_COUNT;
let audioEnergy = 0;
let targetAudioEnergy = 0;
let beatKick = 0;
let spinLevel = 0;
let spinScale = 1;
let goRave = false;
let raveScale = 0.7;
let raveHue = 190;
let raveFlash = 0;
let lastRaveEventTime = 0;
let previousRaveEnergy = 0;
let wasAboveRaveThreshold = false;

renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.append(renderer.domElement);

camera.position.set(0, 0, 12);

scene.add(new THREE.AmbientLight(0xffffff, 2.1));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(3, 5, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffd6a6, 1.2);
fillLight.position.set(-5, -2, 4);
scene.add(fillLight);

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function fitModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;

  model.position.sub(center);
  model.scale.multiplyScalar(2.1 / maxAxis);
}

function randomViewportPosition() {
  const aspect = window.innerWidth / window.innerHeight;
  return {
    x: randomBetween(-5.7 * aspect, 5.7 * aspect),
    y: randomBetween(-4.2, 4.2),
    z: randomBetween(-1.2, 1.2)
  };
}

function createCat(index) {
  const pivot = new THREE.Group();
  const model = cloneModel(sourceModel);
  const position = randomViewportPosition();
  const baseScale = randomBetween(0.5, 1.2);

  pivot.add(model);
  pivot.position.set(position.x, position.y, position.z);
  pivot.rotation.set(randomBetween(-0.45, 0.45), randomBetween(0, Math.PI * 2), randomBetween(-0.2, 0.2));
  pivot.userData = {
    baseScale,
    drift: randomBetween(0.35, 0.95),
    phase: index * 0.7,
    spinY: randomBetween(4.8, 7.2)
  };
  pivot.scale.setScalar(baseScale);

  scene.add(pivot);
  cats.push(pivot);
}

function spawnCats() {
  cats.splice(0).forEach((cat) => scene.remove(cat));

  for (let index = 0; index < catCount; index += 1) {
    createCat(index);
  }
}

function normalizeCatCount(value) {
  return Math.min(80, Math.max(1, Number(value ?? DEFAULT_CAT_COUNT)));
}

function normalizeSpinScale(value) {
  return Math.min(2, Math.max(0, Number(value ?? 100) / 100));
}

function normalizeRaveScale(value) {
  return Math.min(1, Math.max(0, Number(value ?? 70) / 100));
}

function applySettings(settings = {}) {
  const nextCatCount = normalizeCatCount(settings.catCount);
  spinScale = normalizeSpinScale(settings.spin);
  goRave = Boolean(settings.goRave);
  raveScale = normalizeRaveScale(settings.rave);

  if (nextCatCount === catCount) {
    return;
  }

  catCount = nextCatCount;

  if (sourceModel) {
    spawnCats();
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  for (const cat of cats) {
    const position = randomViewportPosition();
    cat.position.x = position.x;
    cat.position.y = position.y;
  }
}

function updateRaveEffects(elapsed, delta) {
  raveFlash = Math.max(0, raveFlash - delta * 8.5);

  const effectEnergy = goRave ? Math.min(1, audioEnergy * 0.54 + raveFlash * 0.72) : 0;
  const flash = goRave ? Math.min(1, raveFlash) : 0;
  const beamX = 50 + Math.sin(elapsed * 1.7) * 36;
  const beamY = 50 + Math.cos(elapsed * 1.15) * 28;

  document.body.style.setProperty("--rave-energy", effectEnergy.toFixed(3));
  document.body.style.setProperty("--rave-flash", flash.toFixed(3));
  document.body.style.setProperty("--rave-hue", String(Math.round(raveHue)));
  document.body.style.setProperty("--rave-beam-x", `${beamX.toFixed(1)}%`);
  document.body.style.setProperty("--rave-beam-y", `${beamY.toFixed(1)}%`);
}

function maybeTriggerRaveEvent() {
  if (!goRave || raveScale <= 0) {
    previousRaveEnergy = audioEnergy;
    wasAboveRaveThreshold = false;
    raveFlash = 0;
    return;
  }

  const now = performance.now();
  const sensitivity = Math.pow(raveScale, 1.7);
  const minimumGap = 1400 - sensitivity * 1120;
  const energyThreshold = 0.96 - sensitivity * 0.56;
  const floorThreshold = 0.86 - sensitivity * 0.66;
  const riseThreshold = 0.34 - sensitivity * 0.22;
  const energyRise = audioEnergy - previousRaveEnergy;
  const crossedThreshold = !wasAboveRaveThreshold && audioEnergy >= energyThreshold;
  const roseFastEnough = audioEnergy >= floorThreshold && energyRise >= riseThreshold;
  const beatHit = sensitivity >= 0.18 && audioEnergy >= floorThreshold && beatKick > 0.35;
  const sustainedDropPulse = sensitivity >= 0.45 && audioEnergy >= 0.94 && now - lastRaveEventTime >= 520 - sensitivity * 180;
  const isSensitiveHit = beatHit || roseFastEnough || crossedThreshold || sustainedDropPulse;

  previousRaveEnergy = audioEnergy;
  wasAboveRaveThreshold = audioEnergy >= energyThreshold * 0.82;

  if (!isSensitiveHit || now - lastRaveEventTime < minimumGap) {
    return;
  }

  lastRaveEventTime = now;
  raveFlash = 1;
  raveHue = (raveHue + 73 + Math.random() * 72) % 360;
}

function animate() {
  const frameTime = performance.now();
  const delta = Math.min((frameTime - previousFrameTime) / 1000, 0.05);
  const elapsed = (frameTime - startTime) / 1000;

  previousFrameTime = frameTime;

  beat = Math.max(0, beat - delta * 9.5);
  beatKick = Math.max(0, beatKick - delta * 18);
  targetAudioEnergy = Math.max(0, targetAudioEnergy - delta * 6.8);
  audioEnergy += (targetAudioEnergy - audioEnergy) * Math.min(1, delta * 34);

  if (targetAudioEnergy < 0.12 && audioEnergy < 0.2) {
    audioEnergy = 0;
  }

  let targetSpinLevel = 0;

  if ((beatKick > 0.45 && audioEnergy >= 0.62) || audioEnergy >= 0.9) {
    targetSpinLevel = 1;
  } else if (audioEnergy >= 0.58) {
    targetSpinLevel = 0.46;
  } else if (audioEnergy >= 0.28) {
    targetSpinLevel = 0.18;
  }

  const transitionRate = targetSpinLevel > spinLevel ? 1 : Math.min(1, delta * 14);
  spinLevel += (targetSpinLevel - spinLevel) * transitionRate;

  if (targetSpinLevel === 0 && spinLevel < 0.035) {
    spinLevel = 0;
  }

  const speedMultiplier = (spinLevel * 4.4 + beatKick * 2.1) * spinScale;

  maybeTriggerRaveEvent();
  updateRaveEffects(elapsed, delta);

  for (const cat of cats) {
    const data = cat.userData;
    const pulse = 1 + beat * 0.24;

    cat.rotation.y += delta * data.spinY * speedMultiplier;
    cat.position.y += Math.sin(elapsed * data.drift + data.phase) * delta * 0.45;
    cat.scale.setScalar(data.baseScale * pulse);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

new GLTFLoader().load(
  MODEL_URL,
  (gltf) => {
    sourceModel = gltf.scene;
    fitModel(sourceModel);
    spawnCats();
    animate();
  },
  undefined,
  (error) => {
    console.error("Failed to load OIIA cat model", error);
  }
);

window.addEventListener("resize", onResize);
window.addEventListener("message", (event) => {
  if (event.source !== window.parent) {
    return;
  }

  if (event.data?.type === "OIIA_SETTINGS") {
    applySettings(event.data.settings);
  }

  if (event.data?.type === "OIIA_AUDIO_SIGNAL") {
    const signal = event.data.signal ?? {};

    targetAudioEnergy = Math.max(targetAudioEnergy, Math.min(1, Number(signal.energy) || 0));

    if (signal.beat) {
      beat = 1;
      beatKick = 1;
    }
  }
});
