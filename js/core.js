// ============================================================
// CORE.JS — The engine for saving, exporting, and syncing
// This file stays separate so data.js can be overwritten safely.
// ============================================================

function saveData() {
  try {
    localStorage.setItem("portfolio_v3_data", JSON.stringify(PORTFOLIO_DATA));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      alert("Storage limit reached! We couldn't save your latest changes to the browser. Please use the 'Export Data' button to grab a backup of your data.js file to avoid losing work.");
    } else {
      console.error(e);
      alert("Failed to save changes.");
    }
  }
}

function loadData() {
  const saved = localStorage.getItem("portfolio_v3_data");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.site) Object.assign(PORTFOLIO_DATA.site, parsed.site);
    if (parsed.projects) PORTFOLIO_DATA.projects = parsed.projects;
  }
}

async function exportData() {
  const content = "const PORTFOLIO_DATA = " + JSON.stringify(PORTFOLIO_DATA, null, 2) + ";";

  // 1. Try modern File System Access API (Chrome/Edge on Mac/Windows)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'data.js',
        types: [{
          description: 'JavaScript Data File',
          accept: { 'application/javascript': ['.js'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      if (typeof showToast === "function") showToast("Saved directly to file!");
      return;
    } catch (err) {
      // User cancelled or other error
      if (err.name === 'AbortError') return;
      console.error("Picker error, falling back:", err);
    }
  }

  // 2. Fallback: Standard browser download (appends (1) if duplicate exists)
  const blob = new Blob([content], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.js";
  a.click();
  URL.revokeObjectURL(url);
  if (typeof showToast === "function") showToast("Downloaded as data.js");
}

async function syncFromFile() {
  const btn = document.getElementById("syncToggle");
  if (btn) {
    btn.classList.add("syncing");
    btn.title = "Syncing…";
  }

  // Remove any previously injected sync script to allow re-injection
  const old = document.getElementById("_syncScript");
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = "_syncScript";
  script.src = `js/data.js?v=${Date.now()}`;

  script.onload = () => {
    try {
      saveData();
      showToast("Synced from data.js ✓");

      if (typeof renderNav === "function") renderNav();
      if (typeof isProjectPage === "function" && isProjectPage()) {
        if (typeof renderProjectPage === "function") renderProjectPage();
      } else {
        if (typeof renderHomepage === "function") renderHomepage();
      }
    } catch (err) {
      console.error("Sync post-load failed:", err);
      showToast("Sync failed — check console for details");
    } finally {
      if (btn) {
        btn.classList.remove("syncing");
        btn.title = "Sync from data.js";
      }
    }
  };

  script.onerror = (err) => {
    console.error("Sync failed — could not load data.js:", err);
    showToast("Sync failed — check console for details");
    if (btn) {
      btn.classList.remove("syncing");
      btn.title = "Sync from data.js";
    }
  };

  document.head.appendChild(script);
}

// Initialize data loading
loadData();
