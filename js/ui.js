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

  document.querySelectorAll(".item-btn").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.itemId === itemId);
  });

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

    const weightInfo = document.createElement("span");
    weightInfo.className = "weight-info";
    weightInfo.textContent = `(wt: ${ench.weight})`;

    row.appendChild(checkbox);
    row.appendChild(label);
    row.appendChild(levelSelect);
    row.appendChild(weightInfo);
    container.appendChild(row);
  });
}

function toggleEnchantment(enchId, checked) {
  if (checked) {
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

  if (selectedEnchantments.length === 0 && multiBooks.length === 0) return;

  // Show loading state
  const resultsSection = document.getElementById("results-section");
  resultsSection.classList.remove("hidden");
  document.getElementById("results-content").innerHTML = '<div class="loading">Calculating optimal order...</div>';

  setTimeout(() => {
    const result = calculateOptimalOrder(selectedItem, selectedEnchantments, multiBooks);
    renderResults(result);
  }, 50);
}

// ==================== Results Rendering ====================

function renderResults(result) {
  const container = document.getElementById("results-content");
  container.innerHTML = "";

  if (result.error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "too-expensive-warning";
    errorDiv.textContent = result.error;
    container.appendChild(errorDiv);
    return;
  }

  // Summary
  const summary = document.createElement("div");
  summary.className = "results-summary";

  const totalCostEl = document.createElement("div");
  totalCostEl.className = "total-cost" + (result.tooExpensive ? " too-expensive" : "");
  totalCostEl.innerHTML = `
    <span class="cost-label">Total:</span>
    <span class="cost-value">${result.totalLevels} levels</span>
    <span class="cost-xp">(${Math.floor(result.totalXP)} XP)</span>
  `;
  summary.appendChild(totalCostEl);

  if (result.tooExpensive) {
    const warning = document.createElement("div");
    warning.className = "too-expensive-warning";
    warning.textContent = "One or more steps exceed the 39-level survival mode cap. Consider using fewer enchantments or creative mode.";
    summary.appendChild(warning);
  }

  container.appendChild(summary);

  // Step-by-step instructions
  if (result.instructions.length === 0) return;

  const stepsSection = document.createElement("div");
  stepsSection.className = "steps-section";
  const stepsTitle = document.createElement("h3");
  stepsTitle.textContent = "Step-by-Step Instructions";
  stepsSection.appendChild(stepsTitle);

  result.instructions.forEach((step, idx) => {
    const isTooExpensive = step.mergeCost > MAXIMUM_MERGE_LEVELS;
    const stepEl = document.createElement("div");
    stepEl.className = "step" + (isTooExpensive ? " step-too-expensive" : "");

    const stepNum = document.createElement("div");
    stepNum.className = "step-number";
    stepNum.textContent = `Step ${idx + 1}`;

    const stepDetail = document.createElement("div");
    stepDetail.className = "step-detail";

    const leftLabel = getStepLabel(step.left);
    const rightLabel = getStepLabel(step.right);

    const targetSlot = document.createElement("div");
    targetSlot.className = "anvil-slot target-slot";
    targetSlot.innerHTML = `<span class="slot-label">Left:</span> <span class="slot-value">${escapeHtml(leftLabel)}</span>`;

    const plusSign = document.createElement("div");
    plusSign.className = "plus-sign";
    plusSign.textContent = "+";

    const sacrificeSlot = document.createElement("div");
    sacrificeSlot.className = "anvil-slot sacrifice-slot";
    sacrificeSlot.innerHTML = `<span class="slot-label">Right:</span> <span class="slot-value">${escapeHtml(rightLabel)}</span>`;

    const costBadge = document.createElement("div");
    costBadge.className = "step-cost" + (isTooExpensive ? " too-expensive" : "");
    costBadge.innerHTML = `${step.mergeCost} lvl <span class="step-xp">(${Math.floor(step.xpCost)} XP)</span>`;

    stepDetail.appendChild(targetSlot);
    stepDetail.appendChild(plusSign);
    stepDetail.appendChild(sacrificeSlot);

    stepEl.appendChild(stepNum);
    stepEl.appendChild(stepDetail);
    stepEl.appendChild(costBadge);
    stepsSection.appendChild(stepEl);
  });

  container.appendChild(stepsSection);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
