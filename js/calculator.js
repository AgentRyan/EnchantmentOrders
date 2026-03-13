/**
 * Minecraft Anvil Cost Calculator
 * Implements the anvil mechanics and optimal merge tree algorithm.
 *
 * Anvil cost for combining target (left) + sacrifice (right):
 *   cost = priorWorkPenalty(target) + priorWorkPenalty(sacrifice) + enchantmentCost
 *   where priorWorkPenalty = 2^n - 1 (n = number of prior anvil uses on that item)
 *
 * The enchantment cost depends on whether the sacrifice is a book or item,
 * using the respective multiplier * enchantment level for each enchantment
 * being transferred.
 */

const TOO_EXPENSIVE_THRESHOLD = 40;

/**
 * Represents an item (or book) in the anvil system.
 * - enchantments: Map of enchantmentId -> level
 * - priorWork: number of prior anvil operations (penalty = 2^priorWork - 1)
 * - isBook: whether this is an enchanted book
 * - label: display label for the merge tree
 */
class AnvilItem {
  constructor(enchantments = {}, priorWork = 0, isBook = true, label = "") {
    this.enchantments = { ...enchantments };
    this.priorWork = priorWork;
    this.isBook = isBook;
    this.label = label;
  }

  clone() {
    const c = new AnvilItem(this.enchantments, this.priorWork, this.isBook, this.label);
    return c;
  }

  get penalty() {
    return (1 << this.priorWork) - 1; // 2^n - 1
  }
}

/**
 * Calculate the cost of combining target (left slot) with sacrifice (right slot).
 * Returns { cost, result } where result is the new AnvilItem.
 */
function calculateAnvilCost(target, sacrifice) {
  let cost = 0;

  // Prior work penalties
  cost += target.penalty;
  cost += sacrifice.penalty;

  // Enchantment cost: for each enchantment on the sacrifice
  const resultEnchantments = { ...target.enchantments };

  for (const [enchId, sacLevel] of Object.entries(sacrifice.enchantments)) {
    const enchData = ENCHANTMENT_DB.find(e => e.id === enchId);
    if (!enchData) continue;

    const multiplier = sacrifice.isBook ? enchData.bookMultiplier : enchData.itemMultiplier;
    const targetLevel = target.enchantments[enchId] || 0;

    let finalLevel;
    if (targetLevel === sacLevel) {
      finalLevel = Math.min(targetLevel + 1, enchData.maxLevel);
    } else {
      finalLevel = Math.max(targetLevel, sacLevel);
    }

    // Check for exclusivity with existing enchantments on target
    const isExclusive = Object.keys(target.enchantments).some(
      tEnchId => tEnchId !== enchId && areExclusive(tEnchId, enchId)
    );

    if (isExclusive) {
      // Incompatible enchantment: costs 1 level in Java Edition
      cost += 1;
      continue;
    }

    // Cost is multiplier * final level (only the new/changed levels count)
    // Actually, the cost is multiplier * level of the sacrifice enchantment
    // being applied, but if combining same enchantments the cost is based
    // on the resulting level
    const appliedLevel = finalLevel;
    cost += multiplier * appliedLevel;

    resultEnchantments[enchId] = finalLevel;
  }

  const resultPriorWork = Math.max(target.priorWork, sacrifice.priorWork) + 1;

  const result = new AnvilItem(
    resultEnchantments,
    resultPriorWork,
    target.isBook,
    ""
  );

  return { cost, result };
}

/**
 * A node in the merge tree for visualization
 */
class MergeNode {
  constructor(item, left = null, right = null, cost = 0) {
    this.item = item;
    this.left = left;
    this.right = right;
    this.cost = cost; // cost of this specific merge step
  }
}

/**
 * Find the optimal merge order using brute-force over all binary merge trees.
 *
 * For n items, we try every way to pick two items, merge them, and recurse.
 * This is O(n! * 2^n) roughly, but fine for n <= 8.
 *
 * items: array of { enchantmentId, level } for individual books,
 *        plus the target item as the first element.
 *
 * Returns { totalCost, steps, mergeTree, tooExpensive }
 */
function findOptimalOrder(targetItem, enchantedBooks) {
  if (enchantedBooks.length === 0) {
    return { totalCost: 0, steps: [], mergeTree: new MergeNode(targetItem), tooExpensive: false };
  }

  // Create leaf nodes for the merge tree
  const leaves = new Map();
  const allItems = [targetItem, ...enchantedBooks];
  allItems.forEach((item, i) => {
    leaves.set(item, new MergeNode(item));
  });

  let bestResult = null;
  let bestCost = Infinity;

  /**
   * Recursive function: given a list of current items and their merge nodes,
   * find the optimal sequence of merges.
   *
   * Important constraint: the target item (non-book) must always be in the
   * left (target) slot when it's involved, and the final result must be
   * on the target item.
   */
  function solve(items, nodes, currentCost, steps) {
    if (items.length === 1) {
      if (currentCost < bestCost) {
        bestCost = currentCost;
        bestResult = { totalCost: currentCost, steps: [...steps], mergeTree: nodes[0] };
      }
      return;
    }

    // Pruning: if current cost already >= best, skip
    if (currentCost >= bestCost) return;

    // Try every pair (i, j) where i is target, j is sacrifice
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items.length; j++) {
        if (i === j) continue;

        // The non-book item must always be the target (left slot)
        // A book should not be the target if a non-book is the sacrifice
        if (items[i].isBook && !items[j].isBook) continue;

        // If neither is a book, the target item should be in the left slot
        // (we track this by isBook=false for the original item)

        const { cost, result } = calculateAnvilCost(items[i], items[j]);
        const stepCost = cost;
        const newTotal = currentCost + stepCost;

        // Pruning
        if (newTotal >= bestCost) continue;

        // Check too expensive for this step
        // We still continue to find if there's a valid order
        // but track if any step exceeds the limit

        const newItems = items.filter((_, idx) => idx !== i && idx !== j);
        result.isBook = items[i].isBook; // preserve item type
        result.label = "";
        newItems.push(result);

        const stepInfo = {
          targetLabel: items[i].label || formatEnchantments(items[i].enchantments),
          sacrificeLabel: items[j].label || formatEnchantments(items[j].enchantments),
          cost: stepCost,
          resultEnchantments: { ...result.enchantments },
          targetIsBook: items[i].isBook,
          sacrificeIsBook: items[j].isBook,
          tooExpensive: stepCost >= TOO_EXPENSIVE_THRESHOLD,
        };

        const mergeNode = new MergeNode(result, nodes[i], nodes[j], stepCost);
        const newNodes = nodes.filter((_, idx) => idx !== i && idx !== j);
        newNodes.push(mergeNode);

        steps.push(stepInfo);
        solve(newItems, newNodes, newTotal, steps);
        steps.pop();
      }
    }
  }

  const initialNodes = allItems.map(item => new MergeNode(item));
  solve(allItems, initialNodes, 0, []);

  if (!bestResult) {
    // Fallback: just merge left to right
    return greedyMerge(targetItem, enchantedBooks);
  }

  bestResult.tooExpensive = bestResult.steps.some(s => s.tooExpensive);
  return bestResult;
}

/**
 * Greedy fallback for large enchantment counts (> 8 books).
 * Strategy: sort books by enchantment cost (cheapest first), merge in pairs
 * to build a balanced binary tree, then combine onto the target item.
 */
function greedyMerge(targetItem, enchantedBooks) {
  // Sort by book enchantment cost (multiplier * level), ascending
  const sorted = [...enchantedBooks].sort((a, b) => {
    const costA = getBookCost(a);
    const costB = getBookCost(b);
    return costA - costB;
  });

  // Build balanced merge tree of books first
  let current = sorted.map(book => ({ item: book, node: new MergeNode(book) }));

  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        const { cost, result } = calculateAnvilCost(current[i].item, current[i + 1].item);
        result.isBook = true;
        const node = new MergeNode(result, current[i].node, current[i + 1].node, cost);
        next.push({ item: result, node });
      } else {
        next.push(current[i]);
      }
    }
    current = next;
  }

  // Now merge the combined book onto the target
  if (current.length === 1) {
    const { cost, result } = calculateAnvilCost(targetItem, current[0].item);
    const targetNode = new MergeNode(targetItem);
    const finalNode = new MergeNode(result, targetNode, current[0].node, cost);

    const steps = extractSteps(finalNode);
    const totalCost = steps.reduce((sum, s) => sum + s.cost, 0);
    const tooExpensive = steps.some(s => s.tooExpensive);

    return { totalCost, steps, mergeTree: finalNode, tooExpensive };
  }

  return { totalCost: 0, steps: [], mergeTree: new MergeNode(targetItem), tooExpensive: false };
}

/**
 * Get the total enchantment cost of a book (for sorting)
 */
function getBookCost(book) {
  let cost = 0;
  for (const [enchId, level] of Object.entries(book.enchantments)) {
    const enchData = ENCHANTMENT_DB.find(e => e.id === enchId);
    if (enchData) {
      cost += enchData.bookMultiplier * level;
    }
  }
  return cost;
}

/**
 * Extract step-by-step instructions from a merge tree
 */
function extractSteps(node, steps = []) {
  if (!node.left && !node.right) return steps;

  if (node.left) extractSteps(node.left, steps);
  if (node.right) extractSteps(node.right, steps);

  if (node.left && node.right) {
    steps.push({
      targetLabel: describeNode(node.left),
      sacrificeLabel: describeNode(node.right),
      cost: node.cost,
      resultEnchantments: node.item.enchantments,
      targetIsBook: node.left.item.isBook,
      sacrificeIsBook: node.right.item.isBook,
      tooExpensive: node.cost >= TOO_EXPENSIVE_THRESHOLD,
    });
  }

  return steps;
}

/**
 * Describe a merge tree node for display
 */
function describeNode(node) {
  if (!node.left && !node.right) {
    // Leaf node
    return node.item.label || formatEnchantments(node.item.enchantments);
  }
  return formatEnchantments(node.item.enchantments);
}

/**
 * Format enchantments map as a readable string
 */
function formatEnchantments(enchantments) {
  const parts = [];
  for (const [enchId, level] of Object.entries(enchantments)) {
    const enchData = ENCHANTMENT_DB.find(e => e.id === enchId);
    if (enchData) {
      parts.push(enchData.name + (enchData.maxLevel > 1 ? " " + toRoman(level) : ""));
    }
  }
  return parts.join(", ") || "Item";
}

/**
 * Convert number to Roman numeral
 */
function toRoman(num) {
  const map = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };
  if (map[num]) return map[num];
  return String(num);
}
