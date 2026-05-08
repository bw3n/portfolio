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
  const resolvedSrc = resolveSitePath(src);

  if (isVideoAsset(src)) {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        el.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
      }
    };
    video.src = resolvedSrc;
    return;
  }

  const imgObj = new Image();
  imgObj.onload = () => {
    el.style.aspectRatio = `${imgObj.width} / ${imgObj.height}`;
  };
  imgObj.src = resolvedSrc;
}

// --- Utility: Detect which page we're on ---
function getProjectRouteSegments(pathname = window.location.pathname) {
  let normalizedPath = pathname.replace(/\\/g, "/");

  try {
    normalizedPath = decodeURIComponent(normalizedPath);
  } catch (error) {
    // Keep the raw pathname when decoding fails.
  }

  const routeMatch = normalizedPath.match(/(?:^|\/)(work|lab)\/([^/]+?)(?:\/index\.html?)?\/?$/i);
  if (!routeMatch) return null;

  return {
    section: routeMatch[1].toLowerCase(),
    slug: routeMatch[2],
  };
}

function isProjectPage() {
  return window.location.pathname.includes("project.html") ||
    window.location.search.includes("project=") ||
    Boolean(getProjectRouteSegments());
}

function decodeHTMLText(value = "") {
  if (typeof document === "undefined") {
    return value
      .replace(/&amp;/gi, "&")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"');
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function stripHTML(value = "") {
  return decodeHTMLText(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function getSiteRootPrefix(pathname = window.location.pathname) {
  if (window.location.protocol !== "file:") {
    let normalizedPath = pathname.replace(/\\/g, "/");

    try {
      normalizedPath = decodeURIComponent(normalizedPath);
    } catch (error) {
      // Keep the raw pathname when decoding fails.
    }

    const routeMatch = normalizedPath.match(/^(.*?)(?:\/(?:work|lab)\/[^/]+(?:\/index\.html?)?\/?)$/i);
    if (routeMatch) {
      const basePath = routeMatch[1] || "/";
      return basePath.endsWith("/") ? basePath : `${basePath}/`;
    }

    if (/\/(?:index|project)\.html?$/i.test(normalizedPath)) {
      return normalizedPath.replace(/\/(?:index|project)\.html?$/i, "/");
    }

    if (normalizedPath.endsWith("/")) return normalizedPath;

    const lastSlashIndex = normalizedPath.lastIndexOf("/");
    return lastSlashIndex >= 0 ? normalizedPath.slice(0, lastSlashIndex + 1) : "/";
  }
  const baseHref = typeof document !== "undefined"
    ? document.querySelector("base")?.getAttribute("href")
    : "";

  if (baseHref) {
    // Route pages opened directly from disk already set a <base href="../../">
    // so inline JS URLs should stay relative to that base instead of walking up again.
    return "./";
  }

  return getProjectRouteSegments(pathname) ? "../../" : "./";
}

function resolveSitePath(value = "") {
  if (!value) return "";

  if (
    /^(?:[a-z]+:)?\/\//i.test(value) ||
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("#")
  ) {
    return value;
  }

  if (value.startsWith("/")) return value;

  return `${getSiteRootPrefix()}${value.replace(/^\.\//, "")}`;
}

function isVideoAsset(value = "") {
  return /\.(?:webm|mp4|mov|m4v|ogv)(?:[?#].*)?$/i.test(value);
}

function createMediaElement(src, className, { autoplay = true, loop = true, muted = true, playsInline = true } = {}) {
  if (!src) return null;

  const resolvedSrc = resolveSitePath(src);
  if (!isVideoAsset(src)) return null;

  const video = document.createElement("video");
  video.className = className;
  video.src = resolvedSrc;
  video.autoplay = autoplay;
  video.loop = loop;
  video.muted = muted;
  video.playsInline = playsInline;
  video.defaultMuted = muted;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  if (autoplay) video.setAttribute("autoplay", "");
  if (loop) video.setAttribute("loop", "");
  return video;
}

function getProjectPath(project) {
  if (!project) return getHomePath();
  const projectSlug = getProjectSlug(project);
  return `${getSiteRootPrefix()}project.html?project=${encodeURIComponent(projectSlug)}`;
}

function getHomePath(hash = "") {
  const normalizedHash = hash
    ? (hash.startsWith("#") ? hash : `#${hash}`)
    : "";

  if (window.location.protocol !== "file:") {
    return normalizedHash ? `/${normalizedHash}` : "/";
  }

  return `${getSiteRootPrefix()}index.html${normalizedHash}`;
}

function getProjectIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("project") || getProjectRouteSegments()?.slug || "";
}

function getProjectById(id) {
  if (!id) return null;

  return PORTFOLIO_DATA.projects.find((project) => {
    return project.id === id || getProjectSlug(project) === id;
  }) || null;
}

function getProjectCategory(project) {
  if (project.category === "lab") return "lab";
  if (project.category === "ux") return "ux";
  return "work";
}

function getHomeViewFromHash() {
  if (window.location.hash === "#work") return "work";
  if (window.location.hash === "#ux") return "ux";
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

let navHighlightReturnTimer = null;

function updateNavHighlight(targetLink = null, options = {}) {
  const linksContainer = document.getElementById("notchLinks");
  if (!linksContainer) return;

  const highlight = linksContainer.querySelector(".notch-active-pill");
  const navLinks = Array.from(linksContainer.querySelectorAll(".notch-link"));
  const highlightedLink = targetLink instanceof Element && targetLink.classList.contains("notch-link")
    ? targetLink
    : null;
  const activeLink = highlightedLink || linksContainer.querySelector(".notch-link.active");
  if (!highlight) return;

  highlight.classList.toggle("is-returning", Boolean(options.isReturning));
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

function scheduleNavHighlightUpdate(targetLink = null, options = {}) {
  if (navHighlightReturnTimer) {
    window.clearTimeout(navHighlightReturnTimer);
    navHighlightReturnTimer = null;
  }

  window.requestAnimationFrame(() => updateNavHighlight(targetLink, options));
}

function scheduleNavHighlightReturn() {
  if (navHighlightReturnTimer) window.clearTimeout(navHighlightReturnTimer);

  navHighlightReturnTimer = window.setTimeout(() => {
    navHighlightReturnTimer = null;
    window.requestAnimationFrame(() => updateNavHighlight(null, { isReturning: true }));
  }, 300);
}

const homepageRenderState = {
  work: false,
  ux: false,
  lab: false,
  about: false,
};

function ensureHomepageViewRendered(view) {
  if (view === "ux") {
    if (!homepageRenderState.ux) {
      renderUxHero();
      renderProjectsGrid("ux");
      homepageRenderState.ux = true;
    }
    return;
  }

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
        navigateTo(getHomePath());
      } else {
        switchView("work");
      }
      return;
    }

    if (targetId === "ux") {
      if (isProjectPage()) {
        navigateTo(getHomePath("#ux"));
      } else {
        switchView("ux");
      }
      return;
    }

    if (targetId === "lab") {
      if (isProjectPage()) {
        navigateTo(getHomePath("#lab"));
      } else {
        switchView("lab");
      }
      return;
    }

    if (targetId === "about") {
      if (isProjectPage()) {
        navigateTo(getHomePath("#about"));
      } else {
        switchView("about");
      }
      return;
    }

    if (targetId === "contact") {
      if (isProjectPage()) {
        navigateTo(getHomePath("#contact"));
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
    logo.innerHTML = `<img src="${resolveSitePath(PORTFOLIO_DATA.site.logoImage)}" alt="${alt}" class="site-logo-mark">`;
  } else {
    logo.textContent = PORTFOLIO_DATA.site.logo;
  }

  logo.onclick = () => {
    if (isProjectPage()) {
      navigateTo(getHomePath());
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
    linksShell.onmouseleave = scheduleNavHighlightReturn;
  }

  if (header) {
    header.classList.remove("header-hidden");
  }
}

// ============================================================
// RENDER: Homepage
// ============================================================
function renderHomepage() {
  homepageRenderState.work = false;
  homepageRenderState.ux = false;
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

  const logoSrc = resolveSitePath(PORTFOLIO_DATA.site.logoImage);
  const logoAlt = PORTFOLIO_DATA.site.logoAlt || PORTFOLIO_DATA.site.logo || "Boon";
  const contact = PORTFOLIO_DATA.about?.contact || {};

  footer.innerHTML = `
    <div class="site-footer-inner">
      <button class="site-footer-toplink" id="siteFooterToplink" type="button">Scroll to top</button>
      <div class="site-footer-top">
        <button class="site-footer-brand" id="siteFooterBrand" type="button" aria-label="Scroll to top">
          ${logoSrc
            ? `<img src="${logoSrc}" alt="${logoAlt}" class="site-footer-logo-mark">`
            : `<span class="site-footer-wordmark">${PORTFOLIO_DATA.site.logo || "Boon"}</span>`
          }
        </button>
        <div class="site-footer-meta">
          <p class="site-footer-kicker">Get in touch</p>
          <a class="site-footer-link" href="mailto:${contact.email || ""}">${contact.email || ""}</a>
          <a class="site-footer-link site-footer-link--secondary" href="${contact.linkedin || "#"}" target="_blank" rel="noopener noreferrer">LinkedIn -></a>
        </div>
      </div>
    </div>
  `;

  const toplink = document.getElementById("siteFooterToplink");
  const footerBrand = document.getElementById("siteFooterBrand");
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (toplink) {
    toplink.onclick = scrollToTop;
  }

  if (footerBrand) {
    footerBrand.onclick = scrollToTop;
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
  const uxView = document.getElementById("uxView");
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
  if (uxView) uxView.style.display = view === "ux" ? "block" : "none";
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
                <img src="${resolveSitePath(brand.logoSrc)}" alt="${brand.logoAlt || e.agency}" class="about-exp-brand-image"${logoStyle}>
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
            <img src="${resolveSitePath(client.logoSrc)}" alt="${name}" class="about-client-logo">
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

function renderUxHero() {
  const container = document.getElementById("uxTitle");
  if (!container) return;

  const line1 = PORTFOLIO_DATA.site.uxLine1 || "Journeys, systems and digital experiences.";
  const line2 = PORTFOLIO_DATA.site.uxLine2 || "";

  container.innerHTML = renderAnimatedHeadlineLines(`${line1}<br>${line2}`);
}

function moveHomepageProjectByCategory(fromIndex, direction) {
  const project = PORTFOLIO_DATA.projects[fromIndex];
  if (!project) return false;

  const category = getProjectCategory(project);
  const step = direction < 0 ? -1 : 1;
  let targetIndex = fromIndex + step;

  while (targetIndex >= 0 && targetIndex < PORTFOLIO_DATA.projects.length) {
    const candidate = PORTFOLIO_DATA.projects[targetIndex];
    if (candidate && getProjectCategory(candidate) === category) {
      PORTFOLIO_DATA.projects[fromIndex] = candidate;
      PORTFOLIO_DATA.projects[targetIndex] = project;
      saveData();
      renderProjectsGrid("work");
      renderProjectsGrid("ux");
      renderProjectsGrid("lab");
      if (typeof setupDragAndDrop === "function") setupDragAndDrop();
      return true;
    }
    targetIndex += step;
  }

  return false;
}

function renderProjectsGrid(category = "work") {
  const gridIdByCategory = {
    work: "projectsGrid",
    ux: "uxProjectsGrid",
    lab: "labProjectsGrid",
  };
  const grid = document.getElementById(gridIdByCategory[category] || "projectsGrid");
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
      if (isVideoAsset(project.cardImage)) {
        const video = createMediaElement(project.cardImage, "project-card-media");
        if (video) bgDiv.appendChild(video);
      } else {
        bgDiv.style.backgroundImage = `url("${resolveSitePath(project.cardImage)}")`;
        bgDiv.style.backgroundSize = "cover";
        bgDiv.style.backgroundPosition = "center";
      }
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
      bgDiv.innerHTML = "";
      bgDiv.style.backgroundColor = "transparent";
      bgDiv.style.backgroundImage = "";
      if (isVideoAsset(dataUrl)) {
        const video = createMediaElement(dataUrl, "project-card-media");
        if (video) bgDiv.appendChild(video);
      } else {
        bgDiv.style.backgroundImage = `url("${dataUrl}")`;
        bgDiv.style.backgroundSize = "cover";
        bgDiv.style.backgroundPosition = "center";
      }
      saveData();
    });
    card.appendChild(uploadOverlay);

    const dragHandle = document.createElement("button");
    dragHandle.className = "block-drag-handle card-drag-handle";
    dragHandle.type = "button";
    dragHandle.innerHTML = "⋮⋮";
    dragHandle.title = "Drag to reorder";
    dragHandle.setAttribute("aria-label", "Drag to reorder project");
    dragHandle.tabIndex = -1;
    card.appendChild(dragHandle);

    const siblingIndexes = PORTFOLIO_DATA.projects
      .map((candidate, candidateIndex) => getProjectCategory(candidate) === category ? candidateIndex : -1)
      .filter((candidateIndex) => candidateIndex !== -1);
    const categoryPosition = siblingIndexes.indexOf(index);

    const moveControls = document.createElement("div");
    moveControls.className = "block-move-controls card-move-controls";
    moveControls.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });

    const moveUpBtn = document.createElement("button");
    moveUpBtn.className = "block-move-btn";
    moveUpBtn.type = "button";
    moveUpBtn.draggable = false;
    moveUpBtn.title = "Move project up";
    moveUpBtn.innerHTML = "↑";
    moveUpBtn.setAttribute("aria-label", "Move project up");
    moveUpBtn.disabled = categoryPosition <= 0;
    moveUpBtn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    moveUpBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!document.body.classList.contains("edit-mode")) return;
      if (moveHomepageProjectByCategory(index, -1)) {
        showToast("Project moved up");
      }
    };

    const moveDownBtn = document.createElement("button");
    moveDownBtn.className = "block-move-btn";
    moveDownBtn.type = "button";
    moveDownBtn.draggable = false;
    moveDownBtn.title = "Move project down";
    moveDownBtn.innerHTML = "↓";
    moveDownBtn.setAttribute("aria-label", "Move project down");
    moveDownBtn.disabled = categoryPosition === -1 || categoryPosition >= siblingIndexes.length - 1;
    moveDownBtn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    moveDownBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!document.body.classList.contains("edit-mode")) return;
      if (moveHomepageProjectByCategory(index, 1)) {
        showToast("Project moved down");
      }
    };

    moveControls.appendChild(moveUpBtn);
    moveControls.appendChild(moveDownBtn);
    card.appendChild(moveControls);

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
          renderProjectsGrid("ux");
          renderProjectsGrid("lab");
          if (typeof setupDragAndDrop === 'function') setupDragAndDrop();
        }
      }
    };
    card.appendChild(deleteBtn);

    // Click to navigate (only when not in edit mode)
    card.addEventListener("click", () => {
      if (!document.body.classList.contains("edit-mode")) {
        navigateTo(getProjectPath(project));
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
    navigateTo(getHomePath());
    return;
  }

  // Update page title
  document.title = `${project.title} — Boon`;

  const canonicalSlug = getProjectSlug(project);
  const canonicalPath = getProjectPath(project);
  const currentRoute = getProjectRouteSegments();
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.delete("project");
  const queryString = searchParams.toString();
  const canonicalUrl = `${canonicalPath}${queryString ? `?${queryString}` : ""}${window.location.hash || ""}`;

  if (!currentRoute || currentRoute.slug !== canonicalSlug || currentRoute.section !== getProjectCategory(project)) {
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
      if (isVideoAsset(project.cardImage)) {
        const video = createMediaElement(project.cardImage, "project-hero-media");
        if (video) heroDiv.appendChild(video);
      } else {
        heroDiv.style.backgroundImage = `url("${resolveSitePath(project.cardImage)}")`;
        heroDiv.style.backgroundSize = "contain";
        heroDiv.style.backgroundRepeat = "no-repeat";
        heroDiv.style.backgroundPosition = "center";
      }
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
      heroDiv.querySelectorAll(".project-hero-media").forEach((media) => media.remove());
      heroDiv.style.backgroundImage = "";
      heroDiv.style.backgroundColor = "transparent";
      if (isVideoAsset(dataUrl)) {
        const video = createMediaElement(dataUrl, "project-hero-media");
        if (video) heroDiv.appendChild(video);
      } else {
        heroDiv.style.backgroundImage = `url("${dataUrl}")`;
        heroDiv.style.backgroundSize = "contain";
        heroDiv.style.backgroundRepeat = "no-repeat";
        heroDiv.style.backgroundPosition = "center";
      }
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

      const moveControls = document.createElement("div");
      moveControls.className = "block-move-controls";
      moveControls.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });

      const moveUpBtn = document.createElement("button");
      moveUpBtn.className = "block-move-btn";
      moveUpBtn.type = "button";
      moveUpBtn.draggable = false;
      moveUpBtn.title = "Move block up";
      moveUpBtn.innerHTML = "↑";
      moveUpBtn.setAttribute("aria-label", "Move block up");
      moveUpBtn.disabled = blockIndex === 0;
      moveUpBtn.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });
      moveUpBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!document.body.classList.contains("edit-mode")) return;
        if (moveProjectContentBlock(project, blockIndex, blockIndex - 1)) {
          showToast("Block moved up");
        }
      };

      const moveDownBtn = document.createElement("button");
      moveDownBtn.className = "block-move-btn";
      moveDownBtn.type = "button";
      moveDownBtn.draggable = false;
      moveDownBtn.title = "Move block down";
      moveDownBtn.innerHTML = "↓";
      moveDownBtn.setAttribute("aria-label", "Move block down");
      moveDownBtn.disabled = blockIndex === project.contentBlocks.length - 1;
      moveDownBtn.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });
      moveDownBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!document.body.classList.contains("edit-mode")) return;
        if (moveProjectContentBlock(project, blockIndex, blockIndex + 1)) {
          showToast("Block moved down");
        }
      };

      moveControls.appendChild(moveUpBtn);
      moveControls.appendChild(moveDownBtn);
      el.appendChild(moveControls);

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

function refreshProjectEditorBlocks() {
  const projectId = getProjectIdFromURL();
  const project = getProjectById(projectId);
  if (!project) return;

  renderContentBlocks(project, PORTFOLIO_DATA.projects.indexOf(project));

  if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
  if (typeof setupThumbnailDragAndDrop === "function") setupThumbnailDragAndDrop();
}

function moveProjectContentBlock(project, fromIndex, toIndex) {
  if (!project || !Array.isArray(project.contentBlocks)) return false;
  if (fromIndex === toIndex) return false;
  if (fromIndex < 0 || fromIndex >= project.contentBlocks.length) return false;
  if (toIndex < 0 || toIndex >= project.contentBlocks.length) return false;

  const [moved] = project.contentBlocks.splice(fromIndex, 1);
  project.contentBlocks.splice(toIndex, 0, moved);
  saveData();
  refreshProjectEditorBlocks();
  return true;
}

function createBlockElement(block, projectIndex, blockIndex) {
  switch (block.type) {
    case "full-image":
      return createFullImageBlock(block, projectIndex, blockIndex);
    case "two-image":
      return createTwoImageBlock(block, projectIndex, blockIndex);
    case "image-grid":
    case "3-grid":
    case "4-grid":
      return createImageGridBlock(block, projectIndex, blockIndex);
    case "text":
      return createTextBlock(block, projectIndex, blockIndex);
    case "two-text-column":
      return createTwoTextColumnBlock(block, projectIndex, blockIndex);
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
    if (isVideoAsset(block.src)) {
      const video = createMediaElement(block.src, "block-media block-media--contain");
      if (video) div.appendChild(video);
    } else {
      div.style.backgroundImage = `url("${resolveSitePath(block.src)}")`;
      div.style.backgroundSize = "contain";
      div.style.backgroundRepeat = "no-repeat";
      div.style.backgroundPosition = "center";
    }
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
    saveData();
    refreshProjectEditorBlocks();
  });
  div.appendChild(overlay);

  return div;
}

function applyImageGridShortestHeight(grid, images = [], heightCompensation = 1, options = {}) {
  const {
    squareSnapRange = null,
    squareSnapAspectRatio = 1,
  } = options;
  const sources = images
    .map((img) => img?.src)
    .filter(Boolean);

  if (!sources.length) return;

  Promise.all(sources.map((src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (!img.width || !img.height) {
          resolve(null);
          return;
        }
        resolve(img.width / img.height);
      };
      img.onerror = () => resolve(null);
      img.src = resolveSitePath(src);
    });
  })).then((ratios) => {
    const validRatios = ratios.filter((ratio) => Number.isFinite(ratio) && ratio > 0);
    if (!validRatios.length) return;

    const allImagesNearSquare = Array.isArray(squareSnapRange)
      && squareSnapRange.length === 2
      && validRatios.every((ratio) => ratio >= squareSnapRange[0] && ratio <= squareSnapRange[1]);

    const shortestHeightRatio = allImagesNearSquare
      ? squareSnapAspectRatio
      : Math.max(...validRatios) * heightCompensation;

    grid.querySelectorAll(".block-grid-item").forEach((item) => {
      item.style.aspectRatio = String(shortestHeightRatio);
    });
  });
}

function createImageGridBlock(block, projectIndex, blockIndex) {
  const columns = block.columns || (block.type === "4-grid" ? 4 : 3);
  const div = document.createElement("div");
  div.className = `block-image-grid cols-${columns}`;
  div.setAttribute("data-block-index", blockIndex);

  (block.images || []).forEach((img, imgIndex) => {
    const item = document.createElement("div");
    item.className = "block-grid-item";
    item.setAttribute("data-image-index", imgIndex);

    if (img.src) {
      if (isVideoAsset(img.src)) {
        const video = createMediaElement(img.src, "block-media block-media--cover");
        if (video) item.appendChild(video);
      } else {
        item.style.backgroundImage = `url("${resolveSitePath(img.src)}")`;
        item.style.backgroundSize = "cover";
        item.style.backgroundRepeat = "no-repeat";
        item.style.backgroundPosition = "center";
      }
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
      saveData();
      refreshProjectEditorBlocks();
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

  if (columns === 3) {
    applyImageGridShortestHeight(div, block.images || [], 0.96);
  } else if (columns === 4) {
    applyImageGridShortestHeight(div, block.images || [], 0.92, {
      squareSnapRange: [0.95, 1.05],
      squareSnapAspectRatio: 1,
    });
  }

  return div;
}

function applyTwoImageEqualHeights(container, images = []) {
  const items = Array.from(container.querySelectorAll(".block-two-image-item"));
  if (!items.length) return;

  const sources = images.map((img) => img?.src || null);
  const ratioPromises = sources.map((src) => {
    if (!src) return Promise.resolve(16 / 9);

    if (isVideoAsset(src)) {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          if (!video.videoWidth || !video.videoHeight) {
            resolve(16 / 9);
            return;
          }
          resolve(video.videoWidth / video.videoHeight);
        };
        video.onerror = () => resolve(16 / 9);
        video.src = resolveSitePath(src);
      });
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (!img.width || !img.height) {
          resolve(16 / 9);
          return;
        }
        resolve(img.width / img.height);
      };
      img.onerror = () => resolve(16 / 9);
      img.src = resolveSitePath(src);
    });
  });

  Promise.all(ratioPromises).then((ratios) => {
    items.forEach((item, index) => {
      const ratio = Number.isFinite(ratios[index]) && ratios[index] > 0 ? ratios[index] : 16 / 9;
      item.style.flex = `${ratio} 1 0`;
      item.style.aspectRatio = String(ratio);
    });
  });
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
      if (isVideoAsset(img.src)) {
        const video = createMediaElement(img.src, "block-media block-media--contain");
        if (video) item.appendChild(video);
      } else {
        item.style.backgroundImage = `url("${resolveSitePath(img.src)}")`;
        item.style.backgroundSize = "contain";
        item.style.backgroundRepeat = "no-repeat";
        item.style.backgroundPosition = "center";
      }
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
      saveData();
      refreshProjectEditorBlocks();
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
        saveData();
        refreshProjectEditorBlocks();
      };
      item.appendChild(clearBtn);
    }

    div.appendChild(item);
  });

  applyTwoImageEqualHeights(div, block.images);

  return div;
}

function createTextBlock(block, projectIndex, blockIndex) {
  const div = document.createElement("div");
  div.className = "block-text";
  div.setAttribute("data-block-index", blockIndex);

  const content = document.createElement("div");
  content.className = "block-text-content";
  content.innerHTML = block.content || "Enter your text here...";
  content.setAttribute("data-editable", `projects.${projectIndex}.contentBlocks.${blockIndex}.content`);
  div.appendChild(content);

  return div;
}

function createTwoTextColumnBlock(block, projectIndex, blockIndex) {
  const div = document.createElement("div");
  div.className = "block-two-text-column";
  div.setAttribute("data-block-index", blockIndex);

  const leftCol = document.createElement("div");
  leftCol.className = "col-text";
  leftCol.innerHTML = block.leftText || "Enter left column text here...";
  leftCol.setAttribute("data-editable", `projects.${projectIndex}.contentBlocks.${blockIndex}.leftText`);
  div.appendChild(leftCol);

  const rightCol = document.createElement("div");
  rightCol.className = "col-text";
  rightCol.innerHTML = block.rightText || "Enter right column text here...";
  rightCol.setAttribute("data-editable", `projects.${projectIndex}.contentBlocks.${blockIndex}.rightText`);
  div.appendChild(rightCol);

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
    imgCol.style.backgroundImage = `url("${resolveSitePath(block.imageSrc)}")`;
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
    saveData();
    refreshProjectEditorBlocks();
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
        refreshProjectEditorBlocks();
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
  function isFileDrag(dataTransfer) {
    if (!dataTransfer) return false;
    return Array.from(dataTransfer.types || []).includes("Files");
  }

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
      input.accept = "image/*,video/webm,.webm";
      input.onchange = (e) => handleFile(e.target.files[0]);
      input.click();
    }
  };

  overlay.addEventListener("dragover", (e) => {
    if (!document.body.classList.contains("edit-mode")) return;
    if (!isFileDrag(e.dataTransfer)) return;

    e.preventDefault();
    e.stopPropagation();
    overlay.style.background = "rgba(0, 68, 255, 0.4)";
  });

  overlay.addEventListener("dragleave", (e) => {
    if (isFileDrag(e.dataTransfer)) {
      e.preventDefault();
      e.stopPropagation();
    }
    overlay.style.background = "";
  });

  overlay.addEventListener("drop", (e) => {
    if (!document.body.classList.contains("edit-mode")) return;
    if (!isFileDrag(e.dataTransfer) || e.dataTransfer.files.length === 0) return;

    e.preventDefault();
    e.stopPropagation();
    overlay.style.background = "";
    handleFile(e.dataTransfer.files[0]);
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
  const category = currentView === "lab"
    ? "lab"
    : currentView === "ux"
      ? "ux"
      : "work";

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
        type: "3-grid", columns: 3,
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
  renderProjectsGrid("ux");
  renderProjectsGrid("lab");
  setupDragAndDrop();
  showToast(
    category === "lab"
      ? "Lab project added!"
      : category === "ux"
        ? "UX project added!"
        : "Project added!"
  );
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
    case "3-grid":
      newBlock = {
        type: "3-grid", columns: 3,
        images: [
          { src: null, color: color },
          { src: null, color: color },
          { src: null, color: color }
        ]
      };
      break;
    case "4-grid":
      newBlock = {
        type: "4-grid", columns: 4,
        images: [
          { src: null, color: color },
          { src: null, color: color },
          { src: null, color: color },
          { src: null, color: color }
        ]
      };
      break;
    case "text":
      newBlock = { type: "text", content: "Enter your text here..." };
      break;
    case "two-text-column":
      newBlock = {
        type: "two-text-column",
        leftText: "Enter left column text here...",
        rightText: "Enter right column text here..."
      };
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
  if (typeof setupThumbnailDragAndDrop === "function") setupThumbnailDragAndDrop();
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




