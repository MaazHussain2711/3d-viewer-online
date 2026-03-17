import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";

const paletteColors = [
  "#ff8c42",
  "#54d2d2",
  "#ff6b6b",
  "#7dd56f",
  "#ffd166",
  "#6aa6ff",
  "#f472b6",
  "#d1d5db",
];

const filamentPresets = {
  PLA: {
    finish: "Balanced matte",
    flex: "Low",
    sheen: "Medium",
    roughness: 0.56,
    metalness: 0.03,
    clearcoat: 0.08,
    clearcoatRoughness: 0.62,
    transmission: 0,
    thickness: 0,
  },
  PETG: {
    finish: "Glossy smooth",
    flex: "Medium",
    sheen: "High",
    roughness: 0.26,
    metalness: 0.04,
    clearcoat: 0.34,
    clearcoatRoughness: 0.16,
    transmission: 0.08,
    thickness: 0.9,
  },
  TPU: {
    finish: "Soft satin",
    flex: "High",
    sheen: "Medium",
    roughness: 0.76,
    metalness: 0.02,
    clearcoat: 0.12,
    clearcoatRoughness: 0.52,
    transmission: 0.14,
    thickness: 1.1,
  },
  ABS: {
    finish: "Hard satin",
    flex: "Low",
    sheen: "High",
    roughness: 0.42,
    metalness: 0.03,
    clearcoat: 0.22,
    clearcoatRoughness: 0.28,
    transmission: 0,
    thickness: 0,
  },
};

const measurementModes = {
  distance: {
    label: "Point Distance",
    hint: "Pick two points on the model to measure straight-line distance.",
    picks: 2,
  },
  surfaceDistance: {
    label: "Surface Distance",
    hint: "Pick two surface locations to measure the gap between them.",
    picks: 2,
  },
  angle: {
    label: "Three-Point Angle",
    hint: "Pick three points. The angle is reported at the middle point.",
    picks: 3,
  },
  faceAngle: {
    label: "Face Angle",
    hint: "Pick two faces to compare their surface normals.",
    picks: 2,
  },
  radius: {
    label: "Radius / Diameter",
    hint: "Pick three points on the same circular feature to estimate radius and diameter.",
    picks: 3,
  },
};

const dom = {
  modelUpload: document.querySelector("#modelUpload"),
  fileMetaLabel: document.querySelector("#fileMeta .meta-label"),
  fileName: document.querySelector("#fileName"),
  filamentSelect: document.querySelector("#filamentSelect"),
  filamentBadge: document.querySelector("#filamentBadge"),
  finishValue: document.querySelector("#finishValue"),
  flexValue: document.querySelector("#flexValue"),
  sheenValue: document.querySelector("#sheenValue"),
  colorPalette: document.querySelector("#colorPalette"),
  customColor: document.querySelector("#customColor"),
  applyCustomColor: document.querySelector("#applyCustomColor"),
  resetColorBtn: document.querySelector("#resetColorBtn"),
  statDimensions: document.querySelector("#statDimensions"),
  statMeshes: document.querySelector("#statMeshes"),
  statVertices: document.querySelector("#statVertices"),
  statTriangles: document.querySelector("#statTriangles"),
  workspaceTitle: document.querySelector("#workspaceTitle"),
  fitViewBtn: document.querySelector("#fitViewBtn"),
  resetViewBtn: document.querySelector("#resetViewBtn"),
  viewerShell: document.querySelector("#viewerShell"),
  canvas: document.querySelector("#viewerCanvas"),
  workspaceOverlay: document.querySelector("#workspaceOverlay"),
  feedbackBar: document.querySelector("#feedbackBar"),
  toolStatus: document.querySelector("#toolStatus"),
  selectionStatus: document.querySelector("#selectionStatus"),
  activeToolBadge: document.querySelector("#activeToolBadge"),
  toolButtons: Array.from(document.querySelectorAll(".tool-button")),
  coordinateBadge: document.querySelector("#coordinateBadge"),
  coordinateButtons: Array.from(document.querySelectorAll("#coordinateModeGroup .segment-button")),
  undoBtn: document.querySelector("#undoBtn"),
  redoBtn: document.querySelector("#redoBtn"),
  layFlatBtn: document.querySelector("#layFlatBtn"),
  dropToPlateBtn: document.querySelector("#dropToPlateBtn"),
  centerOnPlateBtn: document.querySelector("#centerOnPlateBtn"),
  autoPlateSnap: document.querySelector("#autoPlateSnap"),
  syncTransformBtn: document.querySelector("#syncTransformBtn"),
  transformHint: document.querySelector("#transformHint"),
  moveInputs: {
    x: document.querySelector("#moveX"),
    y: document.querySelector("#moveY"),
    z: document.querySelector("#moveZ"),
  },
  rotateInputs: {
    x: document.querySelector("#rotateX"),
    y: document.querySelector("#rotateY"),
    z: document.querySelector("#rotateZ"),
  },
  scaleInputs: {
    x: document.querySelector("#scaleX"),
    y: document.querySelector("#scaleY"),
    z: document.querySelector("#scaleZ"),
  },
  applyMoveBtn: document.querySelector("#applyMoveBtn"),
  applyRotateBtn: document.querySelector("#applyRotateBtn"),
  applyScaleBtn: document.querySelector("#applyScaleBtn"),
  cutAxisButtons: Array.from(document.querySelectorAll("#cutAxisGroup .segment-button")),
  cutPosition: document.querySelector("#cutPosition"),
  cutPositionValue: document.querySelector("#cutPositionValue"),
  cutInputs: {
    x: document.querySelector("#cutValueX"),
    y: document.querySelector("#cutValueY"),
    z: document.querySelector("#cutValueZ"),
  },
  syncCutBtn: document.querySelector("#syncCutBtn"),
  applyCutBtn: document.querySelector("#applyCutBtn"),
  resetCutBtn: document.querySelector("#resetCutBtn"),
  brushSize: document.querySelector("#brushSize"),
  brushSizeValue: document.querySelector("#brushSizeValue"),
  paintColorChip: document.querySelector("#paintColorChip"),
  measureMode: document.querySelector("#measureMode"),
  measureHint: document.querySelector("#measureHint"),
  clearMeasurementsBtn: document.querySelector("#clearMeasurementsBtn"),
  measureResults: document.querySelector("#measureResults"),
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const brushVertex = new THREE.Vector3();

const scene = new THREE.Scene();
scene.background = new THREE.Color("#08111b");
scene.fog = new THREE.Fog("#08111b", 320, 2000);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
camera.position.set(220, 160, 220);

const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.localClippingEnabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 30, 0);

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.setSize(0.9);
transformControls.setSpace("world");
transformControls.showX = true;
transformControls.showY = true;
transformControls.showZ = true;
const transformControlHelper = transformControls.getHelper();
scene.add(transformControlHelper);

const workspace = new THREE.Group();
scene.add(workspace);

const measurementLayer = new THREE.Group();
scene.add(measurementLayer);

const measurementPreviewLayer = new THREE.Group();
scene.add(measurementPreviewLayer);

scene.add(new THREE.HemisphereLight("#fff6db", "#355d88", 1.15));

const keyLight = new THREE.DirectionalLight("#fff7ee", 1.3);
keyLight.position.set(180, 220, 160);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight("#9dc7ff", 0.9);
rimLight.position.set(-150, 110, -120);
scene.add(rimLight);

let gridHelper = null;
let buildPlate = null;
let buildPlateEdges = null;
let selectionHelper = null;
let cutPreviewPlane = null;
let cutPreviewEdges = null;

const stlLoader = new STLLoader();
const objLoader = new OBJLoader();
const threeMFLoader = new ThreeMFLoader();

const state = {
  filament: "PLA",
  baseColor: paletteColors[0],
  currentTool: "orbit",
  coordinateMode: "world",
  cutAxis: "x",
  cutPosition: 50,
  brushSize: 12,
  paintColor: paletteColors[0],
  autoPlateSnap: true,
  displayRoot: null,
  cutBackupRoot: null,
  selectedRoot: null,
  lastSurfaceHit: null,
  measurements: [],
  pendingMeasurePicks: [],
  homeCameraPosition: camera.position.clone(),
  homeCameraTarget: controls.target.clone(),
  cameraPosition: camera.position.clone(),
  cameraTarget: controls.target.clone(),
  referenceScale: 100,
  pointerDown: null,
  paintActive: false,
  paintDirty: false,
  transformDirty: false,
  history: [],
  historyIndex: -1,
  historyLimit: 24,
  suppressHistory: false,
};

const customSelectRegistry = new Map();
let activeCustomSelect = null;

init();

function init() {
  buildCustomSelects();
  buildPalette();
  applyFilamentUI();
  updateCoordinateUI();
  updateBrushChip();
  updateMeasureHint();
  updateGridAndPlate(240);
  updateCanvasSize();
  bindEvents();
  syncTransformInputs();
  syncCutInputs();
  updateToolUI();
  updateAvailability();
  animate();
}

function buildCustomSelects() {
  Array.from(document.querySelectorAll("select.field-control")).forEach((select) => {
    enhanceSelect(select);
  });

  document.addEventListener("pointerdown", onDocumentPointerDown);
}

function enhanceSelect(select) {
  const wrapper = document.createElement("div");
  wrapper.className = "custom-select";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "field-control custom-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.id = `${select.id}Trigger`;

  const menu = document.createElement("div");
  menu.className = "custom-select-menu";
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-labelledby", trigger.id);

  const optionButtons = Array.from(select.options).map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "custom-select-option";
    button.dataset.value = option.value;
    button.textContent = option.textContent;
    button.setAttribute("role", "option");
    button.addEventListener("click", () => {
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncCustomSelect(select);
      closeCustomSelect(select);
      trigger.focus();
    });
    button.addEventListener("keydown", (event) => handleCustomSelectOptionKeydown(event, select, button));
    menu.appendChild(button);
    return button;
  });

  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);
  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  select.classList.add("native-select-hidden");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");

  const label = document.querySelector(`label[for="${select.id}"]`);
  if (label) {
    label.htmlFor = trigger.id;
  }

  trigger.addEventListener("click", () => {
    toggleCustomSelect(select);
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openCustomSelect(select);
      focusAdjacentCustomOption(select, event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCustomSelect(select);
      return;
    }

    if (event.key === "Escape") {
      closeCustomSelect(select);
    }
  });

  select.addEventListener("change", () => {
    syncCustomSelect(select);
  });

  customSelectRegistry.set(select, {
    wrapper,
    trigger,
    menu,
    optionButtons,
  });

  syncCustomSelect(select);
}

function syncCustomSelect(select) {
  const customSelect = customSelectRegistry.get(select);
  if (!customSelect) {
    return;
  }

  const selectedOption = Array.from(select.options).find((option) => option.value === select.value) ?? select.options[0];
  customSelect.trigger.textContent = selectedOption?.textContent ?? "";

  customSelect.optionButtons.forEach((button) => {
    const isSelected = button.dataset.value === select.value;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-selected", isSelected ? "true" : "false");
  });
}

function toggleCustomSelect(select) {
  const customSelect = customSelectRegistry.get(select);
  if (!customSelect) {
    return;
  }

  if (customSelect.wrapper.classList.contains("is-open")) {
    closeCustomSelect(select);
  } else {
    openCustomSelect(select);
  }
}

function openCustomSelect(select) {
  const customSelect = customSelectRegistry.get(select);
  if (!customSelect) {
    return;
  }

  if (activeCustomSelect && activeCustomSelect !== select) {
    closeCustomSelect(activeCustomSelect);
  }

  activeCustomSelect = select;
  customSelect.wrapper.classList.add("is-open");
  customSelect.trigger.setAttribute("aria-expanded", "true");
  customSelect.wrapper.closest(".panel-card")?.classList.add("has-open-select");
}

function closeCustomSelect(select) {
  const customSelect = customSelectRegistry.get(select);
  if (!customSelect) {
    return;
  }

  customSelect.wrapper.classList.remove("is-open");
  customSelect.trigger.setAttribute("aria-expanded", "false");
  customSelect.wrapper.closest(".panel-card")?.classList.remove("has-open-select");
  if (activeCustomSelect === select) {
    activeCustomSelect = null;
  }
}

function onDocumentPointerDown(event) {
  if (!activeCustomSelect) {
    return;
  }

  const customSelect = customSelectRegistry.get(activeCustomSelect);
  if (!customSelect || customSelect.wrapper.contains(event.target)) {
    return;
  }

  closeCustomSelect(activeCustomSelect);
}

function handleCustomSelectOptionKeydown(event, select, button) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    focusAdjacentCustomOption(select, event.key === "ArrowDown" ? 1 : -1, button);
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeCustomSelect(select);
    customSelectRegistry.get(select)?.trigger.focus();
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    button.click();
  }
}

function focusAdjacentCustomOption(select, direction, currentButton = null) {
  const customSelect = customSelectRegistry.get(select);
  if (!customSelect?.optionButtons.length) {
    return;
  }

  const currentIndex = currentButton
    ? customSelect.optionButtons.indexOf(currentButton)
    : customSelect.optionButtons.findIndex((button) => button.dataset.value === select.value);

  const nextIndex = currentIndex < 0
    ? 0
    : (currentIndex + direction + customSelect.optionButtons.length) % customSelect.optionButtons.length;

  customSelect.optionButtons[nextIndex].focus();
}

function bindEvents() {
  window.addEventListener("resize", updateCanvasSize);
  window.addEventListener("keydown", onKeyDown);

  dom.modelUpload.addEventListener("change", async (event) => {
    const [file] = event.target.files ?? [];
    if (file) {
      await loadModelFromFile(file);
      dom.modelUpload.value = "";
    }
  });

  dom.viewerShell.addEventListener("dragover", (event) => {
    event.preventDefault();
    dom.viewerShell.classList.add("is-dragging");
  });

  dom.viewerShell.addEventListener("dragleave", () => {
    dom.viewerShell.classList.remove("is-dragging");
  });

  dom.viewerShell.addEventListener("drop", async (event) => {
    event.preventDefault();
    dom.viewerShell.classList.remove("is-dragging");
    const [file] = Array.from(event.dataTransfer?.files ?? []);
    if (file) {
      await loadModelFromFile(file);
    }
  });

  dom.filamentSelect.addEventListener("change", () => {
    state.filament = dom.filamentSelect.value;
    applyFilamentUI();
    applyFilamentToAllRoots();
    commitHistory("Filament change");
    setFeedback(`Filament changed to ${state.filament}.`);
  });

  dom.applyCustomColor.addEventListener("click", () => {
    setPaletteColor(dom.customColor.value);
  });

  dom.resetColorBtn.addEventListener("click", () => {
    setPaletteColor(paletteColors[0]);
  });

  dom.fitViewBtn.addEventListener("click", () => {
    if (!state.displayRoot) {
      setFeedback("Load a model before fitting the camera.");
      return;
    }
    fitCameraToObject(state.displayRoot, false);
    captureCameraSnapshot();
    setFeedback("Camera fitted to the current model.");
  });

  dom.resetViewBtn.addEventListener("click", () => {
    camera.position.copy(state.homeCameraPosition);
    controls.target.copy(state.homeCameraTarget);
    controls.update();
    captureCameraSnapshot();
    setFeedback("Camera returned to the home view.");
  });

  dom.toolButtons.forEach((button) => {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  });

  dom.coordinateButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.coordinateMode = button.dataset.space;
      updateCoordinateUI();
      syncTransformInputs();
      syncCutInputs();
    });
  });

  dom.undoBtn.addEventListener("click", undoHistory);
  dom.redoBtn.addEventListener("click", redoHistory);
  dom.layFlatBtn.addEventListener("click", laySelectedFaceFlat);
  dom.dropToPlateBtn.addEventListener("click", dropSelectionToPlate);
  dom.centerOnPlateBtn.addEventListener("click", centerSelectionOnPlate);
  dom.autoPlateSnap.addEventListener("change", () => {
    state.autoPlateSnap = dom.autoPlateSnap.checked;
    updateAvailability();
  });

  dom.syncTransformBtn.addEventListener("click", syncTransformInputs);
  dom.applyMoveBtn.addEventListener("click", () => applyTransformFromInputs("move"));
  dom.applyRotateBtn.addEventListener("click", () => applyTransformFromInputs("rotate"));
  dom.applyScaleBtn.addEventListener("click", () => applyTransformFromInputs("scale"));
  bindInputSubmit(Object.values(dom.moveInputs), () => applyTransformFromInputs("move"));
  bindInputSubmit(Object.values(dom.rotateInputs), () => applyTransformFromInputs("rotate"));
  bindInputSubmit(Object.values(dom.scaleInputs), () => applyTransformFromInputs("scale"));

  dom.cutAxisButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.cutAxis = button.dataset.axis;
      updateCutAxisUI();
      syncCutInputs();
      updateCutPreview();
    });
  });

  dom.cutPosition.addEventListener("input", () => {
    state.cutPosition = Number(dom.cutPosition.value);
    updateCutPositionLabel();
    syncCutInputs();
    updateCutPreview();
  });

  Object.entries(dom.cutInputs).forEach(([axis, input]) => {
    input.addEventListener("change", () => setCutFromNumeric(axis));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        setCutFromNumeric(axis);
      }
    });
  });

  dom.syncCutBtn.addEventListener("click", syncCutInputs);
  dom.applyCutBtn.addEventListener("click", applyCut);
  dom.resetCutBtn.addEventListener("click", resetCut);

  dom.brushSize.addEventListener("input", () => {
    state.brushSize = Number(dom.brushSize.value);
    dom.brushSizeValue.textContent = String(state.brushSize);
  });

  dom.measureMode.addEventListener("change", () => {
    updateMeasureHint();
    state.pendingMeasurePicks = [];
    refreshPendingMeasurementPreview();
  });

  dom.clearMeasurementsBtn.addEventListener("click", clearMeasurements);

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointerleave", onPointerUp);

  transformControls.addEventListener("dragging-changed", (event) => {
    controls.enabled = !event.value && isNavigationTool(state.currentTool);
    if (!event.value && state.transformDirty) {
      finalizeRootMutation(getActiveRoot(), "Transform update", { autoSnap: true });
      state.transformDirty = false;
    }
  });

  transformControls.addEventListener("objectChange", () => {
    if (!state.selectedRoot) {
      return;
    }
    state.transformDirty = true;
    updateModelStats(state.displayRoot);
    syncTransformInputs();
    syncCutInputs();
    updateCutPreview();
  });
}

function bindInputSubmit(inputs, handler) {
  inputs.forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handler();
      }
    });
  });
}

function buildPalette() {
  dom.colorPalette.innerHTML = "";
  paletteColors.forEach((color) => {
    const button = document.createElement("button");
    button.className = "swatch";
    button.type = "button";
    button.style.setProperty("--swatch", color);
    button.dataset.color = color;
    button.setAttribute("aria-label", `Select ${color}`);
    button.addEventListener("click", () => setPaletteColor(color));
    dom.colorPalette.appendChild(button);
  });
  updatePaletteUI();
}

function applyFilamentUI() {
  const preset = filamentPresets[state.filament];
  dom.filamentSelect.value = state.filament;
  syncCustomSelect(dom.filamentSelect);
  dom.filamentBadge.textContent = state.filament;
  dom.finishValue.textContent = preset.finish;
  dom.flexValue.textContent = preset.flex;
  dom.sheenValue.textContent = preset.sheen;
}

function updatePaletteUI() {
  dom.customColor.value = state.baseColor;
  Array.from(dom.colorPalette.querySelectorAll(".swatch")).forEach((swatch) => {
    swatch.classList.toggle("is-active", swatch.dataset.color === state.baseColor);
  });
}

function updateCoordinateUI() {
  dom.coordinateBadge.textContent = capitalize(state.coordinateMode);
  dom.coordinateButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.space === state.coordinateMode);
  });
  dom.autoPlateSnap.checked = state.autoPlateSnap;
  dom.transformHint.textContent = state.coordinateMode === "world"
    ? "Use the mouse gizmo or typed values with global X, Y, Z axes."
    : "Use the mouse gizmo or typed values relative to the selected part orientation.";
  updateTransformControlSpace();
}

function updateBrushChip() {
  dom.paintColorChip.style.background = state.paintColor;
}

function updateToolUI() {
  dom.toolButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === state.currentTool);
  });
  dom.activeToolBadge.textContent = capitalize(state.currentTool);
  dom.toolStatus.textContent = `Tool: ${capitalize(state.currentTool)}`;
  renderer.domElement.style.cursor = state.currentTool === "paint" ? "crosshair" : "grab";
}

function updateCutAxisUI() {
  dom.cutAxisButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.axis === state.cutAxis);
  });
}

function updateCutPositionLabel() {
  dom.cutPositionValue.textContent = `${formatNumber(state.cutPosition)}%`;
}

function updateMeasureHint() {
  const mode = measurementModes[dom.measureMode.value];
  dom.measureHint.textContent = mode.hint;
}

function updateAvailability() {
  const hasModel = Boolean(state.displayRoot);
  const hasSelection = Boolean(getActiveRoot());
  const hasSurface = Boolean(state.lastSurfaceHit?.normal);
  const canCut = hasModel && !state.cutBackupRoot;

  dom.undoBtn.disabled = state.historyIndex <= 0;
  dom.redoBtn.disabled = state.historyIndex >= state.history.length - 1 || state.history.length === 0;
  dom.layFlatBtn.disabled = !hasSelection || !hasSurface;
  dom.dropToPlateBtn.disabled = !hasSelection;
  dom.centerOnPlateBtn.disabled = !hasSelection;
  dom.syncTransformBtn.disabled = !hasSelection;
  dom.applyMoveBtn.disabled = !hasSelection;
  dom.applyRotateBtn.disabled = !hasSelection;
  dom.applyScaleBtn.disabled = !hasSelection;
  dom.applyCutBtn.disabled = !canCut;
  dom.syncCutBtn.disabled = !hasModel;
  dom.resetCutBtn.disabled = !state.cutBackupRoot;
}

function updateCanvasSize() {
  const rect = dom.viewerShell.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

async function loadModelFromFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!["stl", "obj", "3mf"].includes(extension)) {
    setFeedback("Unsupported file type. Please upload STL, OBJ, or 3MF.");
    return;
  }

  try {
    setFeedback(`Loading ${file.name}...`);
    const object = await parseFileByType(file, extension);
    const root = new THREE.Group();
    root.name = file.name.replace(/\.[^.]+$/, "");
    root.add(object);
    root.userData.selectRoot = true;

    prepareEditableHierarchy(root);
    placeModelInWorkspace(root);
    clearCurrentModel();

    state.displayRoot = root;
    state.cutBackupRoot = null;
    workspace.add(root);

    dom.workspaceTitle.textContent = root.name;
    dom.fileName.textContent = file.name;
    dom.fileMetaLabel.textContent = `${extension.toUpperCase()} loaded`;
    dom.workspaceOverlay.classList.add("is-hidden");

    setTool("orbit");
    setSelectedRoot(root);
    fitCameraToObject(root, true);
    captureCameraSnapshot();
    updateModelStats(root);
    syncTransformInputs();
    syncCutInputs();
    updateCutPreview();
    clearMeasurements();
    resetHistory("Model loaded");
    setFeedback(`${file.name} is ready in the workspace.`);
  } catch (error) {
    console.error(error);
    setFeedback(`Could not load ${file.name}. ${error.message}`);
  }
}

async function parseFileByType(file, extension) {
  if (extension === "stl") {
    const buffer = await file.arrayBuffer();
    const geometry = stlLoader.parse(buffer);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, createMaterial(state.baseColor));
  }

  if (extension === "obj") {
    const text = await file.text();
    return objLoader.parse(text);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    return await threeMFLoader.loadAsync(objectUrl);
  } catch (loadError) {
    try {
      const buffer = await file.arrayBuffer();
      return Promise.resolve(threeMFLoader.parse(buffer));
    } catch (parseError) {
      throw parseError ?? loadError;
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function prepareEditableHierarchy(root) {
  let meshCount = 0;
  root.traverse((node) => {
    if (!node.isMesh || !node.geometry) {
      return;
    }
    meshCount += 1;
    node.geometry = node.geometry.clone();
    if (!node.geometry.attributes.normal) {
      node.geometry.computeVertexNormals();
    }
    node.geometry.computeBoundingBox();
    node.geometry.computeBoundingSphere();
    node.material = createMaterial(state.baseColor);
    applyFilamentToMaterial(node.material);
  });

  if (!meshCount) {
    throw new Error("No mesh data was found in the uploaded file.");
  }
}

function createMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    side: THREE.DoubleSide,
    transparent: false,
  });
}

function applyFilamentToMaterial(material) {
  const preset = filamentPresets[state.filament];
  material.roughness = preset.roughness;
  material.metalness = preset.metalness;
  material.clearcoat = preset.clearcoat;
  material.clearcoatRoughness = preset.clearcoatRoughness;
  material.transmission = preset.transmission;
  material.thickness = preset.thickness;
  material.ior = 1.46;
  material.needsUpdate = true;
}

function placeModelInWorkspace(root) {
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const localCenter = root.worldToLocal(center.clone());

  root.children.forEach((child) => {
    child.position.sub(localCenter);
  });
  root.updateMatrixWorld(true);

  const centeredBox = new THREE.Box3().setFromObject(root);
  root.position.set(0, Math.max(-centeredBox.min.y, 0), 0);
  root.updateMatrixWorld(true);

  const finalBox = new THREE.Box3().setFromObject(root);
  const size = finalBox.getSize(new THREE.Vector3());
  state.referenceScale = Math.max(size.x, size.y, size.z, 10);
}

function clearCurrentModel() {
  const roots = uniqueRoots([state.displayRoot, state.cutBackupRoot]);
  roots.forEach((root) => {
    if (root?.parent) {
      root.parent.remove(root);
    }
  });
  roots.forEach((root) => {
    if (root) {
      disposeHierarchy(root);
    }
  });

  state.displayRoot = null;
  state.cutBackupRoot = null;
  state.selectedRoot = null;
  state.lastSurfaceHit = null;
  transformControls.detach();
  if (selectionHelper) {
    selectionHelper.visible = false;
  }
}

function disposeHierarchy(root) {
  root.traverse((node) => {
    if (node.geometry) {
      node.geometry.dispose();
    }
    if (node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach((material) => material.dispose());
      } else {
        node.material.dispose();
      }
    }
  });
}

function uniqueRoots(roots) {
  return Array.from(new Set(roots.filter(Boolean)));
}

function setPaletteColor(color) {
  state.baseColor = color;
  state.paintColor = color;
  updatePaletteUI();
  updateBrushChip();
  applyColorToAllRoots(color);
  commitHistory("Color change");
  setFeedback(`Color updated to ${color}.`);
}

function applyColorToAllRoots(color) {
  uniqueRoots([state.displayRoot, state.cutBackupRoot]).forEach((root) => applyColorToRoot(root, color));
}

function applyColorToRoot(root, color) {
  if (!root) {
    return;
  }

  const colorValue = new THREE.Color(color);
  root.traverse((node) => {
    if (!node.isMesh) {
      return;
    }
    const colorAttribute = node.geometry.getAttribute("color");
    if (colorAttribute) {
      for (let index = 0; index < colorAttribute.count; index += 1) {
        colorAttribute.setXYZ(index, colorValue.r, colorValue.g, colorValue.b);
      }
      colorAttribute.needsUpdate = true;
      node.material.vertexColors = true;
      node.material.color.set("#ffffff");
    } else {
      node.material.vertexColors = false;
      node.material.color.copy(colorValue);
    }
  });
}

function applyFilamentToAllRoots() {
  uniqueRoots([state.displayRoot, state.cutBackupRoot]).forEach((root) => {
    root?.traverse((node) => {
      if (node.isMesh) {
        applyFilamentToMaterial(node.material);
      }
    });
  });
}

function fitCameraToObject(object, setHome) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z, 1);
  const fitHeightDistance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  const distance = fitHeightDistance * 2.2;
  const direction = new THREE.Vector3(1, 0.85, 1).normalize();
  const position = center.clone().add(direction.multiplyScalar(distance));

  camera.position.copy(position);
  camera.near = Math.max(maxSize / 1000, 0.01);
  camera.far = Math.max(maxSize * 20, 2000);
  camera.updateProjectionMatrix();

  controls.target.copy(center.clone().add(new THREE.Vector3(0, size.y * 0.12, 0)));
  controls.maxDistance = maxSize * 30;
  controls.minDistance = Math.max(maxSize / 50, 0.25);
  controls.update();

  if (setHome) {
    state.homeCameraPosition = camera.position.clone();
    state.homeCameraTarget = controls.target.clone();
  }

  state.referenceScale = maxSize;
  updateGridAndPlate(Math.max(maxSize * 3, 80));
}

function updateGridAndPlate(size) {
  if (gridHelper) {
    disposeSceneHelper(gridHelper);
    disposeSceneHelper(buildPlate);
    disposeSceneHelper(buildPlateEdges);
  }

  const snapped = Math.ceil(size / 10) * 10;
  gridHelper = new THREE.GridHelper(snapped, 20, "#4d7ea8", "#25364f");
  gridHelper.position.y = 0;
  if (Array.isArray(gridHelper.material)) {
    gridHelper.material.forEach((material) => {
      material.opacity = 0.48;
      material.transparent = true;
    });
  }
  scene.add(gridHelper);

  buildPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(snapped, snapped),
    new THREE.MeshStandardMaterial({
      color: "#0a1525",
      roughness: 0.92,
      metalness: 0.05,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    }),
  );
  buildPlate.rotation.x = -Math.PI / 2;
  buildPlate.position.y = -0.01;
  scene.add(buildPlate);

  buildPlateEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(snapped, snapped)),
    new THREE.LineBasicMaterial({ color: "#54d2d2", transparent: true, opacity: 0.45 }),
  );
  buildPlateEdges.rotation.x = -Math.PI / 2;
  buildPlateEdges.position.y = 0.015;
  scene.add(buildPlateEdges);
}

function disposeSceneHelper(object) {
  if (!object) {
    return;
  }
  if (object.parent) {
    object.parent.remove(object);
  }
  if (object.geometry) {
    object.geometry.dispose();
  }
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose());
    } else {
      object.material.dispose();
    }
  }
}

function setTool(tool) {
  state.currentTool = tool;
  updateToolUI();
  updateTransformControlSpace();

  if (tool === "move" || tool === "rotate" || tool === "scale") {
    transformControls.setMode(tool === "move" ? "translate" : tool);
    if (state.selectedRoot) {
      transformControls.attach(state.selectedRoot);
    } else if (state.displayRoot) {
      setFeedback(`Click a model or split part to show the ${capitalize(tool)} gizmo.`);
    }
  } else {
    transformControls.detach();
  }

  controls.enabled = isNavigationTool(tool);
  state.pendingMeasurePicks = [];
  refreshPendingMeasurementPreview();
  updateCutPreview();
  updateAvailability();
}

function isNavigationTool(tool) {
  return tool === "orbit" || tool === "move" || tool === "rotate" || tool === "scale";
}

function setSelectedRoot(root, hitInfo = null) {
  state.selectedRoot = root;
  state.lastSurfaceHit = hitInfo
    ? {
        point: hitInfo.point.clone(),
        normal: hitInfo.normal?.clone() ?? null,
      }
    : root
      ? state.lastSurfaceHit
      : null;

  dom.selectionStatus.textContent = `Selection: ${root ? root.name : "None"}`;

  if (!selectionHelper) {
    selectionHelper = new THREE.BoxHelper(root ?? workspace, 0xffc857);
    selectionHelper.material.depthTest = false;
    selectionHelper.material.transparent = true;
    scene.add(selectionHelper);
  }

  if (!root) {
    selectionHelper.visible = false;
    transformControls.detach();
    syncTransformInputs();
    updateAvailability();
    return;
  }

  selectionHelper.visible = true;
  selectionHelper.setFromObject(root);

  if (state.currentTool === "move" || state.currentTool === "rotate" || state.currentTool === "scale") {
    updateTransformControlSpace();
    transformControls.attach(root);
  } else {
    transformControls.detach();
  }

  syncTransformInputs();
  updateAvailability();
}

function findSelectableRoot(object) {
  let current = object;
  while (current) {
    if (current.userData.selectRoot) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function getActiveRoot() {
  return state.selectedRoot;
}

function updateTransformControlSpace() {
  transformControls.setSpace(state.coordinateMode === "world" ? "world" : "local");
}

function onPointerDown(event) {
  if (!state.displayRoot) {
    return;
  }

  state.pointerDown = {
    x: event.clientX,
    y: event.clientY,
  };

  if (state.currentTool === "paint" && event.button === 0) {
    state.paintActive = true;
    paintAtEvent(event);
  }

  if (state.currentTool === "measure" && event.button === 0) {
    collectMeasurementPick(event);
  }
}

function onPointerMove(event) {
  if (state.currentTool === "paint" && state.paintActive) {
    paintAtEvent(event);
  }
}

function onPointerUp(event) {
  if (state.currentTool === "paint") {
    state.pointerDown = null;
    state.paintActive = false;
    if (state.paintDirty) {
      state.paintDirty = false;
      commitHistory("Paint stroke");
      setFeedback("Paint stroke captured.");
    }
    return;
  }

  if (!state.displayRoot || !state.pointerDown) {
    state.pointerDown = null;
    return;
  }

  const delta = Math.hypot(event.clientX - state.pointerDown.x, event.clientY - state.pointerDown.y);
  state.pointerDown = null;

  if (delta > 5 || state.currentTool === "measure") {
    return;
  }

  const intersection = intersectModel(event);
  if (!intersection) {
    setSelectedRoot(null);
    setFeedback("Selection cleared.");
    return;
  }

  const target = findSelectableRoot(intersection.object) ?? state.displayRoot;
  setSelectedRoot(target, {
    point: intersection.point,
    normal: getFaceNormal(intersection),
  });
  setFeedback(`${target.name} selected.`);
}

function intersectModel(event) {
  if (!state.displayRoot) {
    return null;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObject(state.displayRoot, true);
  return intersections.find((intersection) => intersection.object.visible) ?? null;
}

function ensureVertexColors(root) {
  root.traverse((node) => {
    if (!node.isMesh) {
      return;
    }
    if (node.geometry.index) {
      node.geometry = node.geometry.toNonIndexed();
    }

    const geometry = node.geometry;
    let colorAttribute = geometry.getAttribute("color");
    if (!colorAttribute) {
      const base = new THREE.Color(state.baseColor);
      const colors = new Float32Array(geometry.attributes.position.count * 3);
      for (let index = 0; index < geometry.attributes.position.count; index += 1) {
        colors[index * 3] = base.r;
        colors[index * 3 + 1] = base.g;
        colors[index * 3 + 2] = base.b;
      }
      colorAttribute = new THREE.Float32BufferAttribute(colors, 3);
      geometry.setAttribute("color", colorAttribute);
    }

    node.material.vertexColors = true;
    node.material.color.set("#ffffff");
    node.material.needsUpdate = true;
  });
}

function paintAtEvent(event) {
  const intersection = intersectModel(event);
  if (!intersection || !intersection.object?.isMesh) {
    return;
  }

  const brushRoot = findSelectableRoot(intersection.object) ?? state.displayRoot;
  ensureVertexColors(brushRoot);

  const mesh = intersection.object;
  const geometry = mesh.geometry;
  const positionAttribute = geometry.getAttribute("position");
  const colorAttribute = geometry.getAttribute("color");
  const localPoint = mesh.worldToLocal(intersection.point.clone());
  const brushRadius = state.brushSize * 0.02 * Math.max(state.referenceScale / 100, 0.25);
  const paintColor = new THREE.Color(state.paintColor);

  for (let index = 0; index < positionAttribute.count; index += 1) {
    brushVertex.set(
      positionAttribute.getX(index),
      positionAttribute.getY(index),
      positionAttribute.getZ(index),
    );
    if (brushVertex.distanceTo(localPoint) <= brushRadius) {
      colorAttribute.setXYZ(index, paintColor.r, paintColor.g, paintColor.b);
    }
  }

  colorAttribute.needsUpdate = true;
  state.paintDirty = true;
}

function syncTransformInputs() {
  const root = getActiveRoot();

  if (!root) {
    setVectorInputs(dom.moveInputs, { x: 0, y: 0, z: 0 });
    setVectorInputs(dom.rotateInputs, { x: 0, y: 0, z: 0 });
    setVectorInputs(dom.scaleInputs, { x: 1, y: 1, z: 1 });
    updateAvailability();
    return;
  }

  if (state.coordinateMode === "world") {
    setVectorInputs(dom.moveInputs, root.position);
    setVectorInputs(dom.rotateInputs, {
      x: THREE.MathUtils.radToDeg(root.rotation.x),
      y: THREE.MathUtils.radToDeg(root.rotation.y),
      z: THREE.MathUtils.radToDeg(root.rotation.z),
    });
    setVectorInputs(dom.scaleInputs, root.scale);
  } else {
    setVectorInputs(dom.moveInputs, { x: 0, y: 0, z: 0 });
    setVectorInputs(dom.rotateInputs, { x: 0, y: 0, z: 0 });
    setVectorInputs(dom.scaleInputs, { x: 1, y: 1, z: 1 });
  }

  updateAvailability();
}

function applyTransformFromInputs(mode) {
  const root = getActiveRoot();
  if (!root) {
    setFeedback("Select a model or part first.");
    return;
  }

  if (mode === "move") {
    const vector = readVectorInputs(dom.moveInputs, 0);
    if (state.coordinateMode === "world") {
      root.position.set(vector.x, vector.y, vector.z);
    } else {
      root.position.x += vector.x;
      root.position.y += vector.y;
      root.position.z += vector.z;
    }
    finalizeRootMutation(root, "Move applied", { autoSnap: true });
    return;
  }

  if (mode === "rotate") {
    const vector = readVectorInputs(dom.rotateInputs, 0);
    const radians = {
      x: THREE.MathUtils.degToRad(vector.x),
      y: THREE.MathUtils.degToRad(vector.y),
      z: THREE.MathUtils.degToRad(vector.z),
    };
    if (state.coordinateMode === "world") {
      root.rotation.set(radians.x, radians.y, radians.z);
    } else {
      root.rotation.x += radians.x;
      root.rotation.y += radians.y;
      root.rotation.z += radians.z;
    }
    finalizeRootMutation(root, "Rotation applied", { autoSnap: true });
    return;
  }

  const vector = readVectorInputs(dom.scaleInputs, 1);
  const safeScale = {
    x: Math.max(vector.x, 0.01),
    y: Math.max(vector.y, 0.01),
    z: Math.max(vector.z, 0.01),
  };
  if (state.coordinateMode === "world") {
    root.scale.set(safeScale.x, safeScale.y, safeScale.z);
  } else {
    root.scale.x *= safeScale.x;
    root.scale.y *= safeScale.y;
    root.scale.z *= safeScale.z;
  }
  finalizeRootMutation(root, "Scale applied", { autoSnap: true });
}

function finalizeRootMutation(root, label, options = {}) {
  if (!root) {
    return;
  }

  if (options.dropToPlate) {
    dropRootToPlate(root);
  } else if (options.centerOnPlate) {
    centerRootOnPlate(root);
  } else if (options.autoSnap && state.autoPlateSnap) {
    ensureRootAbovePlate(root);
  }

  root.updateMatrixWorld(true);
  if (state.displayRoot && state.cutBackupRoot) {
    state.displayRoot.children.forEach((child) => updateLocalClipPlane(child));
  }

  updateModelStats(state.displayRoot);
  syncTransformInputs();
  syncCutInputs();
  updateCutPreview();
  commitHistory(label);
  setFeedback(label);
}

function setVectorInputs(inputs, vector) {
  Object.entries(inputs).forEach(([axis, input]) => {
    input.value = formatInputValue(vector[axis]);
  });
}

function readVectorInputs(inputs, fallback) {
  return {
    x: readNumberInput(inputs.x, fallback),
    y: readNumberInput(inputs.y, fallback),
    z: readNumberInput(inputs.z, fallback),
  };
}

function readNumberInput(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function formatInputValue(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return String(Number(value.toFixed(3)));
}

function laySelectedFaceFlat() {
  const root = getActiveRoot();
  if (!root || !state.lastSurfaceHit?.normal) {
    setFeedback("Select a face on the model before using Lay On Face.");
    return;
  }

  const currentNormal = state.lastSurfaceHit.normal.clone().normalize();
  const targetNormal = new THREE.Vector3(0, -1, 0);
  const rotation = new THREE.Quaternion().setFromUnitVectors(currentNormal, targetNormal);
  root.quaternion.premultiply(rotation);
  finalizeRootMutation(root, "Selected face laid on the build plate", { dropToPlate: true });
}

function dropSelectionToPlate() {
  const root = getActiveRoot();
  if (!root) {
    setFeedback("Select a model or part first.");
    return;
  }
  finalizeRootMutation(root, "Selection dropped to the build plate", { dropToPlate: true });
}

function centerSelectionOnPlate() {
  const root = getActiveRoot();
  if (!root) {
    setFeedback("Select a model or part first.");
    return;
  }
  finalizeRootMutation(root, "Selection centered on the build plate", { centerOnPlate: true });
}

function ensureRootAbovePlate(root) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.min.y < 0) {
    root.position.y -= box.min.y;
  }
}

function dropRootToPlate(root) {
  const box = new THREE.Box3().setFromObject(root);
  root.position.y -= box.min.y;
}

function centerRootOnPlate(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  dropRootToPlate(root);
}

function syncCutInputs() {
  updateCutAxisUI();
  updateCutPositionLabel();

  const root = state.cutBackupRoot ?? state.displayRoot;
  if (!root) {
    setVectorInputs(dom.cutInputs, { x: 0, y: 0, z: 0 });
    updateAvailability();
    return;
  }

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const values = {};

  ["x", "y", "z"].forEach((axis) => {
    const worldValue = axis === state.cutAxis
      ? THREE.MathUtils.lerp(box.min[axis], box.max[axis], state.cutPosition / 100)
      : center[axis];
    values[axis] = state.coordinateMode === "world" ? worldValue : worldValue - center[axis];
  });

  setVectorInputs(dom.cutInputs, values);
  updateAvailability();
}

function setCutFromNumeric(axis) {
  const root = state.cutBackupRoot ?? state.displayRoot;
  if (!root) {
    return;
  }

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const min = box.min[axis];
  const max = box.max[axis];
  const rawValue = readNumberInput(dom.cutInputs[axis], 0);

  state.cutAxis = axis;
  let worldValue = state.coordinateMode === "world" ? rawValue : center[axis] + rawValue;
  worldValue = THREE.MathUtils.clamp(worldValue, min, max);
  state.cutPosition = max === min ? 50 : ((worldValue - min) / (max - min)) * 100;

  updateCutAxisUI();
  updateCutPositionLabel();
  dom.cutPosition.value = String(state.cutPosition);
  syncCutInputs();
  updateCutPreview();
}

function applyCut() {
  if (!state.displayRoot) {
    setFeedback("Load a model before applying a cut.");
    return;
  }
  if (state.cutBackupRoot) {
    setFeedback("Reset the current split before applying another cut.");
    return;
  }

  const sourceRoot = state.displayRoot;
  const box = new THREE.Box3().setFromObject(sourceRoot);
  const size = box.getSize(new THREE.Vector3());
  const cutValue = THREE.MathUtils.lerp(box.min[state.cutAxis], box.max[state.cutAxis], state.cutPosition / 100);
  const normal = axisVector(state.cutAxis);
  const plane = new THREE.Plane(normal.clone(), -cutValue);
  const invertedPlane = plane.clone().negate();

  const partA = cloneHierarchy(sourceRoot);
  const partB = cloneHierarchy(sourceRoot);
  partA.name = `${sourceRoot.name} Part A`;
  partB.name = `${sourceRoot.name} Part B`;
  partA.userData.selectRoot = true;
  partB.userData.selectRoot = true;

  setLocalClipPlane(partA, plane);
  setLocalClipPlane(partB, invertedPlane);

  const gap = Math.max(Math.max(size.x, size.y, size.z) * 0.025, 0.5);
  partA.position.add(normal.clone().multiplyScalar(gap));
  partB.position.add(normal.clone().multiplyScalar(-gap));

  const cutGroup = new THREE.Group();
  cutGroup.name = `${sourceRoot.name} Split`;
  cutGroup.add(partA, partB);

  workspace.remove(sourceRoot);
  workspace.add(cutGroup);

  state.cutBackupRoot = sourceRoot;
  state.displayRoot = cutGroup;
  setSelectedRoot(partA);
  updateModelStats(cutGroup);
  syncTransformInputs();
  syncCutInputs();
  updateCutPreview();
  fitCameraToObject(cutGroup, false);
  captureCameraSnapshot();
  commitHistory("Cut applied");
  setFeedback("The model was split into two editable parts.");
}

function resetCut() {
  if (!state.cutBackupRoot || !state.displayRoot) {
    setFeedback("There is no active split to reset.");
    return;
  }

  const cutRoot = state.displayRoot;
  workspace.remove(cutRoot);
  disposeHierarchy(cutRoot);

  state.displayRoot = state.cutBackupRoot;
  state.cutBackupRoot = null;
  workspace.add(state.displayRoot);

  setSelectedRoot(state.displayRoot);
  updateModelStats(state.displayRoot);
  syncTransformInputs();
  syncCutInputs();
  updateCutPreview();
  fitCameraToObject(state.displayRoot, false);
  captureCameraSnapshot();
  commitHistory("Cut reset");
  setFeedback("The original model has been restored.");
}

function cloneHierarchy(root) {
  const clone = root.clone(true);
  const sourceNodes = [];
  const cloneNodes = [];

  root.traverse((node) => sourceNodes.push(node));
  clone.traverse((node) => cloneNodes.push(node));

  cloneNodes.forEach((node, index) => {
    const sourceNode = sourceNodes[index];
    node.userData = { ...sourceNode.userData };
    if (sourceNode.userData.localClipPlane) {
      node.userData.localClipPlane = sourceNode.userData.localClipPlane.clone();
    }
    if (sourceNode.isMesh) {
      node.geometry = sourceNode.geometry.clone();
      node.material = Array.isArray(sourceNode.material)
        ? sourceNode.material.map((material) => material.clone())
        : sourceNode.material.clone();
    }
  });

  return clone;
}

function setLocalClipPlane(root, worldPlane) {
  root.updateMatrixWorld(true);
  const inverseMatrix = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const inverseNormalMatrix = new THREE.Matrix3().getNormalMatrix(inverseMatrix);
  root.userData.localClipPlane = worldPlane.clone().applyMatrix4(inverseMatrix, inverseNormalMatrix);

  root.traverse((node) => {
    if (node.isMesh) {
      node.material.side = THREE.DoubleSide;
      node.material.clipShadows = true;
    }
  });

  updateLocalClipPlane(root);
}

function updateLocalClipPlane(root) {
  if (!root?.userData.localClipPlane) {
    return;
  }

  root.updateMatrixWorld(true);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(root.matrixWorld);
  const worldPlane = root.userData.localClipPlane.clone().applyMatrix4(root.matrixWorld, normalMatrix);

  root.traverse((node) => {
    if (node.isMesh) {
      node.material.clippingPlanes = [worldPlane];
      node.material.needsUpdate = true;
    }
  });
}

function updateCutPreview() {
  if (!cutPreviewPlane) {
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    cutPreviewPlane = new THREE.Mesh(
      planeGeometry,
      new THREE.MeshBasicMaterial({
        color: "#ff8c42",
        opacity: 0.12,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    cutPreviewEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(planeGeometry),
      new THREE.LineBasicMaterial({ color: "#ffd166", transparent: true, opacity: 0.75 }),
    );
    cutPreviewPlane.add(cutPreviewEdges);
    scene.add(cutPreviewPlane);
  }

  const root = state.cutBackupRoot ?? state.displayRoot;
  const shouldShow = state.currentTool === "cut" && root && !state.cutBackupRoot;
  cutPreviewPlane.visible = Boolean(shouldShow);

  if (!shouldShow) {
    return;
  }

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const cutValue = THREE.MathUtils.lerp(box.min[state.cutAxis], box.max[state.cutAxis], state.cutPosition / 100);
  const maxSize = Math.max(size.x, size.y, size.z) * 1.15;

  cutPreviewPlane.scale.set(maxSize, maxSize, 1);
  cutPreviewPlane.position.copy(center);
  cutPreviewPlane.rotation.set(0, 0, 0);

  if (state.cutAxis === "x") {
    cutPreviewPlane.rotation.y = Math.PI / 2;
    cutPreviewPlane.position.x = cutValue;
  }
  if (state.cutAxis === "y") {
    cutPreviewPlane.rotation.x = -Math.PI / 2;
    cutPreviewPlane.position.y = cutValue;
  }
  if (state.cutAxis === "z") {
    cutPreviewPlane.position.z = cutValue;
  }
}

function collectMeasurementPick(event) {
  const intersection = intersectModel(event);
  if (!intersection) {
    return;
  }

  const pick = {
    point: intersection.point.clone(),
    normal: getFaceNormal(intersection),
  };

  state.pendingMeasurePicks.push(pick);
  refreshPendingMeasurementPreview();

  const mode = measurementModes[dom.measureMode.value];
  if (state.pendingMeasurePicks.length < mode.picks) {
    setFeedback(`${mode.label}: ${state.pendingMeasurePicks.length}/${mode.picks} picks recorded.`);
    return;
  }

  finalizeMeasurement(dom.measureMode.value, state.pendingMeasurePicks.slice());
  state.pendingMeasurePicks = [];
  refreshPendingMeasurementPreview();
}

function getFaceNormal(intersection) {
  if (!intersection.face) {
    return null;
  }
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersection.object.matrixWorld);
  return intersection.face.normal.clone().applyMatrix3(normalMatrix).normalize();
}

function refreshPendingMeasurementPreview() {
  clearGroup(measurementPreviewLayer);
  state.pendingMeasurePicks.forEach((pick) => {
    measurementPreviewLayer.add(createMarker(pick.point, "#ffd166"));
  });
}

function finalizeMeasurement(mode, picks) {
  if (mode === "distance" || mode === "surfaceDistance") {
    const distance = picks[0].point.distanceTo(picks[1].point);
    const group = new THREE.Group();
    group.add(createMarker(picks[0].point, "#54d2d2"));
    group.add(createMarker(picks[1].point, "#54d2d2"));
    group.add(createLine([picks[0].point, picks[1].point], "#54d2d2"));
    measurementLayer.add(group);
    pushMeasurement({
      title: mode === "distance" ? "Point Distance" : "Surface Distance",
      value: `${formatNumber(distance)} units`,
      detail: `Between (${formatPoint(picks[0].point)}) and (${formatPoint(picks[1].point)}).`,
    });
    setFeedback("Distance measurement captured.");
    return;
  }

  if (mode === "angle") {
    const first = picks[0].point.clone().sub(picks[1].point).normalize();
    const second = picks[2].point.clone().sub(picks[1].point).normalize();
    const angle = THREE.MathUtils.radToDeg(first.angleTo(second));
    const group = new THREE.Group();
    group.add(createMarker(picks[0].point, "#ff8c42"));
    group.add(createMarker(picks[1].point, "#ff8c42"));
    group.add(createMarker(picks[2].point, "#ff8c42"));
    group.add(createLine([picks[0].point, picks[1].point, picks[2].point], "#ff8c42"));
    measurementLayer.add(group);
    pushMeasurement({
      title: "Three-Point Angle",
      value: `${formatNumber(angle)} deg`,
      detail: `Angle measured at the middle point (${formatPoint(picks[1].point)}).`,
    });
    setFeedback("Angle measurement captured.");
    return;
  }

  if (mode === "faceAngle") {
    if (!picks[0].normal || !picks[1].normal) {
      setFeedback("Face angle needs valid surface normals. Try clicking flatter faces.");
      return;
    }

    const angle = THREE.MathUtils.radToDeg(picks[0].normal.angleTo(picks[1].normal));
    const length = Math.max(state.referenceScale * 0.12, 4);
    const group = new THREE.Group();
    group.add(createMarker(picks[0].point, "#7dd56f"));
    group.add(createMarker(picks[1].point, "#7dd56f"));
    group.add(createLine([picks[0].point, picks[0].point.clone().add(picks[0].normal.clone().multiplyScalar(length))], "#7dd56f"));
    group.add(createLine([picks[1].point, picks[1].point.clone().add(picks[1].normal.clone().multiplyScalar(length))], "#7dd56f"));
    measurementLayer.add(group);
    pushMeasurement({
      title: "Face Angle",
      value: `${formatNumber(angle)} deg`,
      detail: "Measured from the normals of the two selected faces.",
    });
    setFeedback("Face angle measurement captured.");
    return;
  }

  const radiusResult = solveCircleFromThreePoints(picks[0].point, picks[1].point, picks[2].point);
  if (!radiusResult) {
    setFeedback("Radius measurement needs three non-collinear points on the same circular feature.");
    return;
  }

  const group = new THREE.Group();
  group.add(createMarker(picks[0].point, "#f472b6"));
  group.add(createMarker(picks[1].point, "#f472b6"));
  group.add(createMarker(picks[2].point, "#f472b6"));
  group.add(createLine([picks[0].point, picks[1].point, picks[2].point, picks[0].point], "#f472b6"));
  measurementLayer.add(group);
  pushMeasurement({
    title: "Radius / Diameter",
    value: `R ${formatNumber(radiusResult.radius)} / D ${formatNumber(radiusResult.diameter)} units`,
    detail: "Estimated from three selected points on a circular path.",
  });
  setFeedback("Radius and diameter measurement captured.");
}

function solveCircleFromThreePoints(a, b, c) {
  const ab = b.distanceTo(c);
  const bc = c.distanceTo(a);
  const ca = a.distanceTo(b);
  const area = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).length() * 0.5;
  if (area < 1e-5) {
    return null;
  }
  const radius = (ab * bc * ca) / (4 * area);
  return {
    radius,
    diameter: radius * 2,
  };
}

function createMarker(position, color) {
  const radius = Math.max(state.referenceScale * 0.008, 0.6);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 16, 16),
    new THREE.MeshBasicMaterial({ color }),
  );
  marker.position.copy(position);
  return marker;
}

function createLine(points, color) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color });
  return new THREE.Line(geometry, material);
}

function pushMeasurement(entry) {
  state.measurements.unshift(entry);
  renderMeasurementResults();
}

function renderMeasurementResults() {
  dom.measureResults.innerHTML = "";

  if (!state.measurements.length) {
    dom.measureResults.innerHTML = '<p class="measure-empty">Measurements will appear here.</p>';
    return;
  }

  state.measurements.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "measure-item";
    item.innerHTML = `
      <strong>${entry.title}</strong>
      <span>${entry.value}</span>
      <small>${entry.detail}</small>
    `;
    dom.measureResults.appendChild(item);
  });
}

function clearMeasurements() {
  clearGroup(measurementLayer);
  clearGroup(measurementPreviewLayer);
  state.measurements = [];
  state.pendingMeasurePicks = [];
  renderMeasurementResults();
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children[group.children.length - 1];
    group.remove(child);
    disposeHierarchy(child);
  }
}

function updateModelStats(root) {
  if (!root) {
    dom.statDimensions.textContent = "-";
    dom.statMeshes.textContent = "-";
    dom.statVertices.textContent = "-";
    dom.statTriangles.textContent = "-";
    return;
  }

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  let meshCount = 0;
  let vertices = 0;
  let triangles = 0;

  root.traverse((node) => {
    if (!node.isMesh) {
      return;
    }
    meshCount += 1;
    const position = node.geometry.getAttribute("position");
    vertices += position?.count ?? 0;
    triangles += node.geometry.index ? node.geometry.index.count / 3 : (position?.count ?? 0) / 3;
  });

  dom.statDimensions.textContent = `${formatNumber(size.x)} x ${formatNumber(size.y)} x ${formatNumber(size.z)}`;
  dom.statMeshes.textContent = String(meshCount);
  dom.statVertices.textContent = formatInteger(vertices);
  dom.statTriangles.textContent = formatInteger(triangles);
}

function resetHistory(label) {
  state.history = [];
  state.historyIndex = -1;
  commitHistory(label);
}

function commitHistory(label) {
  if (state.suppressHistory || !state.displayRoot) {
    updateAvailability();
    return;
  }

  const snapshot = captureSnapshot();
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push({ label, snapshot });
  if (state.history.length > state.historyLimit) {
    state.history.shift();
  }
  state.historyIndex = state.history.length - 1;
  updateAvailability();
}

function captureSnapshot() {
  return {
    displayRoot: cloneHierarchy(state.displayRoot),
    cutBackupRoot: state.cutBackupRoot ? cloneHierarchy(state.cutBackupRoot) : null,
    selectedPath: state.selectedRoot ? getNodePath(state.displayRoot, state.selectedRoot) : null,
    baseColor: state.baseColor,
    filament: state.filament,
    currentTool: state.currentTool,
    coordinateMode: state.coordinateMode,
    cutAxis: state.cutAxis,
    cutPosition: state.cutPosition,
    brushSize: state.brushSize,
    paintColor: state.paintColor,
    autoPlateSnap: state.autoPlateSnap,
    fileName: dom.fileName.textContent,
    fileLabel: dom.fileMetaLabel.textContent,
    workspaceTitle: dom.workspaceTitle.textContent,
    cameraPosition: camera.position.clone(),
    cameraTarget: controls.target.clone(),
    homeCameraPosition: state.homeCameraPosition.clone(),
    homeCameraTarget: state.homeCameraTarget.clone(),
  };
}

function undoHistory() {
  if (state.historyIndex <= 0) {
    return;
  }
  state.historyIndex -= 1;
  restoreSnapshot(state.history[state.historyIndex].snapshot);
  setFeedback("Undo applied.");
}

function redoHistory() {
  if (state.historyIndex >= state.history.length - 1) {
    return;
  }
  state.historyIndex += 1;
  restoreSnapshot(state.history[state.historyIndex].snapshot);
  setFeedback("Redo applied.");
}

function restoreSnapshot(snapshot) {
  state.suppressHistory = true;

  clearCurrentModel();

  state.displayRoot = cloneHierarchy(snapshot.displayRoot);
  state.cutBackupRoot = snapshot.cutBackupRoot ? cloneHierarchy(snapshot.cutBackupRoot) : null;
  workspace.add(state.displayRoot);

  state.baseColor = snapshot.baseColor;
  state.paintColor = snapshot.paintColor;
  state.filament = snapshot.filament;
  state.currentTool = snapshot.currentTool;
  state.coordinateMode = snapshot.coordinateMode;
  state.cutAxis = snapshot.cutAxis;
  state.cutPosition = snapshot.cutPosition;
  state.brushSize = snapshot.brushSize;
  state.autoPlateSnap = snapshot.autoPlateSnap;
  state.homeCameraPosition = snapshot.homeCameraPosition.clone();
  state.homeCameraTarget = snapshot.homeCameraTarget.clone();

  camera.position.copy(snapshot.cameraPosition);
  controls.target.copy(snapshot.cameraTarget);
  controls.update();
  captureCameraSnapshot();

  dom.fileName.textContent = snapshot.fileName;
  dom.fileMetaLabel.textContent = snapshot.fileLabel;
  dom.workspaceTitle.textContent = snapshot.workspaceTitle;
  dom.workspaceOverlay.classList.toggle("is-hidden", Boolean(state.displayRoot));

  applyFilamentUI();
  updatePaletteUI();
  updateCoordinateUI();
  updateBrushChip();
  updateToolUI();
  updateCutAxisUI();
  updateCutPositionLabel();
  dom.cutPosition.value = String(state.cutPosition);
  dom.brushSize.value = String(state.brushSize);
  dom.brushSizeValue.textContent = String(state.brushSize);

  const selectedRoot = snapshot.selectedPath !== null ? getNodeByPath(state.displayRoot, snapshot.selectedPath) : null;
  setSelectedRoot(selectedRoot);
  updateModelStats(state.displayRoot);
  syncTransformInputs();
  syncCutInputs();
  updateCutPreview();
  clearMeasurements();

  state.suppressHistory = false;
  updateAvailability();
}

function getNodePath(root, target) {
  if (!root || !target) {
    return null;
  }
  if (root === target) {
    return [];
  }
  const path = [];
  let current = target;
  while (current && current !== root) {
    const parent = current.parent;
    if (!parent) {
      return null;
    }
    path.unshift(parent.children.indexOf(current));
    current = parent;
  }
  return current === root ? path : null;
}

function getNodeByPath(root, path) {
  let current = root;
  for (const index of path) {
    current = current?.children[index];
    if (!current) {
      return null;
    }
  }
  return current;
}

function onKeyDown(event) {
  if (event.ctrlKey && event.key.toLowerCase() === "z" && !event.shiftKey) {
    event.preventDefault();
    undoHistory();
  } else if ((event.ctrlKey && event.key.toLowerCase() === "y") || (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z")) {
    event.preventDefault();
    redoHistory();
  }
}

function captureCameraSnapshot() {
  state.cameraPosition = camera.position.clone();
  state.cameraTarget = controls.target.clone();
}

function setFeedback(message) {
  dom.feedbackBar.textContent = message;
}

function formatNumber(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatInteger(value) {
  return Number(value).toLocaleString();
}

function formatPoint(vector) {
  return `${formatNumber(vector.x)}, ${formatNumber(vector.y)}, ${formatNumber(vector.z)}`;
}

function axisVector(axis) {
  if (axis === "x") {
    return new THREE.Vector3(1, 0, 0);
  }
  if (axis === "y") {
    return new THREE.Vector3(0, 1, 0);
  }
  return new THREE.Vector3(0, 0, 1);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function animate() {
  requestAnimationFrame(animate);

  if (selectionHelper?.visible && state.selectedRoot) {
    selectionHelper.setFromObject(state.selectedRoot);
  }

  if (state.displayRoot && state.cutBackupRoot) {
    state.displayRoot.children.forEach((child) => updateLocalClipPlane(child));
  }

  controls.update();
  renderer.render(scene, camera);
}
