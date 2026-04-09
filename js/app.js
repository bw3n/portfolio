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

function stripHTML(value = "") {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function slugifyProjectTitle(value = "") {
  return stripHTML(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getProjectSlug(project) {
  if (!project) return "";

  const baseSlug = slugifyProjectTitle(project.title || project.id || "project");
  const duplicates = PORTFOLIO_DATA.projects.filter(candidate => {
    return slugifyProjectTitle(candidate.title || candidate.id || "project") === baseSlug;
  });

  if (duplicates.length <= 1) return baseSlug;

  const duplicateIndex = duplicates.findIndex(candidate => candidate.id === project.id);
  return duplicateIndex <= 0 ? baseSlug : `${baseSlug}-${duplicateIndex + 1}`;
}

function getProjectIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("project");
}

function getProjectById(id) {
  if (!id) return null;

  return PORTFOLIO_DATA.projects.find((project) => {
    return project.id === id || getProjectSlug(project) === id;
  }) || null;
}

function getProjectCategory(project) {
  return project.category === "lab" ? "lab" : "work";
}

function getHomeViewFromHash() {
  if (window.location.hash === "#work") return "work";
  if (window.location.hash === "#about") return "about";
  if (window.location.hash === "#contact") return "about";
  if (window.location.hash === "#lab") return "lab";
  return "work";
}

function getActiveNavId(view, options = {}) {
  if (options.activeNavId) return options.activeNavId;
  return view;
}

function getAwardTier(label = "") {
  const value = label.toLowerCase();
  if (value.includes("gold")) return "gold";
  if (value.includes("silver")) return "silver";
  if (value.includes("bronze")) return "bronze";
  return "gold";
}

function getAwardMedalIcon(tier) {
  return `
    <span class="about-award-medal about-award-medal--${tier}" aria-hidden="true">
      <svg viewBox="0 0 24 28" role="presentation" focusable="false" aria-hidden="true">
        <path class="medal-ribbon medal-ribbon-left" d="M6 1h6l-2.4 8.2L4.4 6.1z"></path>
        <path class="medal-ribbon medal-ribbon-right" d="M12 1h6l1.6 5.1-5.8 3.1z"></path>
        <circle class="medal-face" cx="12" cy="16" r="6.7"></circle>
        <circle class="medal-highlight" cx="12" cy="14.2" r="2.1"></circle>
      </svg>
    </span>
  `;
}

function getExperienceBrandMeta(agency = "") {
  const value = agency.toLowerCase();

  if (value.includes("digitas")) {
    return {
      logoSrc: "assets/digitas-publicis.png",
      logoAlt: "Digitas Publicis",
      logoScale: 0.95,
      tone: "digitas",
    };
  }

  if (value.includes("goodstuph")) {
    return {
      logoSrc: "assets/goodstuph.png",
      logoAlt: "GOODSTUPH",
      logoScale: 1.155,
      tone: "goodstuph",
    };
  }

  if (value.includes("snackereco")) {
    return {
      logoSrc: "assets/snackereco.png",
      logoAlt: "Snackereco",
      tone: "snackereco",
    };
  }

  if (value.includes("facebook") || value.includes("meta")) {
    return {
      logoSrc: "assets/meta.png",
      logoAlt: "Facebook (Meta)",
      logoScale: 0.75,
      tone: "meta",
    };
  }

  if (value.includes("freelance")) {
    return {
      logoSrc: "assets/freelance.png",
      logoAlt: "Freelance",
      logoScale: 0.6,
      tone: "freelance",
    };
  }

  const initials = agency
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase() || "•";

  return { initials, tone: "default" };
}

function getEmbedUrl(url) {
  if (!url) return "";

  const trimmedUrl = url.trim();

  const driveMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  const youtubeMatch = trimmedUrl.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (youtubeMatch && youtubeMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`;
  }

  const vimeoMatch = trimmedUrl.match(/vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmedUrl;
}

function renderAnimatedHeadlineLines(text = "") {
  return text
    .split(/<br\s*\/?>/i)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => `<span class="line"${index > 0 ? ` style="animation-delay:${(index * 0.12).toFixed(2)}s"` : ""}>${line}</span>`)
    .join("");
}

// --- Page Transition ---
function navigateTo(url) {
  window.location.href = url;
}

function initProjectViewCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  let cursor = document.getElementById("projectViewCursor");
  if (!cursor) {
    cursor = document.createElement("div");
    cursor.id = "projectViewCursor";
    cursor.className = "project-view-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = `<span class="project-view-cursor__label">View</span>`;
    document.body.appendChild(cursor);
  }

  const deactivateCursor = () => {
    cursor.classList.remove("is-active");
    document.body.classList.remove("has-custom-view-cursor");
  };

  document.addEventListener("mousemove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;

    const activeCard = event.target.closest(".project-card");
    const shouldActivate = Boolean(activeCard) && !document.body.classList.contains("edit-mode");

    if (shouldActivate) {
      cursor.classList.add("is-active");
      document.body.classList.add("has-custom-view-cursor");
      return;
    }

    deactivateCursor();
  });

  document.addEventListener("mouseleave", deactivateCursor);
  window.addEventListener("blur", deactivateCursor);
}

function updateNavHighlight(targetLink = null) {
  const linksContainer = document.getElementById("notchLinks");
  if (!linksContainer) return;

  const highlight = linksContainer.querySelector(".notch-active-pill");
  const navLinks = Array.from(linksContainer.querySelectorAll(".notch-link"));
  const activeLink = targetLink || linksContainer.querySelector(".notch-link.active");
  if (!highlight) return;

  navLinks.forEach(link => link.classList.remove("is-highlighted"));

  if (!activeLink) {
    highlight.style.opacity = "0";
    return;
  }

  activeLink.classList.add("is-highlighted");

  const left = activeLink.offsetLeft;
  const width = activeLink.offsetWidth;

  highlight.style.width = `${width}px`;
  highlight.style.transform = `translateX(${left}px)`;
  highlight.style.opacity = "1";
}

function scheduleNavHighlightUpdate(targetLink = null) {
  window.requestAnimationFrame(() => updateNavHighlight(targetLink));
}

const homepageRenderState = {
  work: false,
  lab: false,
  about: false,
};

function ensureHomepageViewRendered(view) {
  if (view === "lab") {
    if (!homepageRenderState.lab) {
      renderLabHero();
      renderProjectsGrid("lab");
      homepageRenderState.lab = true;
    }
    return;
  }

  if (view === "about") {
    if (!homepageRenderState.about) {
      renderAbout();
      homepageRenderState.about = true;
    }
    return;
  }

  if (!homepageRenderState.work) {
    renderHero();
    renderProjectsGrid("work");
    homepageRenderState.work = true;
  }
}

function wireInternalNavLink(a, href) {
  a.href = href;

  if (!href.startsWith("#")) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return;
  }

  a.onclick = (e) => {
    e.preventDefault();
    const targetId = href.substring(1);

    if (targetId === "work") {
      if (isProjectPage()) {
        navigateTo("index.html");
      } else {
        switchView("work");
      }
      return;
    }

    if (targetId === "lab") {
      if (isProjectPage()) {
        navigateTo("index.html#lab");
      } else {
        switchView("lab");
      }
      return;
    }

    if (targetId === "about") {
      if (isProjectPage()) {
        navigateTo("index.html#about");
      } else {
        switchView("about");
      }
      return;
    }

    if (targetId === "contact") {
      if (isProjectPage()) {
        navigateTo("index.html#contact");
      } else {
        switchView("about", { scrollToId: "contact", activeNavId: "contact" });
      }
    }
  };
}

// ============================================================
// RENDER: Site Header & Notch Nav
// ============================================================
function renderNav() {
  const logo = document.getElementById("notchLogo");
  const links = document.getElementById("notchLinks");
  const linksShell = document.querySelector(".notch-links-shell");
  const header = document.getElementById("siteHeader");
  if (!logo || !links) return;

  if (PORTFOLIO_DATA.site.logoImage) {
    const alt = PORTFOLIO_DATA.site.logoAlt || PORTFOLIO_DATA.site.logo || "Logo";
    logo.innerHTML = `<img src="${PORTFOLIO_DATA.site.logoImage}" alt="${alt}" class="site-logo-mark">`;
  } else {
    logo.textContent = PORTFOLIO_DATA.site.logo;
  }

  logo.onclick = () => {
    if (isProjectPage()) {
      navigateTo("index.html");
    } else {
      switchView("work");
    }
  };

  links.innerHTML = "";
  const highlight = document.createElement("span");
  highlight.className = "notch-active-pill";
  links.appendChild(highlight);

  PORTFOLIO_DATA.site.navLinks.forEach(link => {
    const a = document.createElement("a");
    a.className = "notch-link";
    a.textContent = link.label;
    wireInternalNavLink(a, link.href);
    a.addEventListener("mouseenter", () => scheduleNavHighlightUpdate(a));
    a.addEventListener("focus", () => scheduleNavHighlightUpdate(a));
    links.appendChild(a);
  });

  scheduleNavHighlightUpdate();

  if (linksShell) {
    linksShell.onmouseleave = () => scheduleNavHighlightUpdate();
  }

  if (header && !header.dataset.scrollListenerBound) {
    let lastScrollTop = 0;
    const handleHeaderScroll = () => {
      const st = window.scrollY || document.documentElement.scrollTop;

      // Hide on scroll down, show on scroll up
      if (st > lastScrollTop && st > 100) {
        header.classList.add("header-hidden");
      } else {
        header.classList.remove("header-hidden");
      }

      lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
    };

    window.addEventListener("scroll", handleHeaderScroll, { passive: true });
    header.dataset.scrollListenerBound = "true";
  }
}

// ============================================================
// RENDER: Homepage
// ============================================================
function renderHomepage() {
  homepageRenderState.work = false;
  homepageRenderState.lab = false;
  homepageRenderState.about = false;

  const initialView = getHomeViewFromHash();
  ensureHomepageViewRendered(initialView);

  if (window.location.hash === "#contact") {
    switchView("about", { scrollToId: "contact", activeNavId: "contact" });
  } else {
    switchView(initialView);
  }
}

function renderFooter() {
  const footer = document.getElementById("siteFooter");
  if (!footer) return;

  const logoSrc = PORTFOLIO_DATA.site.logoImage;
  const logoAlt = PORTFOLIO_DATA.site.logoAlt || PORTFOLIO_DATA.site.logo || "Boon";
  const contact = PORTFOLIO_DATA.about?.contact || {};

  footer.innerHTML = `
    <div class="site-footer-inner">
      <button class="site-footer-toplink" id="siteFooterToplink" type="button">Scroll to top</button>
      <div class="site-footer-top">
        <div class="site-footer-brand">
          ${logoSrc
            ? `<img src="${logoSrc}" alt="${logoAlt}" class="site-footer-logo-mark">`
            : `<span class="site-footer-wordmark">${PORTFOLIO_DATA.site.logo || "Boon"}</span>`
          }
        </div>
        <div class="site-footer-meta">
          <p class="site-footer-kicker">Get in touch</p>
          <a class="site-footer-link" href="mailto:${contact.email || ""}">${contact.email || ""}</a>
          <a class="site-footer-link site-footer-link--secondary" href="${contact.linkedin || "#"}" target="_blank" rel="noopener noreferrer">LinkedIn -></a>
        </div>
      </div>
    </div>
  `;

  const toplink = document.getElementById("siteFooterToplink");
  if (toplink) {
    toplink.onclick = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        footer.classList.toggle("footer-reveal-active", entry.isIntersecting);
      });
    }, {
      threshold: 0.2,
      rootMargin: "0px 0px -8% 0px"
    });

    observer.observe(footer);
  } else {
    footer.classList.add("footer-reveal-active");
  }
}

function switchView(view, options = {}) {
  ensureHomepageViewRendered(view);

  const workView = document.getElementById("workView");
  const labView = document.getElementById("labView");
  const aboutView = document.getElementById("aboutView");
  const navLinks = Array.from(document.querySelectorAll(".notch-link"));
  const scrollToId = options.scrollToId;
  const activeNavId = getActiveNavId(view, options);
  const targetHash = activeNavId === "contact" || scrollToId === "contact"
    ? "contact"
    : view;

  navLinks.forEach(link => link.classList.remove("active"));

  if (workView) workView.style.display = view === "work" ? "block" : "none";
  if (labView) labView.style.display = view === "lab" ? "block" : "none";
  if (aboutView) aboutView.style.display = view === "about" ? "block" : "none";

  if (window.location.hash !== `#${targetHash}`) {
    window.location.hash = targetHash;
  }

  const activeLink = navLinks.find(link => {
    return link.getAttribute("href") === `#${activeNavId}`;
  });
  if (activeLink) activeLink.classList.add("active");
  scheduleNavHighlightUpdate();

  if (scrollToId) {
    requestAnimationFrame(() => {
      const targetEl = document.getElementById(scrollToId);
      if (targetEl) {
        const top = targetEl.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  } else {
    window.scrollTo(0, 0);
  }
}

// Global hash listener for browser back/forward
window.addEventListener("hashchange", () => {
  if (!isProjectPage()) {
    if (window.location.hash === "#contact") {
      switchView("about", { scrollToId: "contact", activeNavId: "contact" });
      return;
    }
    switchView(getHomeViewFromHash());
  }
});

function renderAbout() {
  const container = document.getElementById("aboutSection");
  if (!container || !PORTFOLIO_DATA.about) return;
  const a = PORTFOLIO_DATA.about;
  const heroHeadline = a.heroHeadline || "Ideas, designed to work";

  // Experience rows
  const expRows = (a.experience || []).map((e, i) => `
    <div class="about-exp-row">
      <div class="about-exp-branding">
        ${(() => {
          const brand = getExperienceBrandMeta(e.agency);
          if (brand.logoSrc) {
            const logoStyle = brand.logoScale ? ` style=\"--brand-logo-scale:${brand.logoScale}\"` : "";
            return `
              <span class="about-exp-brand about-exp-brand--logo about-exp-brand--${brand.tone}" aria-hidden="true">
                <img src="${brand.logoSrc}" alt="${brand.logoAlt || e.agency}" class="about-exp-brand-image"${logoStyle}>
              </span>
            `;
          }

          return `
            <span class="about-exp-brand about-exp-brand--${brand.tone}" aria-hidden="true">${brand.initials}</span>
          `;
        })()}
        <span class="about-exp-agency" data-editable="about.experience.${i}.agency">${e.agency}</span>
      </div>
      <div class="about-exp-meta">
        <span class="about-exp-role" data-editable="about.experience.${i}.role">${e.role}</span>
        <span class="about-exp-year" data-editable="about.experience.${i}.year">${e.year}</span>
      </div>
    </div>
  `).join("");

  // Award rows
  const awardRows = (a.awards || []).map((aw, i) => `
    <div class="about-award-row">
      <div class="about-award-heading">
        ${getAwardMedalIcon(getAwardTier(aw.name))}
        <span class="about-award-name" data-editable="about.awards.${i}.name">${aw.name}</span>
      </div>
      <span class="about-award-meta">
        <span data-editable="about.awards.${i}.campaign">${aw.campaign}</span>
         &middot; 
        <span data-editable="about.awards.${i}.body">${aw.body}</span>
         &middot; 
        <span data-editable="about.awards.${i}.year">${aw.year}</span>
      </span>
    </div>
  `).join("");

  // Capability pills
  const capPills = (a.capabilities || []).map((c, i) => `
    <span class="about-pill" data-editable="about.capabilities.${i}">${c}</span>
  `).join("");

  // Client names
  const clientNames = (a.clients || []).map((client, i) => {
    if (typeof client === "object" && client?.logoSrc) {
      const name = client.name || `Client ${i + 1}`;
      const styleParts = [];
      if (client.logoWidth) styleParts.push(`--logo-width:${client.logoWidth}px`);
      if (client.logoHeight) styleParts.push(`--logo-height:${client.logoHeight}px`);
      const stageStyle = styleParts.length ? ` style="${styleParts.join(";")}"` : "";
      return `
        <span class="about-client about-client--logo" data-editable="about.clients.${i}.name">
          <span class="about-client-logo-stage"${stageStyle}>
            <img src="${client.logoSrc}" alt="${name}" class="about-client-logo">
          </span>
        </span>
      `;
    }

    return `
      <span class="about-client" data-editable="about.clients.${i}">${client}</span>
    `;
  }).join("");

  // Press rows
  const pressRows = (a.press || []).map((p, i) => `
    <div class="about-award-row">
      <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="about-award-name" data-editable="about.press.${i}.name">${p.name} -></a>
      <span class="about-award-meta">
        <span data-editable="about.press.${i}.project">${p.project}</span>
         &middot; 
        <span data-editable="about.press.${i}.brand">${p.brand}</span>
      </span>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="about-container">

      <!-- Intro -->
      <div class="about-intro">
        <div class="about-intro-full about-hero-block">
          <p class="about-section-label">About</p>
          <div class="about-hero-copy">
            <h1 class="about-hero-headline" data-editable="about.heroHeadline">${renderAnimatedHeadlineLines(heroHeadline)}</h1>
            <div class="about-bio about-bio--intro" data-editable="about.bio">${a.bio}</div>
          </div>
        </div>
      </div>

      <div class="about-divider"></div>

      <!-- Experience & Awards -->
      <div class="about-two-col">
        <div class="about-col about-col--left">
          <div class="about-section-group about-section-group--experience">
            <p class="about-section-label">Experience</p>
            <div class="about-experience">${expRows}</div>
          </div>
          <div class="about-section-group about-section-group--capabilities">
            <p class="about-section-label">Capabilities</p>
            <div class="about-capabilities">${capPills}</div>
          </div>
          <div class="about-section-group about-section-group--clients">
            <p class="about-section-label">Clients</p>
            <div class="about-clients">${clientNames}</div>
          </div>
        </div>
        <div class="about-col about-col--right">
          <div class="about-section-group about-section-group--recognition">
            <p class="about-section-label">Recognition</p>
            <div class="about-awards">${awardRows}</div>
          </div>
          <div class="about-section-group about-section-group--press">
            <p class="about-section-label">Selected Press</p>
            <div class="about-awards">${pressRows}</div>
          </div>
        </div>
      </div>

      <div class="about-divider"></div>

      <!-- Contact -->
      <div class="about-contact" id="contact">
        <p class="about-section-label">Let's Talk</p>
        <div class="about-contact-links">
          <a class="about-contact-link" href="mailto:${a.contact.email}" data-editable="about.contact.email">${a.contact.email}</a>
          <a class="about-contact-link" href="${a.contact.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn -></a>
        </div>
      </div>

    </div>
  `;
}

function renderHero() {
  const container = document.getElementById("heroTitle");
  if (!container) return;

  const line1 = PORTFOLIO_DATA.site.heroLine1;
  const line2 = PORTFOLIO_DATA.site.heroLine2;

  container.innerHTML = renderAnimatedHeadlineLines(`${line1}<br>${line2}`);
}

function renderLabHero() {
  const container = document.getElementById("labTitle");
  if (!container) return;

  const line1 = PORTFOLIO_DATA.site.labLine1 || "Experiments, ideas and vibes";
  const line2 = PORTFOLIO_DATA.site.labLine2 || "";

  container.innerHTML = renderAnimatedHeadlineLines(`${line1}<br>${line2}`);
}

function renderProjectsGrid(category = "work") {
  const grid = document.getElementById(category === "lab" ? "labProjectsGrid" : "projectsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  PORTFOLIO_DATA.projects.forEach((project, index) => {
    if (getProjectCategory(project) !== category) return;

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
          renderProjectsGrid("work");
          renderProjectsGrid("lab");
          if (typeof setupDragAndDrop === 'function') setupDragAndDrop();
        }
      }
    };
    card.appendChild(deleteBtn);

    // Click to navigate (only when not in edit mode)
    card.addEventListener("click", () => {
      if (!document.body.classList.contains("edit-mode")) {
        navigateTo(`project.html?project=${encodeURIComponent(getProjectSlug(project))}`);
      }
    });

    grid.appendChild(card);
  });

  if (typeof enableInlineEditing === "function" && window.editMode) {
    enableInlineEditing();
    if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
    if (typeof setupThumbnailDragAndDrop === "function") setupThumbnailDragAndDrop();
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

  const canonicalSlug = getProjectSlug(project);
  const currentProjectParam = getProjectIdFromURL();
  if (canonicalSlug && currentProjectParam !== canonicalSlug) {
    const canonicalUrl = `project.html?project=${encodeURIComponent(canonicalSlug)}`;
    window.history.replaceState({}, "", canonicalUrl);
  }

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
      const dragHandle = document.createElement("button");
      dragHandle.className = "block-drag-handle";
      dragHandle.type = "button";
      dragHandle.title = "Drag to reorder";
      dragHandle.innerHTML = "⋮⋮";
      dragHandle.setAttribute("aria-label", "Drag to reorder block");
      el.appendChild(dragHandle);

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
    case "two-image":
      return createTwoImageBlock(block, projectIndex, blockIndex);
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
    item.setAttribute("data-image-index", imgIndex);

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

    const thumbHandle = document.createElement("button");
    thumbHandle.className = "thumbnail-drag-handle";
    thumbHandle.type = "button";
    thumbHandle.title = "Drag to reorder image";
    thumbHandle.innerHTML = "⋮⋮";
    thumbHandle.setAttribute("aria-label", "Drag to reorder image");
    item.appendChild(thumbHandle);

    div.appendChild(item);
  });

  return div;
}

function createTwoImageBlock(block, projectIndex, blockIndex) {
  const div = document.createElement("div");
  div.className = "block-two-image";
  div.setAttribute("data-block-index", blockIndex);

  const images = Array.isArray(block.images) ? block.images : [];
  while (images.length < 2) {
    images.push({ src: null, color: block.color || "#999" });
  }
  block.images = images.slice(0, 2);

  block.images.forEach((img, imgIndex) => {
    const item = document.createElement("div");
    item.className = "block-two-image-item";
    item.setAttribute("data-image-index", imgIndex);

    if (img.src) {
      item.style.backgroundImage = `url("${img.src}")`;
      item.style.backgroundSize = "contain";
      item.style.backgroundRepeat = "no-repeat";
      item.style.backgroundPosition = "center";
      applyDynamicAspectRatio(item, img.src);
    } else {
      item.style.backgroundColor = img.color || block.color || "#999";
    }

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

    const thumbHandle = document.createElement("button");
    thumbHandle.className = "thumbnail-drag-handle";
    thumbHandle.type = "button";
    thumbHandle.title = "Drag to reorder image";
    thumbHandle.innerHTML = "⋮⋮";
    thumbHandle.setAttribute("aria-label", "Drag to reorder image");
    item.appendChild(thumbHandle);

    if (img.src) {
      const clearBtn = document.createElement("button");
      clearBtn.className = "delete-element-btn delete-image-btn";
      clearBtn.innerHTML = "×";
      clearBtn.title = "Remove image";
      clearBtn.onclick = (e) => {
        e.stopPropagation();
        img.src = null;
        item.style.backgroundImage = "";
        item.style.backgroundColor = img.color || block.color || "#999";
        saveData();
        const projectId = getProjectIdFromURL();
        const project = getProjectById(projectId);
        if (project) {
          renderContentBlocks(project, PORTFOLIO_DATA.projects.indexOf(project));
          if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
        }
      };
      item.appendChild(clearBtn);
    }

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
    const iframe = document.createElement("iframe");
    iframe.src = getEmbedUrl(block.url);
    iframe.frameBorder = "0";
    iframe.title = "Embedded project video";
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
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
  const currentView = getHomeViewFromHash();
  const category = currentView === "lab" ? "lab" : "work";

  PORTFOLIO_DATA.projects.push({
    id: id,
    category: category,
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
  renderProjectsGrid("work");
  renderProjectsGrid("lab");
  setupDragAndDrop();
  showToast(category === "lab" ? "Lab project added!" : "Project added!");
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
    case "two-image":
      newBlock = {
        type: "two-image",
        color: color,
        images: [
          { src: null, color: color },
          { src: null, color: color }
        ]
      };
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
  renderFooter();
  initProjectViewCursor();

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

  window.addEventListener("resize", scheduleNavHighlightUpdate);
});




