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
  document.body.classList.add("is-transitioning");
  overlay.classList.add("active");
  setTimeout(() => {
    window.location.href = url;
  }, 180);
}

// ============================================================
// RENDER: Site Header & Notch Nav
// ============================================================
function renderNav() {
  const logo = document.getElementById("notchLogo");
  const links = document.getElementById("notchLinks");
  if (!logo || !links) return;

  logo.textContent = PORTFOLIO_DATA.site.logo;
  logo.onclick = () => {
    if (isProjectPage()) {
      navigateTo("index.html");
    } else {
      switchView("work");
    }
  };

  links.innerHTML = "";
  PORTFOLIO_DATA.site.navLinks.forEach(link => {
    const a = document.createElement("a");
    a.className = "notch-link";
    a.textContent = link.label;
    a.href = link.href;
    if (link.href.startsWith("#")) {
      a.onclick = (e) => {
        e.preventDefault();
        const targetId = link.href.substring(1);
        if (targetId === "about") {
          if (isProjectPage()) {
            navigateTo("index.html#about");
          } else {
            switchView("about");
          }
        } else if (targetId === "contact") {
          if (isProjectPage()) {
            navigateTo("index.html#contact");
          } else {
            const targetEl = document.getElementById("contact");
            if (targetEl) {
              const frame = document.getElementById("siteFrame");
              if (frame) {
                frame.scrollTo({ top: targetEl.offsetTop - 80, behavior: "smooth" });
              } else {
                targetEl.scrollIntoView({ behavior: "smooth" });
              }
            }
          }
        }
      };
    } else {
      a.href = link.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    links.appendChild(a);
  });

  // Scroll listener: handle visibility on scroll direction
  const frame = document.getElementById("siteFrame");
  const header = document.getElementById("siteHeader");
  let lastScrollTop = 0;

  if (frame && header) {
    frame.addEventListener("scroll", () => {
      const st = frame.scrollTop;
      
      // Hide on scroll down, show on scroll up
      if (st > lastScrollTop && st > 100) {
        header.classList.add("header-hidden");
      } else {
        header.classList.remove("header-hidden");
      }
      
      lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
    });
  }
}

// ============================================================
// RENDER: Homepage
// ============================================================
function renderHomepage() {
  renderHero();
  renderProjectsGrid();
  renderAbout();
  
  // Initial view based on hash
  if (window.location.hash === "#about") {
    switchView("about");
  } else {
    switchView("work");
  }
}

function switchView(view) {
  const workView = document.getElementById("workView");
  const aboutView = document.getElementById("aboutView");
  const logo = document.getElementById("notchLogo");
  const aboutLink = Array.from(document.querySelectorAll(".notch-link")).find(a => a.textContent === "About");

  if (view === "about") {
    if (workView) workView.style.display = "none";
    if (aboutView) aboutView.style.display = "block";
    window.location.hash = "about";
    if (aboutLink) aboutLink.classList.add("active");
    window.scrollTo(0, 0);
  } else {
    if (aboutView) aboutView.style.display = "none";
    if (workView) workView.style.display = "block";
    history.pushState("", document.title, window.location.pathname + window.location.search);
    if (aboutLink) aboutLink.classList.remove("active");
    window.scrollTo(0, 0);
  }
}

// Global hash listener for browser back/forward
window.addEventListener("hashchange", () => {
  if (!isProjectPage()) {
    if (window.location.hash === "#about") {
      switchView("about");
    } else {
      switchView("work");
    }
  }
});

function renderAbout() {
  const container = document.getElementById("about");
  if (!container || !PORTFOLIO_DATA.about) return;
  const a = PORTFOLIO_DATA.about;

  // Experience rows
  const expRows = (a.experience || []).map((e, i) => `
    <div class="about-exp-row">
      <span class="about-exp-year" data-editable="about.experience.${i}.year">${e.year}</span>
      <span class="about-exp-agency" data-editable="about.experience.${i}.agency">${e.agency}</span>
      <span class="about-exp-role" data-editable="about.experience.${i}.role">${e.role}</span>
    </div>
  `).join("");

  // Award rows
  const awardRows = (a.awards || []).map((aw, i) => `
    <div class="about-award-row">
      <span class="about-award-name" data-editable="about.awards.${i}.name">${aw.name}</span>
      <span class="about-award-meta">
        <span data-editable="about.awards.${i}.campaign">${aw.campaign}</span>
        &nbsp;·&nbsp;
        <span data-editable="about.awards.${i}.body">${aw.body}</span>
        &nbsp;·&nbsp;
        <span data-editable="about.awards.${i}.year">${aw.year}</span>
      </span>
    </div>
  `).join("");

  // Capability pills
  const capPills = (a.capabilities || []).map((c, i) => `
    <span class="about-pill" data-editable="about.capabilities.${i}">${c}</span>
  `).join("");

  // Client names
  const clientNames = (a.clients || []).map((c, i) => `
    <span class="about-client" data-editable="about.clients.${i}">${c}</span>
  `).join("");

  // Side project cards
  const sideCards = (a.sideProjects || []).map((p, i) => `
    <a class="about-project-card" href="${p.href}" target="_blank" rel="noopener noreferrer">
      <div class="about-project-card-content">
        <span class="about-project-title" data-editable="about.sideProjects.${i}.title">${p.title}</span>
        <span class="about-project-desc" data-editable="about.sideProjects.${i}.description">${p.description}</span>
      </div>
      <span class="about-project-arrow">↗</span>
    </a>
  `).join("");

  // Press rows
  const pressRows = (a.press || []).map((p, i) => `
    <div class="about-award-row">
      <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="about-award-name" data-editable="about.press.${i}.name">${p.name} ↗</a>
      <span class="about-award-meta">
        <span data-editable="about.press.${i}.project">${p.project}</span>
        &nbsp;·&nbsp;
        <span data-editable="about.press.${i}.brand">${p.brand}</span>
      </span>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="about-container">

      <!-- Intro -->
      <div class="about-intro">
        <div class="about-intro-full">
          <p class="about-section-label">About</p>
          <div class="about-bio" data-editable="about.bio">${a.bio}</div>
        </div>
      </div>

      <div class="about-divider"></div>

      <!-- Experience & Awards -->
      <div class="about-two-col">
        <div class="about-col">
          <p class="about-section-label">Experience</p>
          <div class="about-experience">${expRows}</div>
        </div>
        <div class="about-col">
          <p class="about-section-label">Recognition</p>
          <div class="about-awards">${awardRows}</div>
          <div style="margin-top: 40px;">
            <p class="about-section-label">Selected Press</p>
            <div class="about-awards">${pressRows}</div>
          </div>
        </div>
      </div>

      <div class="about-divider"></div>

      <!-- Capabilities & Clients -->
      <div class="about-two-col">
        <div class="about-col">
          <p class="about-section-label">Capabilities</p>
          <div class="about-capabilities">${capPills}</div>
        </div>
        <div class="about-col">
          <p class="about-section-label">Clients</p>
          <div class="about-clients">${clientNames}</div>
        </div>
      </div>

      <div class="about-divider"></div>

      <!-- Side Projects -->
      <p class="about-section-label">Side Projects</p>
      <div class="about-side-projects">${sideCards}</div>

      <div class="about-divider"></div>

      <!-- Contact -->
      <div class="about-contact" id="contact">
        <p class="about-section-label">Let's Talk</p>
        <div class="about-contact-links">
          <a class="about-contact-link" href="mailto:${a.contact.email}" data-editable="about.contact.email">${a.contact.email}</a>
          <a class="about-contact-link" href="${a.contact.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        </div>
        <p class="about-footer-note">© ${new Date().getFullYear()} — Built with intent.</p>
      </div>

    </div>
  `;
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

    // Background: image (cover) or solid color
    const bgDiv = document.createElement("div");
    bgDiv.className = "project-card-bg";
    if (project.cardImage) {
      bgDiv.style.backgroundImage = `url("${project.cardImage}")`;
      bgDiv.style.backgroundSize = "cover";
      bgDiv.style.backgroundPosition = "center";
    } else {
      bgDiv.style.backgroundColor = project.cardColor;
    }
    card.appendChild(bgDiv);

    // Brand tag (top-left minimalist pill)
    const brandTag = document.createElement("div");
    brandTag.className = "project-brand-tag";
    // Derive brand name from client or title
    const brandName = project.client || "";
    if (brandName) {
      const pill = document.createElement("span");
      pill.className = "brand-pill";
      pill.textContent = brandName;
      brandTag.appendChild(pill);
    }
    card.appendChild(brandTag);

    // Image upload overlay (visible in edit mode)
    const uploadOverlay = document.createElement("div");
    uploadOverlay.className = "image-upload-overlay";
    uploadOverlay.innerHTML = "<span>Click or Drag image here</span>";
    setupImageUpload(uploadOverlay, (dataUrl) => {
      project.cardImage = dataUrl;
      bgDiv.style.backgroundImage = `url("${dataUrl}")`;
      bgDiv.style.backgroundColor = "transparent";
      bgDiv.style.backgroundSize = "cover";
      bgDiv.style.backgroundPosition = "center";
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

  if (typeof enableInlineEditing === "function" && window.editMode) {
    enableInlineEditing();
  }
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
      <div class="project-info-description" data-editable="projects.${projectIndex}.description">${project.description}</div>
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

  if (typeof enableInlineEditing === "function" && window.editMode) {
    enableInlineEditing();
  }
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
    // Auto-convert YouTube URLs (watch, youtu.be, shorts)
    else if (embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be")) {
      const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = embedUrl.match(ytRegex);
      if (match && match[1]) {
        embedUrl = `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    // Auto-convert Vimeo URLs
    else if (embedUrl.includes("vimeo.com")) {
      const vimeoRegex = /vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/;
      const match = embedUrl.match(vimeoRegex);
      if (match && match[1]) {
        embedUrl = `https://player.vimeo.com/video/${match[1]}`;
      }
    }

    const iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    // Fix YouTube Error 153 (video player configuration error)
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
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
          if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
        }
      }
    }
  };
  div.appendChild(overlay);

  return div;
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
