// ============================================================
// EDITOR.JS — Live editing overlay, drag-and-drop reordering
// ============================================================

let editMode = false;

// ============================================================
// TOGGLE EDIT MODE
// ============================================================
function toggleEditMode() {
  editMode = !editMode;
  document.body.classList.toggle("edit-mode", editMode);

  const btn = document.getElementById("editToggle");
  if (btn) {
    btn.textContent = editMode ? "Done" : "Edit";
    btn.classList.toggle("active", editMode);
  }

  if (editMode) {
    enableInlineEditing();
    if (!isProjectPage()) {
      setupDragAndDrop();
    } else {
      if (typeof setupBlockDragAndDrop === "function") setupBlockDragAndDrop();
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

  cards.forEach(card => {
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", (e) => {
      if (!editMode) return;
      draggedCard = card;
      draggedIndex = parseInt(card.getAttribute("data-index"));
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      // Need a small delay for the visual to appear
      setTimeout(() => {
        card.style.opacity = "0.4";
      }, 0);
    });

    card.addEventListener("dragend", () => {
      if (!draggedCard) return;
      draggedCard.classList.remove("dragging");
      draggedCard.style.opacity = "";
      draggedCard = null;
      draggedIndex = -1;

      // Remove all placeholders
      grid.querySelectorAll(".drag-placeholder").forEach(p => p.remove());
    });

    card.addEventListener("dragover", (e) => {
      if (!editMode || !draggedCard) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const targetIndex = parseInt(card.getAttribute("data-index"));
      if (targetIndex === draggedIndex) return;

      // Visual feedback: shift card
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isAbove = e.clientY < midY;

      // Remove existing placeholders
      grid.querySelectorAll(".drag-placeholder").forEach(p => p.remove());

      const placeholder = document.createElement("div");
      placeholder.className = "drag-placeholder";

      if (isAbove) {
        grid.insertBefore(placeholder, card);
      } else {
        grid.insertBefore(placeholder, card.nextSibling);
      }
    });

    card.addEventListener("drop", (e) => {
      if (!editMode || !draggedCard) return;
      e.preventDefault();

      const targetIndex = parseInt(card.getAttribute("data-index"));
      if (targetIndex === draggedIndex) return;

      // Reorder data
      const [moved] = PORTFOLIO_DATA.projects.splice(draggedIndex, 1);
      const newIndex = targetIndex > draggedIndex ? targetIndex : targetIndex;
      PORTFOLIO_DATA.projects.splice(newIndex, 0, moved);

      // Save and re-render
      saveData();
      renderProjectsGrid();
      setupScrollAnimations();
      setupDragAndDrop();
      showToast("Reordered!");
    });
  });
}

// ============================================================
// DRAG & DROP REORDERING (Project Content Blocks)
// ============================================================
let draggedBlock = null;
let draggedBlockIndex = -1;

function setupBlockDragAndDrop() {
  const container = document.getElementById("contentBlocks");
  if (!container) return;

  const blocks = container.children;

  Array.from(blocks).forEach((block) => {
    const indexStr = block.getAttribute("data-block-index");
    if (indexStr === null) return;
    
    block.setAttribute("draggable", "true");

    block.addEventListener("dragstart", (e) => {
      if (!editMode) return;
      draggedBlock = block;
      draggedBlockIndex = parseInt(block.getAttribute("data-block-index"));
      block.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => {
        block.style.opacity = "0.4";
      }, 0);
    });

    block.addEventListener("dragend", () => {
      if (!draggedBlock) return;
      draggedBlock.classList.remove("dragging");
      draggedBlock.style.opacity = "";
      draggedBlock = null;
      draggedBlockIndex = -1;

      container.querySelectorAll(".drag-placeholder-block").forEach(p => p.remove());
    });

    block.addEventListener("dragover", (e) => {
      if (!editMode || !draggedBlock) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const targetIndex = parseInt(block.getAttribute("data-block-index"));
      if (targetIndex === draggedBlockIndex) return;

      const rect = block.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isAbove = e.clientY < midY;

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
      if (!editMode || !draggedBlock) return;
      e.preventDefault();

      const targetIndex = parseInt(block.getAttribute("data-block-index"));
      if (targetIndex === draggedBlockIndex) return;

      const projectId = getProjectIdFromURL();
      const project = getProjectById(projectId);
      if (!project) return;
      const projectIndex = PORTFOLIO_DATA.projects.indexOf(project);

      // Reorder data
      const [moved] = project.contentBlocks.splice(draggedBlockIndex, 1);
      const newIndex = targetIndex; 
      project.contentBlocks.splice(newIndex, 0, moved);

      // Save and re-render
      saveData();
      renderContentBlocks(project, projectIndex);
      setupScrollAnimations();
      setupBlockDragAndDrop();
      showToast("Block reordered!");
    });
  });
}
