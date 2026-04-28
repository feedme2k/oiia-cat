import * as THREE from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { clone as cloneModel } from "./vendor/SkeletonUtils.js";

const CAT_COUNT = 26;
const MODEL_URL = "assets/oiiaioooooiai_cat.glb";
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
const cats = [];

let sourceModel = null;
let beat = 0;
let startTime = performance.now();
let previousFrameTime = startTime;

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
    spinY: randomBetween(5.2, 8.4)
  };
  pivot.scale.setScalar(baseScale);

  scene.add(pivot);
  cats.push(pivot);
}

function spawnCats() {
  cats.splice(0).forEach((cat) => scene.remove(cat));

  for (let index = 0; index < CAT_COUNT; index += 1) {
    createCat(index);
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

function animate() {
  const frameTime = performance.now();
  const delta = Math.min((frameTime - previousFrameTime) / 1000, 0.05);
  const elapsed = (frameTime - startTime) / 1000;

  previousFrameTime = frameTime;

  beat = Math.max(0, beat - delta * 4.6);

  for (const cat of cats) {
    const data = cat.userData;
    const pulse = 1 + beat * 0.18;

    cat.rotation.y += delta * data.spinY;
    cat.position.y += Math.sin(elapsed * data.drift + data.phase) * delta * 0.45;
    cat.scale.setScalar(data.baseScale * pulse);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function startBeatPulse() {
  window.setInterval(() => {
    beat = 1;
  }, 290);
}

new GLTFLoader().load(
  MODEL_URL,
  (gltf) => {
    sourceModel = gltf.scene;
    fitModel(sourceModel);
    spawnCats();
    startBeatPulse();
    animate();
  },
  undefined,
  (error) => {
    console.error("Failed to load OIIA cat model", error);
  }
);

window.addEventListener("resize", onResize);
