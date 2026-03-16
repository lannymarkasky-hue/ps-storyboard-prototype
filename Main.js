const { app, core } = require("photoshop");

const state = {
  frames: [],
  selectedPanelId: null
};

function setStatus(message) {
  document.getElementById("status").textContent = message;
}

function generatePanelId(compId, index) {
  return `panel-${compId}-${index}`;
}

async function getLayerComps() {
  const doc = app.activeDocument;

  if (!doc) {
    throw new Error("No active document.");
  }

  const comps = doc.layerComps || [];

  return comps.map((comp, index) => ({
    panelId: generatePanelId(comp.id, index),
    compId: comp.id,
    displayName: comp.name || `Comp ${index + 1}`,
    order: index,
    active: true,
    selected: false
  }));
}

function getSelectedIndex() {
  return state.frames.findIndex(frame => frame.panelId === state.selectedPanelId);
}

function selectFrame(panelId) {
  state.selectedPanelId = panelId;
  renderFrameList();
}

async function applyFrameByPanelId(panelId) {
  const frame = state.frames.find(item => item.panelId === panelId);
  if (!frame) return;

  const doc = app.activeDocument;
  const comp = doc.layerComps.find(item => item.id === frame.compId);

  if (!comp) {
    throw new Error("Linked layer comp not found.");
  }

  await core.executeAsModal(async () => {
    await comp.apply();
  }, { commandName: "Apply Layer Comp" });

  selectFrame(panelId);
  setStatus(`Applied: ${frame.displayName}`);
}

function renderFrameList() {
  const list = document.getElementById("frameList");
  list.innerHTML = "";

  const sortedFrames = [...state.frames].sort((a, b) => a.order - b.order);

  sortedFrames.forEach(frame => {
    const item = document.createElement("div");
    item.className = "frame-item";

    if (frame.panelId === state.selectedPanelId) {
      item.classList.add("selected");
    }

    item.textContent = `${String(frame.order + 1).padStart(3, "0")} — ${frame.displayName}`;

    item.addEventListener("click", async () => {
      try {
        await applyFrameByPanelId(frame.panelId);
      } catch (error) {
        console.error(error);
        setStatus(error.message);
      }
    });

    list.appendChild(item);
  });
}

async function refreshFrames() {
  try {
    setStatus("Loading layer comps...");
    const frames = await getLayerComps();
    state.frames = frames;

    if (frames.length > 0) {
      state.selectedPanelId = frames[0].panelId;
    } else {
      state.selectedPanelId = null;
    }

    renderFrameList();
    setStatus(`Loaded ${frames.length} layer comp(s).`);
  } catch (error) {
    console.error(error);
    setStatus(error.message);
  }
}

async function goToNextFrame() {
  if (!state.frames.length) return;

  const sortedFrames = [...state.frames].sort((a, b) => a.order - b.order);
  const currentIndex = sortedFrames.findIndex(frame => frame.panelId === state.selectedPanelId);

  if (currentIndex === -1) {
    await applyFrameByPanelId(sortedFrames[0].panelId);
    return;
  }

  const nextIndex = Math.min(currentIndex + 1, sortedFrames.length - 1);
  await applyFrameByPanelId(sortedFrames[nextIndex].panelId);
}

async function goToPreviousFrame() {
  if (!state.frames.length) return;

  const sortedFrames = [...state.frames].sort((a, b) => a.order - b.order);
  const currentIndex = sortedFrames.findIndex(frame => frame.panelId === state.selectedPanelId);

  if (currentIndex === -1) {
    await applyFrameByPanelId(sortedFrames[0].panelId);
    return;
  }

  const prevIndex = Math.max(currentIndex - 1, 0);
  await applyFrameByPanelId(sortedFrames[prevIndex].panelId);
}

function normalizeOrders() {
  const sortedFrames = [...state.frames].sort((a, b) => a.order - b.order);
  sortedFrames.forEach((frame, index) => {
    frame.order = index;
  });
}

function moveSelectedFrameUp() {
  const sortedFrames = [...state.frames].sort((a, b) => a.order - b.order);
  const index = sortedFrames.findIndex(frame => frame.panelId === state.selectedPanelId);

  if (index <= 0) return;

  const current = sortedFrames[index];
  const previous = sortedFrames[index - 1];

  const tempOrder = current.order;
  current.order = previous.order;
  previous.order = tempOrder;

  normalizeOrders();
  renderFrameList();
  setStatus(`Moved up: ${current.displayName}`);
}

function moveSelectedFrameDown() {
  const sortedFrames = [...state.frames].sort((a, b) => a.order - b.order);
  const index = sortedFrames.findIndex(frame => frame.panelId === state.selectedPanelId);

  if (index === -1 || index >= sortedFrames.length - 1) return;

  const current = sortedFrames[index];
  const next = sortedFrames[index + 1];

  const tempOrder = current.order;
  current.order = next.order;
  next.order = tempOrder;

  normalizeOrders();
  renderFrameList();
  setStatus(`Moved down: ${current.displayName}`);
}

document.getElementById("refreshBtn").addEventListener("click", refreshFrames);

document.getElementById("nextBtn").addEventListener("click", async () => {
  try {
    await goToNextFrame();
  } catch (error) {
    console.error(error);
    setStatus(error.message);
  }
});

document.getElementById("prevBtn").addEventListener("click", async () => {
  try {
    await goToPreviousFrame();
  } catch (error) {
    console.error(error);
    setStatus(error.message);
  }
});

document.getElementById("moveUpBtn").addEventListener("click", moveSelectedFrameUp);
document.getElementById("moveDownBtn").addEventListener("click", moveSelectedFrameDown);

refreshFrames();
