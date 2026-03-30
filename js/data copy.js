// ============================================================
// DATA.JS — Single Source of Truth for all portfolio content
// ============================================================

const PORTFOLIO_DATA = {
  // Site-wide settings
  site: {
    logo: "B",
    heroLine1: "Hello, I'm Boon.",
    heroLine2: "Currently Pushin' Ps in Digitas Singapore",
    navLinks: [
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" }
    ]
  },

  // Projects — each card on the homepage maps to a project
  projects: [
    {
      id: "project-1",
      title: "Project One",
      cardColor: "#6B4C1E",
      cardImage: null, // null = show color + title, or set to image URL
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.",
      role: "Art Director",
      type: "Out of Home Campaign",
      client: "XXE",
      agency: "XX",
      // Content blocks for the project detail page
      contentBlocks: [
        {
          type: "full-image",
          src: null,
          color: "#6B4C1E",
          label: "VISUALS"
        },
        {
          type: "image-grid",
          columns: 3,
          images: [
            { src: null, color: "#6B4C1E" },
            { src: null, color: "#6B4C1E" },
            { src: null, color: "#6B4C1E" }
          ]
        }
      ]
    },
    {
      id: "project-2",
      title: "Project Two",
      cardColor: "#1A6B1A",
      cardImage: null,
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
      role: "Designer",
      type: "Brand Identity",
      client: "YYE",
      agency: "YY",
      contentBlocks: [
        {
          type: "full-image",
          src: null,
          color: "#1A6B1A",
          label: "KEY VISUALS"
        },
        {
          type: "image-grid",
          columns: 3,
          images: [
            { src: null, color: "#1A6B1A" },
            { src: null, color: "#1A6B1A" },
            { src: null, color: "#1A6B1A" }
          ]
        }
      ]
    },
    {
      id: "project-3",
      title: "Project Three",
      cardColor: "#0044FF",
      cardImage: null,
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
      role: "Creative Lead",
      type: "Digital Campaign",
      client: "ZZE",
      agency: "ZZ",
      contentBlocks: [
        {
          type: "full-image",
          src: null,
          color: "#0044FF",
          label: "CAMPAIGN"
        },
        {
          type: "image-grid",
          columns: 3,
          images: [
            { src: null, color: "#0044FF" },
            { src: null, color: "#0044FF" },
            { src: null, color: "#0044FF" }
          ]
        }
      ]
    }
  ]
};

// ============================================================
// DATA PERSISTENCE — Save / Load from localStorage
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
    Object.assign(PORTFOLIO_DATA.site, parsed.site);
    PORTFOLIO_DATA.projects = parsed.projects;
  }
}

function exportData() {
  const blob = new Blob(
    ["const PORTFOLIO_DATA = " + JSON.stringify(PORTFOLIO_DATA, null, 2) + ";"],
    { type: "application/javascript" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.js";
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// DATA SYNC — Pull latest content from the data.js source file
// ============================================================

async function syncFromFile() {
  const btn = document.getElementById("syncToggle");
  if (btn) {
    btn.classList.add("syncing");
    btn.title = "Syncing…";
  }
  try {
    // Fetch data.js with a cache-busting timestamp so we always get the latest version
    const res = await fetch(`js/data.js?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // Extract the PORTFOLIO_DATA object literal from the file text
    const match = text.match(/const\s+PORTFOLIO_DATA\s*=\s*(\{[\s\S]*?\});\s*(?:\/\/|$|\n)/);
    if (!match) throw new Error("Could not locate PORTFOLIO_DATA in data.js");

    const parsed = JSON.parse(match[1]);

    // Overwrite in-memory data and persist to localStorage
    Object.assign(PORTFOLIO_DATA.site, parsed.site);
    PORTFOLIO_DATA.projects = parsed.projects;
    saveData();

    showToast("Synced from data.js ✓");

    // Re-render the page with the fresh data
    if (typeof renderNav === "function") renderNav();
    if (typeof isProjectPage === "function" && isProjectPage()) {
      if (typeof renderProjectPage === "function") renderProjectPage();
    } else {
      if (typeof renderHomepage === "function") renderHomepage();
    }
  } catch (err) {
    console.error("Sync failed:", err);
    showToast("Sync failed — check console for details");
  } finally {
    if (btn) {
      btn.classList.remove("syncing");
      btn.title = "Sync from data.js";
    }
  }
}

// Load saved data on script init
loadData();
