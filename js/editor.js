// ============================================================
// EDITOR.JS — Live editing overlay, drag-and-drop reordering
// ============================================================

window.editMode = false;

// ============================================================
// TOGGLE EDIT MODE
// ============================================================
function toggleEditMode() {
  window.editMode = !window.editMode;
  document.body.classList.toggle("edit-mode", window.editMode);

  const btn = document.getElementById("editToggle");
  if (btn) {
    btn.textContent = window.editMode ? "Done" : "Edit";
    btn.classList.toggle("active", window.editMode);
  }

  if (window.editMode) {
    enableInlineEditing();
    if (!isProjectPage()) {
      setupDragAndDrop();
    } else {
      if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
      if (typeof setupThumbnailDragAndDrop === "function") setupThumbnailDragAndDrop();
    }
    showToast("Edit mode on — click text to edit, upload images");
  } else {
    disableInlineEditing();
    saveData();
    showToast("Changes saved!");
  }
}

// Wire up the edit toggle button
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("editToggle");
  if (btn) {
    btn.addEventListener("click", toggleEditMode);
  }
});

// ============================================================
// INLINE TEXT EDITING
// ============================================================
function enableInlineEditing() {
  document.querySelectorAll("[data-editable]").forEach(el => {
    el.setAttribute("contenteditable", "true");
    el.setAttribute("spellcheck", "false");

    // Remove old listeners to avoid duplicates
    el.removeEventListener("blur", handleEditableBlur);
    el.addEventListener("blur", handleEditableBlur);

    // Prevent Enter from creating new lines in single-line fields
    el.removeEventListener("keydown", handleEditableKeydown);
    el.addEventListener("keydown", handleEditableKeydown);
  });
}

function disableInlineEditing() {
  document.querySelectorAll("[data-editable]").forEach(el => {
    el.setAttribute("contenteditable", "false");
    el.removeEventListener("blur", handleEditableBlur);
    el.removeEventListener("keydown", handleEditableKeydown);
  });
}

function handleEditableBlur(e) {
  const path = e.target.getAttribute("data-editable");
  
  // Automatically add target="_blank" to all links inside the block
  const links = e.target.querySelectorAll("a");
  links.forEach(link => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  const value = e.target.innerHTML.trim();
  setNestedValue(PORTFOLIO_DATA, path, value);
  saveData();
}

function handleEditableKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    e.target.blur();
  }

  // Handle Cmd+K / Ctrl+K for links
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    const url = prompt("Enter link URL:", "https://");
    if (url && url.trim() !== "") {
      document.execCommand("createLink", false, url.trim());
    }
  }
}

// ============================================================
// NESTED DATA ACCESS
// ============================================================
function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = isNaN(keys[i]) ? keys[i] : parseInt(keys[i]);
    current = current[key];
    if (!current) return;
  }
  const lastKey = isNaN(keys[keys.length - 1])
    ? keys[keys.length - 1]
    : parseInt(keys[keys.length - 1]);
  current[lastKey] = value;
}

// ============================================================
// DRAG & DROP REORDERING (Homepage cards)
// ============================================================
let draggedCard = null;
let draggedIndex = -1;

function setupDragAndDrop() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  const cards = grid.querySelectorAll(".project-card");

  // Track the last valid target card so drop-on-placeholder still works
  let lastTargetCard = null;

  cards.forEach(card => {
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", (e) => {
      if (!window.editMode) {
        e.preventDefault();
        return;
      }
      draggedCard = card;
      draggedIndex = parseInt(card.getAttribute("data-index"));

      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggedIndex);

      setTimeout(() => {
        card.style.opacity = "0.4";
        // Disable overlays so they don't swallow drag events on other cards
        grid.classList.add("is-card-dragging");
      }, 0);
    });

    card.addEventListener("dragend", () => {
      if (!draggedCard) return;
      draggedCard.classList.remove("dragging");
      draggedCard.style.opacity = "";
      draggedCard = null;
      draggedIndex = -1;
      lastTargetCard = null;

      // Re-enable overlays
      grid.classList.remove("is-card-dragging");
      grid.querySelectorAll(".drag-placeholder").forEach(p => p.remove());
    });
  });

  // --- Grid-level dragover: catches events on cards AND placeholders ---
  grid.addEventListener("dragover", (e) => {
    if (!window.editMode || !draggedCard) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Find the real card being hovered (skip the placeholder itself)
    const targetCard = e.target.closest(".project-card:not(.drag-placeholder)");
    if (!targetCard || targetCard === draggedCard) return;

    lastTargetCard = targetCard;

    const rect = targetCard.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isBefore = e.clientY < midY;

    grid.querySelectorAll(".drag-placeholder").forEach(p => p.remove());

    const placeholder = document.createElement("div");
    placeholder.className = "drag-placeholder";

    if (isBefore) {
      grid.insertBefore(placeholder, targetCard);
    } else {
      grid.insertBefore(placeholder, targetCard.nextSibling);
    }
  });

  // --- Grid-level drop: fires regardless of whether cursor is on card or placeholder ---
  grid.addEventListener("drop", (e) => {
    if (!window.editMode || !draggedCard || !lastTargetCard) return;
    e.preventDefault();

    const targetIndex = parseInt(lastTargetCard.getAttribute("data-index"));
    if (targetIndex === draggedIndex) return;

    // Reorder data
    const [moved] = PORTFOLIO_DATA.projects.splice(draggedIndex, 1);
    PORTFOLIO_DATA.projects.splice(targetIndex, 0, moved);

    // Save and re-render
    saveData();
    renderProjectsGrid();
    setupScrollAnimations();
    setupDragAndDrop();
    showToast("Reordered!");
  });
}

// ============================================================
// DRAG & DROP REORDERING (Project Content Blocks)
// ============================================================
let draggedBlock = null;
let draggedBlockIndex = -1;
let blockDropIndex = -1;
let draggedThumb = null;
let draggedThumbBlockIndex = -1;
let draggedThumbIndex = -1;
let thumbDropIndex = -1;
let blockDragArmed = false;
let thumbDragArmed = false;

function resetBlockDragState(container) {
  if (draggedBlock) {
    draggedBlock.classList.remove("dragging");
    draggedBlock.style.opacity = "";
  }
  draggedBlock = null;
  draggedBlockIndex = -1;
  blockDropIndex = -1;
  blockDragArmed = false;
  if (container) {
    container.querySelectorAll(".drag-placeholder-block").forEach(p => p.remove());
  }
}

function resetThumbDragState(group) {
  if (draggedThumb) {
    draggedThumb.classList.remove("dragging-thumb");
    draggedThumb.style.opacity = "";
  }
  draggedThumb = null;
  draggedThumbBlockIndex = -1;
  draggedThumbIndex = -1;
  thumbDropIndex = -1;
  thumbDragArmed = false;
  if (group) {
    group.querySelectorAll(".drag-placeholder-thumb").forEach((p) => p.remove());
  }
}

function setupBlockDragAndDrop() {
  const container = document.getElementById("contentBlocks");
  if (!container) return;

  const blocks = container.children;

  Array.from(blocks).forEach((block) => {
    const indexStr = block.getAttribute("data-block-index");
    if (indexStr === null) return;
    const handle = block.querySelector(".block-drag-handle");

    block.setAttribute("draggable", "true");

    if (handle) {
      handle.addEventListener("pointerdown", (e) => {
        if (!window.editMode) return;
        blockDragArmed = true;
        e.stopPropagation();
      });

      handle.addEventListener("click", (e) => {
        if (!window.editMode) return;
        e.preventDefault();
        e.stopPropagation();
      });
    }

    block.addEventListener("dragstart", (e) => {
      if (!window.editMode) return;
      if (!blockDragArmed) {
        e.preventDefault();
        return;
      }
      draggedBlock = block;
      draggedBlockIndex = parseInt(block.getAttribute("data-block-index"));
      blockDropIndex = draggedBlockIndex;
      block.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(draggedBlockIndex));
      setTimeout(() => {
        block.style.opacity = "0.4";
      }, 0);
    });

    block.addEventListener("dragend", () => {
      if (!draggedBlock) return;
      resetBlockDragState(container);
    });

    block.addEventListener("dragover", (e) => {
      if (!window.editMode || !draggedBlock) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const targetIndex = parseInt(block.getAttribute("data-block-index"));
      if (targetIndex === draggedBlockIndex) return;

      const rect = block.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isAbove = e.clientY < midY;
      blockDropIndex = isAbove ? targetIndex : targetIndex + 1;

      container.querySelectorAll(".drag-placeholder-block").forEach(p => p.remove());

      const placeholder = document.createElement("div");
      placeholder.className = "drag-placeholder-block";

      if (isAbove) {
        container.insertBefore(placeholder, block);
      } else {
        container.insertBefore(placeholder, block.nextSibling);
      }
    });

    block.addEventListener("drop", (e) => {
      if (!window.editMode || !draggedBlock) return;
      e.preventDefault();

      const targetIndex = parseInt(block.getAttribute("data-block-index"));
      if (targetIndex === draggedBlockIndex) return;

      const projectId = getProjectIdFromURL();
      const project = getProjectById(projectId);
      if (!project) return;
      const projectIndex = PORTFOLIO_DATA.projects.indexOf(project);

      // Reorder data
      const [moved] = project.contentBlocks.splice(draggedBlockIndex, 1);
      let newIndex = blockDropIndex;
      if (newIndex > draggedBlockIndex) newIndex -= 1;
      newIndex = Math.max(0, Math.min(newIndex, project.contentBlocks.length));
      project.contentBlocks.splice(newIndex, 0, moved);

      // Save and re-render
      resetBlockDragState(container);
      saveData();
      renderContentBlocks(project, projectIndex);
      setupScrollAnimations();
      setupBlockDragAndDrop();
      showToast("Block reordered!");
    });
  });

  if (!container.dataset.blockDropBound) {
    container.addEventListener("dragover", (e) => {
      if (!window.editMode || !draggedBlock) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const blocks = Array.from(container.querySelectorAll("[data-block-index]"));
      const lastBlock = blocks[blocks.length - 1];
      if (!lastBlock) return;

      const rect = lastBlock.getBoundingClientRect();
      if (e.clientY >= rect.bottom) {
        blockDropIndex = blocks.length;
        container.querySelectorAll(".drag-placeholder-block").forEach(p => p.remove());
        const placeholder = document.createElement("div");
        placeholder.className = "drag-placeholder-block";
        container.appendChild(placeholder);
      }
    });

    container.addEventListener("drop", (e) => {
      if (!window.editMode || !draggedBlock || blockDropIndex < 0) return;
      if (e.target.closest("[data-block-index]")) return;
      e.preventDefault();

      const projectId = getProjectIdFromURL();
      const project = getProjectById(projectId);
      if (!project) return;
      const projectIndex = PORTFOLIO_DATA.projects.indexOf(project);

      const [moved] = project.contentBlocks.splice(draggedBlockIndex, 1);
      let newIndex = blockDropIndex;
      if (newIndex > draggedBlockIndex) newIndex -= 1;
      newIndex = Math.max(0, Math.min(newIndex, project.contentBlocks.length));
      project.contentBlocks.splice(newIndex, 0, moved);

      resetBlockDragState(container);
      saveData();
      renderContentBlocks(project, projectIndex);
      setupScrollAnimations();
      setupBlockDragAndDrop();
      showToast("Block reordered!");
    });

    container.dataset.blockDropBound = "true";
  }
}

function setupThumbnailDragAndDrop() {
  const groups = document.querySelectorAll(".block-image-grid, .block-two-image");

  groups.forEach((group) => {
    const blockIndex = parseInt(group.getAttribute("data-block-index"));
    if (Number.isNaN(blockIndex)) return;

    const items = Array.from(group.querySelectorAll("[data-image-index]"));
    items.forEach((item) => {
      item.setAttribute("draggable", "true");
      const handle = item.querySelector(".thumbnail-drag-handle");

      if (handle) {
        handle.addEventListener("pointerdown", (e) => {
          if (!window.editMode) return;
          thumbDragArmed = true;
          e.stopPropagation();
        });

        handle.addEventListener("click", (e) => {
          if (!window.editMode) return;
          e.preventDefault();
          e.stopPropagation();
        });
      }

      item.addEventListener("dragstart", (e) => {
        if (!window.editMode) return;
        if (!thumbDragArmed) {
          e.preventDefault();
          return;
        }

        draggedThumb = item;
        draggedThumbBlockIndex = blockIndex;
        draggedThumbIndex = parseInt(item.getAttribute("data-image-index"));
        thumbDropIndex = draggedThumbIndex;
        item.classList.add("dragging-thumb");
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `${draggedThumbBlockIndex}:${draggedThumbIndex}`);
        setTimeout(() => {
          item.style.opacity = "0.4";
        }, 0);
      });

      item.addEventListener("dragend", () => {
        if (!draggedThumb) return;
        resetThumbDragState(group);
      });

      item.addEventListener("dragover", (e) => {
        if (!window.editMode || !draggedThumb || draggedThumbBlockIndex !== blockIndex) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";

        const targetIndex = parseInt(item.getAttribute("data-image-index"));
        if (targetIndex === draggedThumbIndex) return;

        const rect = item.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        const isBefore = e.clientX < midpoint;
        thumbDropIndex = isBefore ? targetIndex : targetIndex + 1;

        group.querySelectorAll(".drag-placeholder-thumb").forEach((p) => p.remove());
        const placeholder = document.createElement("div");
        placeholder.className = "drag-placeholder-thumb";

        if (isBefore) {
          group.insertBefore(placeholder, item);
        } else {
          group.insertBefore(placeholder, item.nextSibling);
        }
      });

      item.addEventListener("drop", (e) => {
        if (!window.editMode || !draggedThumb || draggedThumbBlockIndex !== blockIndex) return;
        e.preventDefault();
        e.stopPropagation();

        const projectId = getProjectIdFromURL();
        const project = getProjectById(projectId);
        if (!project) return;
        const block = project.contentBlocks[blockIndex];
        if (!block || !Array.isArray(block.images)) return;

        const [moved] = block.images.splice(draggedThumbIndex, 1);
        let newIndex = thumbDropIndex;
        if (newIndex > draggedThumbIndex) newIndex -= 1;
        newIndex = Math.max(0, Math.min(newIndex, block.images.length));
        block.images.splice(newIndex, 0, moved);

        resetThumbDragState(group);
        saveData();
        renderContentBlocks(project, PORTFOLIO_DATA.projects.indexOf(project));
        if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
        if (typeof setupThumbnailDragAndDrop === "function") setupThumbnailDragAndDrop();
        showToast("Images reordered!");
      });
    });

    if (!group.dataset.thumbDropBound) {
      group.addEventListener("dragover", (e) => {
        if (!window.editMode || !draggedThumb || draggedThumbBlockIndex !== blockIndex) return;
        e.preventDefault();
        e.stopPropagation();

        const visibleItems = Array.from(group.querySelectorAll("[data-image-index]"));
        const lastItem = visibleItems[visibleItems.length - 1];
        if (!lastItem) return;

        const rect = lastItem.getBoundingClientRect();
        if (e.clientX >= rect.right) {
          thumbDropIndex = visibleItems.length;
          group.querySelectorAll(".drag-placeholder-thumb").forEach((p) => p.remove());
          const placeholder = document.createElement("div");
          placeholder.className = "drag-placeholder-thumb";
          group.appendChild(placeholder);
        }
      });

      group.addEventListener("drop", (e) => {
        if (!window.editMode || !draggedThumb || draggedThumbBlockIndex !== blockIndex || thumbDropIndex < 0) return;
        if (e.target.closest("[data-image-index]")) return;
        e.preventDefault();
        e.stopPropagation();

        const projectId = getProjectIdFromURL();
        const project = getProjectById(projectId);
        if (!project) return;
        const block = project.contentBlocks[blockIndex];
        if (!block || !Array.isArray(block.images)) return;

        const [moved] = block.images.splice(draggedThumbIndex, 1);
        let newIndex = thumbDropIndex;
        if (newIndex > draggedThumbIndex) newIndex -= 1;
        newIndex = Math.max(0, Math.min(newIndex, block.images.length));
        block.images.splice(newIndex, 0, moved);

        resetThumbDragState(group);
        saveData();
        renderContentBlocks(project, PORTFOLIO_DATA.projects.indexOf(project));
        if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
        if (typeof setupThumbnailDragAndDrop === "function") setupThumbnailDragAndDrop();
        showToast("Images reordered!");
      });

      group.dataset.thumbDropBound = "true";
    }
  });
}

document.addEventListener("pointerup", () => {
  blockDragArmed = false;
  thumbDragArmed = false;
});
