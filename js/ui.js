/**
 * UI Controller for the Enchantment Order Calculator
 */

let selectedItem = null;
let selectedEnchantments = []; // array of { id, level }
let multiBooks = []; // array of { enchantments: { id: level, ... }, label: string }

document.addEventListener("DOMContentLoaded", () => {
  renderItemGrid();
  setupDarkMode();
  setupMultiBookUI();
});

// ==================== Dark Mode ====================

function setupDarkMode() {
  const toggle = document.getElementById("dark-mode-toggle");
  const saved = localStorage.getItem("darkMode");
  if (saved === "true" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.setAttribute("data-theme", "dark");
    toggle.checked = true;
  }
  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("darkMode", "false");
    }
  });
}

// ==================== Item Selection ====================

function renderItemGrid() {
  const grid = document.getElementById("item-grid");
  grid.innerHTML = "";
  ITEM_CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "item-btn";
    btn.dataset.itemId = cat.id;
    btn.innerHTML = `<span class="item-icon">${cat.icon}</span><span class="item-name">${cat.name}</span>`;
    btn.addEventListener("click", () => selectItem(cat.id));
    grid.appendChild(btn);
  });
}

function selectItem(itemId) {
  selectedItem = itemId;
  selectedEnchantments = [];
  multiBooks = [];

  // Update button states
  document.querySelectorAll(".item-btn").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.itemId === itemId);
  });

  // Show enchantment section
  document.getElementById("enchantment-section").classList.remove("hidden");
  document.getElementById("results-section").classList.add("hidden");
  document.getElementById("multi-book-section").classList.remove("hidden");

  renderEnchantmentList();
  renderMultiBooks();
  updateCalculateButton();
}

// ==================== Enchantment Selection ====================

function renderEnchantmentList() {
  const container = document.getElementById("enchantment-list");
  container.innerHTML = "";

  const enchantments = getEnchantmentsForItem(selectedItem);

  enchantments.forEach(ench => {
    const row = document.createElement("div");
    row.className = "enchantment-row";
    row.dataset.enchId = ench.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `ench-${ench.id}`;
    checkbox.addEventListener("change", () => toggleEnchantment(ench.id, checkbox.checked));

    const label = document.createElement("label");
    label.htmlFor = `ench-${ench.id}`;
    label.textContent = ench.name;

    const levelSelect = document.createElement("select");
    levelSelect.id = `level-${ench.id}`;
    levelSelect.className = "level-select";
    levelSelect.disabled = true;
    for (let i = 1; i <= ench.maxLevel; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = ench.maxLevel > 1 ? toRoman(i) : "I";
      if (i === ench.maxLevel) opt.selected = true;
      levelSelect.appendChild(opt);
    }
    levelSelect.addEventListener("change", () => updateEnchantmentLevel(ench.id, parseInt(levelSelect.value)));

    const multiplierInfo = document.createElement("span");
    multiplierInfo.className = "multiplier-info";
    multiplierInfo.textContent = `(book: ×${ench.bookMultiplier}, item: ×${ench.itemMultiplier})`;

    row.appendChild(checkbox);
    row.appendChild(label);
    row.appendChild(levelSelect);
    row.appendChild(multiplierInfo);
    container.appendChild(row);
  });
}

function toggleEnchantment(enchId, checked) {
  if (checked) {
    const enchData = ENCHANTMENT_DB.find(e => e.id === enchId);
    const level = parseInt(document.getElementById(`level-${enchId}`).value);
    selectedEnchantments.push({ id: enchId, level });
    document.getElementById(`level-${enchId}`).disabled = false;
  } else {
    selectedEnchantments = selectedEnchantments.filter(e => e.id !== enchId);
    document.getElementById(`level-${enchId}`).disabled = true;
  }

  updateConflictWarnings();
  updateCalculateButton();
}

function updateEnchantmentLevel(enchId, level) {
  const ench = selectedEnchantments.find(e => e.id === enchId);
  if (ench) ench.level = level;
}

function updateConflictWarnings() {
  // Clear old warnings
  document.querySelectorAll(".enchantment-row").forEach(row => {
    row.classList.remove("conflict");
  });
  document.getElementById("conflict-warning").classList.add("hidden");

  const ids = selectedEnchantments.map(e => e.id);
  const conflicts = findConflicts(ids);

  if (conflicts.length > 0) {
    const warningEl = document.getElementById("conflict-warning");
    warningEl.classList.remove("hidden");

    const names = conflicts.map(([a, b]) => {
      const nameA = ENCHANTMENT_DB.find(e => e.id === a).name;
      const nameB = ENCHANTMENT_DB.find(e => e.id === b).name;
      return `${nameA} & ${nameB}`;
    });
    warningEl.textContent = `Conflicting enchantments: ${names.join("; ")}. These cannot coexist on the same item.`;

    conflicts.flat().forEach(id => {
      const row = document.querySelector(`.enchantment-row[data-ench-id="${id}"]`);
      if (row) row.classList.add("conflict");
    });
  }
}

function updateCalculateButton() {
  const btn = document.getElementById("calculate-btn");
  const hasEnchantments = selectedEnchantments.length > 0 || multiBooks.length > 0;
  const ids = selectedEnchantments.map(e => e.id);
  const hasConflicts = findConflicts(ids).length > 0;
  btn.disabled = !hasEnchantments || hasConflicts;
}

// ==================== Multi-Book Support ====================

function setupMultiBookUI() {
  document.getElementById("add-multi-book-btn").addEventListener("click", openMultiBookModal);
  document.getElementById("multi-book-modal-cancel").addEventListener("click", closeMultiBookModal);
  document.getElementById("multi-book-modal-add").addEventListener("click", addMultiBook);
}

function openMultiBookModal() {
  const modal = document.getElementById("multi-book-modal");
  modal.classList.remove("hidden");

  const container = document.getElementById("multi-book-enchantments");
  container.innerHTML = "";

  const enchantments = getEnchantmentsForItem(selectedItem);
  enchantments.forEach(ench => {
    const row = document.createElement("div");
    row.className = "enchantment-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `mb-ench-${ench.id}`;

    const label = document.createElement("label");
    label.htmlFor = `mb-ench-${ench.id}`;
    label.textContent = ench.name;

    const levelSelect = document.createElement("select");
    levelSelect.id = `mb-level-${ench.id}`;
    levelSelect.className = "level-select";
    for (let i = 1; i <= ench.maxLevel; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = ench.maxLevel > 1 ? toRoman(i) : "I";
      if (i === ench.maxLevel) opt.selected = true;
      levelSelect.appendChild(opt);
    }

    row.appendChild(checkbox);
    row.appendChild(label);
    row.appendChild(levelSelect);
    container.appendChild(row);
  });
}

function closeMultiBookModal() {
  document.getElementById("multi-book-modal").classList.add("hidden");
}

function addMultiBook() {
  const enchantments = {};
  const names = [];

  document.querySelectorAll("#multi-book-enchantments .enchantment-row").forEach(row => {
    const checkbox = row.querySelector("input[type=checkbox]");
    if (checkbox && checkbox.checked) {
      const enchId = checkbox.id.replace("mb-ench-", "");
      const level = parseInt(document.getElementById(`mb-level-${enchId}`).value);
      enchantments[enchId] = level;
      const enchData = ENCHANTMENT_DB.find(e => e.id === enchId);
      names.push(enchData.name + (enchData.maxLevel > 1 ? " " + toRoman(level) : ""));
    }
  });

  if (Object.keys(enchantments).length === 0) return;

  multiBooks.push({
    enchantments,
    label: "Book: " + names.join(", "),
  });

  closeMultiBookModal();
  renderMultiBooks();
  updateCalculateButton();
}

function renderMultiBooks() {
  const container = document.getElementById("multi-book-list");
  container.innerHTML = "";

  multiBooks.forEach((book, idx) => {
    const div = document.createElement("div");
    div.className = "multi-book-item";

    const span = document.createElement("span");
    span.textContent = book.label;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-book-btn";
    removeBtn.textContent = "\u00D7";
    removeBtn.addEventListener("click", () => {
      multiBooks.splice(idx, 1);
      renderMultiBooks();
      updateCalculateButton();
    });

    div.appendChild(span);
    div.appendChild(removeBtn);
    container.appendChild(div);
  });
}

// ==================== Calculation ====================

function calculate() {
  const ids = selectedEnchantments.map(e => e.id);
  if (findConflicts(ids).length > 0) return;

  // Create the target item (no enchantments, not a book)
  const itemName = ITEM_CATEGORIES.find(c => c.id === selectedItem).name;
  const targetItem = new AnvilItem({}, 0, false, itemName);

  // Create individual books for each selected enchantment
  const books = selectedEnchantments.map(e => {
    const enchData = ENCHANTMENT_DB.find(ed => ed.id === e.id);
    const label = enchData.name + (enchData.maxLevel > 1 ? " " + toRoman(e.level) : "");
    return new AnvilItem({ [e.id]: e.level }, 0, true, label);
  });

  // Add multi-enchantment books
  multiBooks.forEach(mb => {
    books.push(new AnvilItem(mb.enchantments, 0, true, mb.label));
  });

  if (books.length === 0) return;

  // Show loading state
  const resultsSection = document.getElementById("results-section");
  resultsSection.classList.remove("hidden");
  document.getElementById("results-content").innerHTML = '<div class="loading">Calculating optimal order...</div>';

  // Use setTimeout to allow UI to update before heavy computation
  setTimeout(() => {
    const useGreedy = books.length > 8;
    let result;

    if (useGreedy) {
      result = greedyMerge(targetItem, books);
    } else {
      result = findOptimalOrder(targetItem, books);
    }

    renderResults(result, useGreedy, books.length);
  }, 50);
}

// ==================== Results Rendering ====================

function renderResults(result, usedGreedy, bookCount) {
  const container = document.getElementById("results-content");
  container.innerHTML = "";

  // Summary
  const summary = document.createElement("div");
  summary.className = "results-summary";

  const totalCostEl = document.createElement("div");
  totalCostEl.className = "total-cost" + (result.tooExpensive ? " too-expensive" : "");
  totalCostEl.innerHTML = `<span class="cost-label">Total XP Cost:</span> <span class="cost-value">${result.totalCost} levels</span>`;
  summary.appendChild(totalCostEl);

  if (result.tooExpensive) {
    const warning = document.createElement("div");
    warning.className = "too-expensive-warning";
    warning.textContent = "One or more steps exceed the 40-level survival mode cap. Consider using fewer enchantments or creative mode.";
    summary.appendChild(warning);
  }

  if (usedGreedy) {
    const note = document.createElement("div");
    note.className = "greedy-note";
    note.textContent = `Used heuristic optimization (${bookCount} books). For guaranteed optimal results, use 8 or fewer enchantments.`;
    summary.appendChild(note);
  }

  container.appendChild(summary);

  // Step-by-step instructions
  const stepsSection = document.createElement("div");
  stepsSection.className = "steps-section";
  const stepsTitle = document.createElement("h3");
  stepsTitle.textContent = "Step-by-Step Instructions";
  stepsSection.appendChild(stepsTitle);

  result.steps.forEach((step, idx) => {
    const stepEl = document.createElement("div");
    stepEl.className = "step" + (step.tooExpensive ? " step-too-expensive" : "");

    const stepNum = document.createElement("div");
    stepNum.className = "step-number";
    stepNum.textContent = `Step ${idx + 1}`;

    const stepDetail = document.createElement("div");
    stepDetail.className = "step-detail";

    const targetSlot = document.createElement("div");
    targetSlot.className = "anvil-slot target-slot";
    targetSlot.innerHTML = `<span class="slot-label">Left:</span> <span class="slot-value">${escapeHtml(step.targetLabel)}</span>`;

    const plusSign = document.createElement("div");
    plusSign.className = "plus-sign";
    plusSign.textContent = "+";

    const sacrificeSlot = document.createElement("div");
    sacrificeSlot.className = "anvil-slot sacrifice-slot";
    sacrificeSlot.innerHTML = `<span class="slot-label">Right:</span> <span class="slot-value">${escapeHtml(step.sacrificeLabel)}</span>`;

    const costBadge = document.createElement("div");
    costBadge.className = "step-cost" + (step.tooExpensive ? " too-expensive" : "");
    costBadge.textContent = `${step.cost} levels`;

    stepDetail.appendChild(targetSlot);
    stepDetail.appendChild(plusSign);
    stepDetail.appendChild(sacrificeSlot);

    stepEl.appendChild(stepNum);
    stepEl.appendChild(stepDetail);
    stepEl.appendChild(costBadge);
    stepsSection.appendChild(stepEl);
  });

  container.appendChild(stepsSection);

  // Visual merge tree
  renderMergeTree(container, result.mergeTree);
}

// ==================== Merge Tree Visualization ====================

function renderMergeTree(container, tree) {
  const section = document.createElement("div");
  section.className = "tree-section";
  const title = document.createElement("h3");
  title.textContent = "Merge Tree";
  section.appendChild(title);

  const treeContainer = document.createElement("div");
  treeContainer.className = "merge-tree-container";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "merge-tree-svg");

  // Measure and layout the tree
  const layout = layoutTree(tree);
  const padding = 20;
  const svgWidth = (layout.width + 2) * padding * 3;
  const svgHeight = (layout.height + 1) * 80 + 40;

  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
  svg.setAttribute("width", "100%");
  svg.style.maxHeight = `${Math.min(svgHeight, 600)}px`;

  drawTreeNode(svg, layout, svgWidth / 2, 30, svgWidth * 0.4, 0);

  treeContainer.appendChild(svg);
  section.appendChild(treeContainer);
  container.appendChild(section);
}

function layoutTree(node) {
  if (!node.left && !node.right) {
    return {
      node,
      width: 1,
      height: 0,
      label: node.item.label || formatEnchantments(node.item.enchantments),
    };
  }
  const left = node.left ? layoutTree(node.left) : null;
  const right = node.right ? layoutTree(node.right) : null;
  const width = (left ? left.width : 0) + (right ? right.width : 0);
  const height = 1 + Math.max(left ? left.height : 0, right ? right.height : 0);
  return {
    node,
    left,
    right,
    width,
    height,
    label: formatEnchantments(node.item.enchantments),
    cost: node.cost,
  };
}

function drawTreeNode(svg, layout, x, y, spread, depth) {
  const ns = "http://www.w3.org/2000/svg";

  // Draw node
  const g = document.createElementNS(ns, "g");

  // Background rect
  const label = truncateLabel(layout.label, 25);
  const rectWidth = Math.max(label.length * 7.5 + 16, 80);
  const rectHeight = 32;

  const rect = document.createElementNS(ns, "rect");
  rect.setAttribute("x", x - rectWidth / 2);
  rect.setAttribute("y", y - rectHeight / 2);
  rect.setAttribute("width", rectWidth);
  rect.setAttribute("height", rectHeight);
  rect.setAttribute("rx", 6);
  rect.setAttribute("class", layout.left ? "tree-node-merge" : "tree-node-leaf");
  g.appendChild(rect);

  // Label text
  const text = document.createElementNS(ns, "text");
  text.setAttribute("x", x);
  text.setAttribute("y", y + 4);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("class", "tree-node-text");
  text.textContent = label;
  g.appendChild(text);

  // Cost label for merge nodes
  if (layout.cost) {
    const costText = document.createElementNS(ns, "text");
    costText.setAttribute("x", x);
    costText.setAttribute("y", y + rectHeight / 2 + 14);
    costText.setAttribute("text-anchor", "middle");
    costText.setAttribute("class", "tree-cost-text" + (layout.cost >= TOO_EXPENSIVE_THRESHOLD ? " too-expensive-text" : ""));
    costText.textContent = `${layout.cost} lvl`;
    g.appendChild(costText);
  }

  svg.appendChild(g);

  const childY = y + 80;
  const childSpread = spread * 0.55;

  // Draw children
  if (layout.left) {
    const leftX = x - spread;
    // Draw line
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", y + rectHeight / 2);
    line.setAttribute("x2", leftX);
    line.setAttribute("y2", childY - rectHeight / 2);
    line.setAttribute("class", "tree-line");
    svg.appendChild(line);
    drawTreeNode(svg, layout.left, leftX, childY, childSpread, depth + 1);
  }

  if (layout.right) {
    const rightX = x + spread;
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", y + rectHeight / 2);
    line.setAttribute("x2", rightX);
    line.setAttribute("y2", childY - rectHeight / 2);
    line.setAttribute("class", "tree-line");
    svg.appendChild(line);
    drawTreeNode(svg, layout.right, rightX, childY, childSpread, depth + 1);
  }
}

function truncateLabel(label, maxLen) {
  if (label.length <= maxLen) return label;
  return label.substring(0, maxLen - 1) + "\u2026";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
