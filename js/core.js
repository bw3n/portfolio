// ============================================================
// CORE.JS — The engine for saving, exporting, and syncing
// This file stays separate so data.js can be overwritten safely.
// ============================================================

const PORTFOLIO_BROWSER_STATE_KEY = "portfolio_v3_data";
const PORTFOLIO_BROWSER_STATE_VERSION_KEY = "portfolio_v3_state_version";
const PORTFOLIO_BROWSER_STATE_VERSION = "20260509-11";

function saveData() {
  try {
    normalizePortfolioData(PORTFOLIO_DATA);
    localStorage.setItem(PORTFOLIO_BROWSER_STATE_KEY, JSON.stringify(PORTFOLIO_DATA));
    localStorage.setItem(PORTFOLIO_BROWSER_STATE_VERSION_KEY, PORTFOLIO_BROWSER_STATE_VERSION);
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      alert("Storage limit reached! We couldn't save your latest changes to the browser. Please use the 'Export Data' button to grab a backup of your data.js file to avoid losing work.");
    } else {
      console.error(e);
      alert("Failed to save changes.");
    }
  }
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function decodeContentHTML(value = "") {
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

function sanitizeEditableHref(href = "") {
  const value = typeof href === "string" ? href.trim() : "";
  if (!value) return "";

  if (/^(https?:|mailto:|tel:|#|\/)/i.test(value)) {
    return value;
  }

  return "";
}

function sanitizeInlineRichTextHTML(html = "") {
  const value = typeof html === "string" ? html : "";

  if (typeof document === "undefined") {
    return value
      .replace(/<(?!\/?(?:a|b|strong|br)\b)[^>]+>/gi, "")
      .replace(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>/gi, (_, quote, href) => {
        const safeHref = sanitizeEditableHref(decodeContentHTML(href));
        return safeHref ? `<a href="${safeHref}">` : "";
      })
      .replace(/<a\b[^>]*>/gi, "")
      .replace(/<\/a>/gi, "</a>")
      .replace(/<\s*b\s*>/gi, "<strong>")
      .replace(/<\s*\/\s*b\s*>/gi, "</strong>")
      .replace(/<br\s*\/?>/gi, "<br>");
  }

  const template = document.createElement("template");
  template.innerHTML = value;

  const sanitizeNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createDocumentFragment();
    }

    const tag = node.tagName.toLowerCase();

    if (tag === "br") {
      return document.createElement("br");
    }

    if (tag === "b" || tag === "strong") {
      const strong = document.createElement("strong");
      Array.from(node.childNodes).forEach((child) => {
        strong.appendChild(sanitizeNode(child));
      });
      return strong;
    }

    if (tag === "a") {
      const safeHref = sanitizeEditableHref(node.getAttribute("href") || "");
      if (!safeHref) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach((child) => {
          fragment.appendChild(sanitizeNode(child));
        });
        return fragment;
      }

      const anchor = document.createElement("a");
      anchor.setAttribute("href", safeHref);
      Array.from(node.childNodes).forEach((child) => {
        anchor.appendChild(sanitizeNode(child));
      });
      return anchor;
    }

    const fragment = document.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      fragment.appendChild(sanitizeNode(child));
    });
    return fragment;
  };

  const sanitizedRoot = document.createElement("div");
  Array.from(template.content.childNodes).forEach((child) => {
    sanitizedRoot.appendChild(sanitizeNode(child));
  });

  return sanitizedRoot.innerHTML
    .replace(/&nbsp;/gi, " ")
    .replace(/(?:<br>\s*){3,}/gi, "<br><br>")
    .trim();
}

function stripContentHTML(value = "") {
  return decodeContentHTML(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitStructuredParagraphs(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => typeof item === "string" ? item.replace(/\r\n?/g, "\n").trim() : "")
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];

  return value
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeStructuredLinks(links) {
  if (!Array.isArray(links)) return [];

  return links
    .map((link) => {
      if (!link || typeof link !== "object") return null;

      const label = typeof link.label === "string" ? link.label.trim() : "";
      const href = typeof link.href === "string" ? link.href.trim() : "";
      if (!label || !href) return null;

      return { label, href };
    })
    .filter(Boolean);
}

function shouldPromoteFirstParagraphToHeading(content) {
  if (!content || content.heading || !Array.isArray(content.paragraphs) || content.paragraphs.length < 2) {
    return false;
  }

  const candidate = String(content.paragraphs[0] || "").trim();
  if (!candidate || candidate.length > 80) return false;
  if (/[.!?:]$/.test(candidate)) return false;

  return /^[A-Z0-9][A-Za-z0-9'&/,\- ]+$/.test(candidate);
}

function extractEmbeddedHeadingFromFirstParagraph(content) {
  if (!content || content.heading || !Array.isArray(content.paragraphs) || !content.paragraphs.length) {
    return content;
  }

  const firstParagraph = String(content.paragraphs[0] || "");
  const lines = firstParagraph
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return content;

  const candidateHeading = lines[0];
  if (candidateHeading.length > 80 || /[.!?:]$/.test(candidateHeading)) {
    return content;
  }

  if (!/^[A-Z0-9][A-Za-z0-9'&/,\- ]+$/.test(candidateHeading)) {
    return content;
  }

  content.heading = candidateHeading;
  content.paragraphs[0] = lines.slice(1).join(" ");
  content.paragraphs = content.paragraphs.filter(Boolean);
  return content;
}

function normalizeStructuredObjectContent(content) {
  const normalized = {
    heading: typeof content.heading === "string" ? content.heading.trim() : "",
    paragraphs: splitStructuredParagraphs(content.paragraphs || content.body || []),
    links: normalizeStructuredLinks(content.links),
    linkIntro: typeof content.linkIntro === "string" ? content.linkIntro : "",
    linkOutro: typeof content.linkOutro === "string" ? content.linkOutro : ""
  };

  // Recover only the specific earlier bug where a heading and body were
  // accidentally merged into the same paragraph with a newline.
  extractEmbeddedHeadingFromFirstParagraph(normalized);

  return normalized;
}

function extractLegacyLinks(html = "") {
  const links = [];
  const anchorPattern = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gis;
  let match;

  while ((match = anchorPattern.exec(html)) !== null) {
    const href = decodeContentHTML(match[2]).trim();
    const label = stripContentHTML(match[3]);
    if (href && label) {
      links.push({ label, href });
    }
  }

  return links;
}

function htmlToStructuredParagraphs(html = "", { keepLinkPlaceholders = false } = {}) {
  const withPlaceholders = html
    .replace(
      /<a\b[^>]*href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gis,
      (_, __, ___, inner) => keepLinkPlaceholders ? "[[[LINK]]]" : ""
    )
    .replace(/<\/(div|p|blockquote|h1|h2|h3|h4|h5|h6|li)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "")
    .replace(/<[^>]*>/g, "");

  return splitStructuredParagraphs(decodeContentHTML(withPlaceholders));
}

function extractLegacyHeading(html = "") {
  const blockHeadingMatch = html.match(
    /^\s*<(?:div|p)[^>]*>\s*(?:<(?:span|b|strong|font)[^>]*>)?\s*([^<]+?)\s*(?:<\/(?:span|b|strong|font)>)?\s*<\/(?:div|p)>\s*<(?:div|p)\b/si
  );

  if (blockHeadingMatch) {
    return stripContentHTML(blockHeadingMatch[1]);
  }

  const inlineHeadingMatch = html.match(
    /^\s*(?:<(?:span|b|strong|font)[^>]*>)?\s*([^<]+?)\s*(?:<\/(?:span|b|strong|font)>)?\s*<br\s*\/?>/si
  );

  if (inlineHeadingMatch) {
    return stripContentHTML(inlineHeadingMatch[1]);
  }

  return "";
}

function normalizeStructuredContent(value, { extractHeading = false } = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return normalizeStructuredObjectContent(value);
  }

  const html = typeof value === "string" ? value : "";
  const heading = extractHeading ? extractLegacyHeading(html) : "";
  const links = extractLegacyLinks(html);
  const placeholderParagraphs = htmlToStructuredParagraphs(html, { keepLinkPlaceholders: true });
  const paragraphs = [];
  let linkIntro = "";
  let linkOutro = "";

  placeholderParagraphs.forEach((paragraph) => {
    if (!paragraph.includes("[[[LINK]]]")) {
      paragraphs.push(paragraph);
      return;
    }

    const segments = paragraph.split(/\[\[\[LINK\]\]\]/g);
    const leadingText = segments[0]?.trim() || "";
    const trailingText = segments[segments.length - 1]?.trim() || "";
    const middleText = segments.slice(1, -1).join(" ").replace(/\s+/g, " ").trim();

    if (leadingText) {
      if (leadingText.length > 80 || /[.!?]$/.test(leadingText)) {
        paragraphs.push(leadingText);
      } else {
        linkIntro = leadingText;
      }
    }

    if (middleText && !linkIntro) {
      paragraphs.push(middleText);
    }

    if (trailingText) {
      linkOutro = trailingText;
    }
  });

  if (heading && paragraphs[0] === heading) {
    paragraphs.shift();
  }

  return {
    heading,
    paragraphs,
    links,
    linkIntro,
    linkOutro
  };
}

function normalizeProject(project) {
  if (!project || typeof project !== "object") return;

  project.title = stripContentHTML(typeof project.title === "string" ? project.title : "");
  project.description = normalizeStructuredContent(project.description);

  if (!Array.isArray(project.contentBlocks)) return;

  project.contentBlocks.forEach((block) => {
    if (!block || typeof block !== "object") return;

    if (block.type === "text") {
      block.content = normalizeStructuredContent(block.content, { extractHeading: true });
    }
  });
}

function normalizePortfolioData(data) {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data.projects)) {
    data.projects.forEach(normalizeProject);
  }

  return data;
}

function normalizeNavLinks(navLinks) {
  if (!Array.isArray(navLinks)) return [];
  return navLinks
    .map(link => ({
      label: typeof link?.label === "string" ? link.label.trim() : "",
      href: typeof link?.href === "string" ? link.href.trim() : ""
    }))
    .filter(link => link.label && link.href);
}

function removeDeprecatedNavLinks(navLinks) {
  return normalizeNavLinks(navLinks).filter(link => link.href !== "#contact");
}

function shouldKeepDefaultNavLinks(savedNavLinks, defaultNavLinks) {
  const saved = normalizeNavLinks(savedNavLinks);
  const defaults = normalizeNavLinks(defaultNavLinks);

  if (!saved.length) return true;

  return defaults.some(defaultLink => {
    return !saved.some(savedLink => (
      savedLink.label === defaultLink.label &&
      savedLink.href === defaultLink.href
    ));
  });
}

function loadData() {
  normalizePortfolioData(PORTFOLIO_DATA);

  const savedStateVersion = localStorage.getItem(PORTFOLIO_BROWSER_STATE_VERSION_KEY);
  if (savedStateVersion && savedStateVersion !== PORTFOLIO_BROWSER_STATE_VERSION) {
    localStorage.removeItem(PORTFOLIO_BROWSER_STATE_KEY);
    localStorage.removeItem(PORTFOLIO_BROWSER_STATE_VERSION_KEY);
  }

  const saved = localStorage.getItem(PORTFOLIO_BROWSER_STATE_KEY);
  if (saved) {
    const defaultSite = cloneData(PORTFOLIO_DATA.site);
    const parsed = JSON.parse(saved);
    if (parsed.site) {
      Object.assign(PORTFOLIO_DATA.site, parsed.site);

      // Drop deprecated nav items from older browser-saved state.
      PORTFOLIO_DATA.site.navLinks = removeDeprecatedNavLinks(PORTFOLIO_DATA.site.navLinks);

      // Keep nav links from the current source file when older browser state
      // is missing newly added links like "Lab".
      if (shouldKeepDefaultNavLinks(parsed.site.navLinks, defaultSite.navLinks)) {
        PORTFOLIO_DATA.site.navLinks = defaultSite.navLinks;
      }

      PORTFOLIO_DATA.site.navLinks = removeDeprecatedNavLinks(PORTFOLIO_DATA.site.navLinks);

      // Migrate older saved lab hero copy so localStorage does not keep reviving it.
      const hadOldLabHeading = parsed.site.labLine1 === "Lab.";
      const hadOldLabSubheading = parsed.site.labLine2 === "Side projects, experiments, and things I make for myself.";

      if (hadOldLabHeading || hadOldLabSubheading) {
        PORTFOLIO_DATA.site.labLine1 = "Experiments, ideas and vibes";
        PORTFOLIO_DATA.site.labLine2 = "";
      }
    }
    if (parsed.projects) PORTFOLIO_DATA.projects = parsed.projects;
  }

  normalizePortfolioData(PORTFOLIO_DATA);
  localStorage.setItem(PORTFOLIO_BROWSER_STATE_VERSION_KEY, PORTFOLIO_BROWSER_STATE_VERSION);
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
  const dataScriptPath = typeof window.resolveSitePath === "function"
    ? window.resolveSitePath("js/data.js")
    : "js/data.js";
  script.src = `${dataScriptPath}?v=${Date.now()}`;

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

function resetSavedData({ reload = true } = {}) {
  localStorage.removeItem(PORTFOLIO_BROWSER_STATE_KEY);
  localStorage.removeItem(PORTFOLIO_BROWSER_STATE_VERSION_KEY);
  if (reload) window.location.reload();
}

window.resetPortfolioBrowserState = resetSavedData;

function bridgeSavedDataToLocalDump() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("persist_local_state")) return;

  const saved = localStorage.getItem(PORTFOLIO_BROWSER_STATE_KEY);
  if (!saved) {
    if (typeof showToast === "function") showToast("No saved editor state found");
    return;
  }

  try {
    const encoded = encodeURIComponent(saved);
    const chunkSize = 1500;
    const total = Math.ceil(encoded.length / chunkSize);
    const transferId = `portfolio-${Date.now()}`;

    for (let index = 0; index < total; index += 1) {
      const chunk = encoded.slice(index * chunkSize, (index + 1) * chunkSize);
      const img = new Image();
      img.src =
        `http://127.0.0.1:4174/dump-chunk?id=${transferId}` +
        `&index=${index}&total=${total}&data=${chunk}`;
    }

    if (typeof showToast === "function") showToast("Editor state copied locally");
  } catch (error) {
    console.error("Local dump failed:", error);
    if (typeof showToast === "function") showToast("Editor state export failed");
  }
}

// Initialize data loading
loadData();
document.addEventListener("DOMContentLoaded", bridgeSavedDataToLocalDump);
