// ============================================================
// APP.JS — Core rendering, animations, and page transitions
// ============================================================

// --- Utility: Toast notification ---
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
  }, 2000);
}

// --- Utility: Set Dynamic Aspect Ratio ---
function applyDynamicAspectRatio(el, src) {
  if (!src) return;
  const imgObj = new Image();
  imgObj.onload = () => {
    el.style.aspectRatio = `${imgObj.width} / ${imgObj.height}`;
  };
  imgObj.src = src;
}

// --- Utility: Detect which page we're on ---
function isProjectPage() {
  return window.location.pathname.includes("project.html") ||
    window.location.search.includes("project=");
}

function getProjectIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("project");
}

function getProjectById(id) {
  return PORTFOLIO_DATA.projects.find(p => p.id === id) || null;
}

// --- Page Transition ---
function navigateTo(url) {
  const overlay = document.getElementById("pageTransition");
  if (!overlay) {
    window.location.href = url;
    return;
  }
  overlay.classList.add("active");
  setTimeout(() => {
    window.location.href = url;
  }, 350);
}

// ============================================================
// RENDER: Notch Navigation
// ============================================================
function renderNav() {
  const logo = document.getElementById("notchLogo");
  const links = document.getElementById("notchLinks");
  if (!logo || !links) return;

  logo.textContent = PORTFOLIO_DATA.site.logo;
  logo.onclick = () => navigateTo("index.html");

  links.innerHTML = "";
  PORTFOLIO_DATA.site.navLinks.forEach(link => {
    const a = document.createElement("a");
    a.className = "notch-link";
    a.textContent = link.label;
    a.href = link.href;
    if (link.href.startsWith("#")) {
      a.href = link.href;
      a.onclick = (e) => {
        e.preventDefault();
        // If we're on project page, go home first
        if (isProjectPage()) {
          navigateTo("index.html" + link.href);
        }
      };
    } else {
      a.href = link.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    links.appendChild(a);
  });
}

// ============================================================
// RENDER: Homepage
// ============================================================
function renderHomepage() {
  renderHero();
  renderProjectsGrid();
  setupScrollAnimations();
}

function renderHero() {
  const container = document.getElementById("heroTitle");
  if (!container) return;

  const line1 = PORTFOLIO_DATA.site.heroLine1;
  const line2 = PORTFOLIO_DATA.site.heroLine2;

  container.innerHTML = `
    <span class="line" data-editable="site.heroLine1">${line1}</span>
    <span class="line" data-editable="site.heroLine2">${line2}</span>
  `;
}

function renderProjectsGrid() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  PORTFOLIO_DATA.projects.forEach((project, index) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.setAttribute("data-index", index);
    card.setAttribute("data-id", project.id);

    // Background: image or solid color
    const bgDiv = document.createElement("div");
    bgDiv.className = "project-card-bg";
    if (project.cardImage) {
      bgDiv.style.backgroundImage = `url("${project.cardImage}")`;
      applyDynamicAspectRatio(card, project.cardImage);
    } else {
      bgDiv.style.backgroundColor = project.cardColor;
    }
    card.appendChild(bgDiv);

    // Image upload overlay (visible in edit mode)
    const uploadOverlay = document.createElement("div");
    uploadOverlay.className = "image-upload-overlay";
    uploadOverlay.innerHTML = "<span>Click or Drag image here</span>";
    setupImageUpload(uploadOverlay, (dataUrl) => {
      project.cardImage = dataUrl;
      bgDiv.style.backgroundImage = `url("${dataUrl}")`;
      bgDiv.style.backgroundColor = "transparent";
      bgDiv.style.backgroundSize = "contain";
      bgDiv.style.backgroundRepeat = "no-repeat";
      bgDiv.style.backgroundPosition = "center";
      applyDynamicAspectRatio(card, dataUrl);
      saveData();
    });
    card.appendChild(uploadOverlay);

    // Delete project button (visible in edit mode)
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-element-btn";
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Delete Project";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (document.body.classList.contains("edit-mode")) {
        if (confirm("Are you sure you want to delete this project?")) {
          PORTFOLIO_DATA.projects.splice(index, 1);
          saveData();
          renderProjectsGrid();
          setupScrollAnimations();
          if (typeof setupDragAndDrop === 'function') setupDragAndDrop();
        }
      }
    };
    card.appendChild(deleteBtn);

    // Click to navigate (only when not in edit mode)
    card.addEventListener("click", () => {
      if (!document.body.classList.contains("edit-mode")) {
        navigateTo(`project.html?project=${project.id}`);
      }
    });

    grid.appendChild(card);
  });
}

// ============================================================
// RENDER: Project Detail Page
// ============================================================
function renderProjectPage() {
  const projectId = getProjectIdFromURL();
  const project = getProjectById(projectId);
  if (!project) {
    navigateTo("index.html");
    return;
  }

  // Update page title
  document.title = `${project.title} — Boon`;

  const projectIndex = PORTFOLIO_DATA.projects.indexOf(project);

  // Hero image
  const heroContainer = document.getElementById("projectHero");
  if (heroContainer) {
    heroContainer.innerHTML = "";
    const heroDiv = document.createElement("div");
    heroDiv.className = "project-hero-image";
    if (project.cardImage) {
      heroDiv.style.backgroundImage = `url("${project.cardImage}")`;
      heroDiv.style.backgroundSize = "contain";
      heroDiv.style.backgroundRepeat = "no-repeat";
      heroDiv.style.backgroundPosition = "center";
      applyDynamicAspectRatio(heroDiv, project.cardImage);
    } else {
      heroDiv.style.backgroundColor = project.cardColor;
    }

    // Upload overlay for hero
    const uploadOverlay = document.createElement("div");
    uploadOverlay.className = "image-upload-overlay";
    uploadOverlay.innerHTML = "<span>Click or Drag hero image</span>";
    uploadOverlay.style.borderRadius = "var(--card-radius)";
    setupImageUpload(uploadOverlay, (dataUrl) => {
      project.cardImage = dataUrl;
      heroDiv.style.backgroundImage = `url("${dataUrl}")`;
      heroDiv.style.backgroundColor = "transparent";
      heroDiv.style.backgroundSize = "contain";
      heroDiv.style.backgroundRepeat = "no-repeat";
      heroDiv.style.backgroundPosition = "center";
      applyDynamicAspectRatio(heroDiv, dataUrl);
      saveData();
    });
    heroDiv.appendChild(uploadOverlay);
    heroContainer.appendChild(heroDiv);
  }

  // Info section
  const infoContainer = document.getElementById("projectInfo");
  if (infoContainer) {
    infoContainer.innerHTML = `
      <h1 class="project-info-title" data-editable="projects.${projectIndex}.title">${project.title}</h1>
      <p class="project-info-description" data-editable="projects.${projectIndex}.description">${project.description}</p>
      <div class="project-meta">
        <span>ROLE: <strong data-editable="projects.${projectIndex}.role">${project.role}</strong></span>
        <span>TYPE: <strong data-editable="projects.${projectIndex}.type">${project.type}</strong></span>
        <span>CLIENT: <strong data-editable="projects.${projectIndex}.client">${project.client}</strong></span>
        <span>AGENCY: <strong data-editable="projects.${projectIndex}.agency">${project.agency}</strong></span>
      </div>
    `;
  }

  // Content blocks
  renderContentBlocks(project, projectIndex);
  setupScrollAnimations();
}

function renderContentBlocks(project, projectIndex) {
  const container = document.getElementById("contentBlocks");
  if (!container) return;
  container.innerHTML = "";

  project.contentBlocks.forEach((block, blockIndex) => {
    const el = createBlockElement(block, projectIndex, blockIndex);
    if (el) {
      // Delete block button (visible in edit mode)
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-element-btn delete-block-btn";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "Delete Block";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (document.body.classList.contains("edit-mode")) {
          if (confirm("Are you sure you want to delete this content block?")) {
            project.contentBlocks.splice(blockIndex, 1);
            saveData();
            renderContentBlocks(project, projectIndex);
            setupScrollAnimations();
            if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
          }
        }
      };

      // Some blocks need position relative for absolute delete button positioning
      if (!el.style.position && window.getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }

      el.appendChild(deleteBtn);
      container.appendChild(el);
    }
  });
}

function createBlockElement(block, projectIndex, blockIndex) {
  switch (block.type) {
    case "full-image":
      return createFullImageBlock(block, projectIndex, blockIndex);
    case "image-grid":
      return createImageGridBlock(block, projectIndex, blockIndex);
    case "text":
      return createTextBlock(block, projectIndex, blockIndex);
    case "two-column":
      return createTwoColumnBlock(block, projectIndex, blockIndex);
    case "video":
      return createVideoBlock(block, projectIndex, blockIndex);
    default:
      return null;
  }
}

function createFullImageBlock(block, projectIndex, blockIndex) {
  const div = document.createElement("div");
  div.className = "block-full-image";
  div.setAttribute("data-block-index", blockIndex);

  if (block.src) {
    div.style.backgroundImage = `url("${block.src}")`;
    div.style.backgroundSize = "contain";
    div.style.backgroundRepeat = "no-repeat";
    div.style.backgroundPosition = "center";
    applyDynamicAspectRatio(div, block.src);
  } else {
    div.style.backgroundColor = block.color || "#999";
  }

  // Label overlay removed per user request

  // Upload overlay
  const overlay = document.createElement("div");
  overlay.className = "image-upload-overlay";
  overlay.innerHTML = "<span>Click or Drag image here</span>";
  setupImageUpload(overlay, (dataUrl) => {
    block.src = dataUrl;
    div.style.backgroundImage = `url("${dataUrl}")`;
    div.style.backgroundColor = "transparent";
    div.style.backgroundSize = "contain";
    div.style.backgroundRepeat = "no-repeat";
    div.style.backgroundPosition = "center";
    applyDynamicAspectRatio(div, dataUrl);
    saveData();
  });
  div.appendChild(overlay);

  return div;
}

function createImageGridBlock(block, projectIndex, blockIndex) {
  const div = document.createElement("div");
  div.className = `block-image-grid cols-${block.columns || 3}`;
  div.setAttribute("data-block-index", blockIndex);

  (block.images || []).forEach((img, imgIndex) => {
    const item = document.createElement("div");
    item.className = "block-grid-item";

    if (img.src) {
      item.style.backgroundImage = `url("${img.src}")`;
      item.style.backgroundSize = "contain";
      item.style.backgroundRepeat = "no-repeat";
      item.style.backgroundPosition = "center";
      applyDynamicAspectRatio(item, img.src);
    } else {
      item.style.backgroundColor = img.color || "#999";
    }

    // Upload overlay for each grid item
    const overlay = document.createElement("div");
    overlay.className = "image-upload-overlay";
    overlay.style.borderRadius = "12px";
    overlay.innerHTML = "<span>Click/Drag</span>";
    setupImageUpload(overlay, (dataUrl) => {
      img.src = dataUrl;
      item.style.backgroundImage = `url("${dataUrl}")`;
      item.style.backgroundColor = "transparent";
      item.style.backgroundSize = "contain";
      item.style.backgroundRepeat = "no-repeat";
      item.style.backgroundPosition = "center";
      applyDynamicAspectRatio(item, dataUrl);
      saveData();
    });
    item.appendChild(overlay);
    div.appendChild(item);
  });

  return div;
}

function createTextBlock(block, projectIndex, blockIndex) {
  const div = document.createElement("div");
  div.className = "block-text";
  div.setAttribute("data-block-index", blockIndex);

  const p = document.createElement("p");
  p.innerHTML = block.content || "Enter your text here...";
  p.setAttribute("data-editable", `projects.${projectIndex}.contentBlocks.${blockIndex}.content`);
  div.appendChild(p);

  return div;
}

function createTwoColumnBlock(block, projectIndex, blockIndex) {
  const div = document.createElement("div");
  div.className = "block-two-column";
  div.setAttribute("data-block-index", blockIndex);

  // Text column
  const textCol = document.createElement("div");
  textCol.className = "col-text";
  textCol.innerHTML = block.text || "Enter text here...";
  textCol.setAttribute("data-editable", `projects.${projectIndex}.contentBlocks.${blockIndex}.text`);
  div.appendChild(textCol);

  // Image column
  const imgCol = document.createElement("div");
  imgCol.className = "col-image";
  if (block.imageSrc) {
    imgCol.style.backgroundImage = `url("${block.imageSrc}")`;
    imgCol.style.backgroundSize = "contain";
    imgCol.style.backgroundRepeat = "no-repeat";
    imgCol.style.backgroundPosition = "center";
    applyDynamicAspectRatio(imgCol, block.imageSrc);
  } else {
    imgCol.style.backgroundColor = block.imageColor || "#E0E0E0";
  }

  const overlay = document.createElement("div");
  overlay.className = "image-upload-overlay";
  overlay.style.borderRadius = "12px";
  overlay.innerHTML = "<span>Click/Drag</span>";
  setupImageUpload(overlay, (dataUrl) => {
    block.imageSrc = dataUrl;
    imgCol.style.backgroundImage = `url("${dataUrl}")`;
    imgCol.style.backgroundColor = "transparent";
    imgCol.style.backgroundSize = "contain";
    imgCol.style.backgroundRepeat = "no-repeat";
    imgCol.style.backgroundPosition = "center";
    applyDynamicAspectRatio(imgCol, dataUrl);
    saveData();
  });
  imgCol.appendChild(overlay);
  div.appendChild(imgCol);

  return div;
}

function createVideoBlock(block, projectIndex, blockIndex) {
  const div = document.createElement("div");
  div.className = "block-video";
  div.setAttribute("data-block-index", blockIndex);

  if (block.url) {
    let embedUrl = block.url.trim();
    // Auto-convert Google Drive viewer links to embeddable preview links
    if (embedUrl.includes("drive.google.com/file/d/") && embedUrl.includes("/view")) {
      embedUrl = embedUrl.replace(/\/view.*$/, "/preview");
    }
    // Auto-convert standard YouTube watch URLs to embed URLs
    else if (embedUrl.includes("youtube.com/watch?v=")) {
      const videoId = embedUrl.split("v=")[1].split("&")[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    const iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    div.appendChild(iframe);
  } else {
    div.style.backgroundColor = block.color || "#999";
  }

  const overlay = document.createElement("div");
  overlay.className = "image-upload-overlay";
  overlay.innerHTML = "<span>Click to enter video URL</span>";
  overlay.onclick = (e) => {
    e.stopPropagation();
    if (document.body.classList.contains("edit-mode")) {
      const currentUrl = block.url || "";
      let url = prompt("Enter video URL (Google Drive, YouTube, or Vimeo):", currentUrl);
      if (url !== null) {
        block.url = url.trim();
        saveData();
        const projectId = getProjectIdFromURL();
        const project = getProjectById(projectId);
        if (project) {
          renderContentBlocks(project, PORTFOLIO_DATA.projects.indexOf(project));
          setupScrollAnimations();
          if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
        }
      }
    }
  };
  div.appendChild(overlay);

  return div;
}

// ============================================================
// SCROLL ANIMATIONS (Intersection Observer)
// ============================================================
function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  // Observe all animatable elements
  const targets = document.querySelectorAll(
    ".project-card, .block-full-image, .block-image-grid, .block-text, .block-two-column, .block-video"
  );
  targets.forEach(el => observer.observe(el));
}

// ============================================================
// IMAGE PICKER / DRAG UPLOADER
// ============================================================
let lastAssetDir = null;

function getProjectAssetDir() {
  if (typeof isProjectPage === "function" && isProjectPage()) {
    const projectId = getProjectIdFromURL();
    const project = getProjectById(projectId);
    if (project) {
      const paths = [];
      if (project.cardImage) paths.push(project.cardImage);
      (project.contentBlocks || []).forEach(b => {
        if (b.src) paths.push(b.src);
        if (b.imageSrc) paths.push(b.imageSrc);
        if (b.images) b.images.forEach(img => { if (img.src) paths.push(img.src); });
      });

      for (let p of paths) {
        if (typeof p === "string" && p.startsWith("assets/")) {
          return p.substring(0, p.lastIndexOf("/") + 1);
        }
      }
    }
  }
  return "assets/";
}

function setupImageUpload(overlay, callback) {
  function handleFile(file) {
    if (!file) return;

    if (lastAssetDir === null) {
      lastAssetDir = getProjectAssetDir();
    }

    const url = prompt("Confirm image path. You can add your subfolder here:", lastAssetDir + file.name);
    if (url && url.trim() !== "") {
      const trimmed = url.trim();
      const slashIdx = trimmed.lastIndexOf("/");
      if (slashIdx !== -1) {
        lastAssetDir = trimmed.substring(0, slashIdx + 1);
      }
      callback(trimmed);
    }
  }

  overlay.onclick = (e) => {
    e.stopPropagation();
    if (document.body.classList.contains("edit-mode")) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => handleFile(e.target.files[0]);
      input.click();
    }
  };

  overlay.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (document.body.classList.contains("edit-mode")) {
      overlay.style.background = "rgba(0, 68, 255, 0.4)";
    }
  });

  overlay.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    overlay.style.background = "";
  });

  overlay.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    overlay.style.background = "";
    if (document.body.classList.contains("edit-mode") && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
}

// ============================================================
// ADD NEW PROJECT (from homepage edit mode)
// ============================================================
function addNewProject() {
  const id = "project-" + (PORTFOLIO_DATA.projects.length + 1) + "-" + Date.now();
  const colors = ["#6B4C1E", "#1A6B1A", "#0044FF", "#8B1A1A", "#4A1A6B", "#1A4A6B"];
  const color = colors[PORTFOLIO_DATA.projects.length % colors.length];

  PORTFOLIO_DATA.projects.push({
    id: id,
    title: "New Project",
    cardColor: color,
    cardImage: null,
    description: "Project description goes here.",
    role: "Your Role",
    type: "Project Type",
    client: "Client Name",
    agency: "Agency Name",
    contentBlocks: [
      { type: "full-image", src: null, color: color, label: "VISUALS" },
      {
        type: "image-grid", columns: 3,
        images: [
          { src: null, color: color },
          { src: null, color: color },
          { src: null, color: color }
        ]
      }
    ]
  });

  saveData();
  renderProjectsGrid();
  setupScrollAnimations();
  setupDragAndDrop();
  showToast("Project added!");
}

// ============================================================
// ADD CONTENT BLOCK (from project edit mode)
// ============================================================
function addContentBlock(type) {
  const projectId = getProjectIdFromURL();
  const project = getProjectById(projectId);
  if (!project) return;

  const projectIndex = PORTFOLIO_DATA.projects.indexOf(project);
  const color = project.cardColor || "#999";

  let newBlock;
  switch (type) {
    case "full-image":
      newBlock = { type: "full-image", src: null, color: color, label: "SECTION TITLE" };
      break;
    case "image-grid":
      newBlock = {
        type: "image-grid", columns: 3,
        images: [
          { src: null, color: color },
          { src: null, color: color },
          { src: null, color: color }
        ]
      };
      break;
    case "text":
      newBlock = { type: "text", content: "Enter your text here..." };
      break;
    case "two-column":
      newBlock = { type: "two-column", text: "Enter text here...", imageSrc: null, imageColor: color };
      break;
    case "video":
      newBlock = { type: "video", url: null, color: color };
      break;
  }

  project.contentBlocks.push(newBlock);
  saveData();
  renderContentBlocks(project, projectIndex);
  setupScrollAnimations();
  if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
  showToast("Block added!");
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  renderNav();

  if (isProjectPage()) {
    renderProjectPage();
  } else {
    renderHomepage();
  }

  // Global fix: Ensure all external links open in a new tab
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.href && (a.href.startsWith("http") || a.href.startsWith("https")) && !a.href.includes(window.location.hostname)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  });
});
