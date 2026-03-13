/**
 * Minecraft Anvil Cost Calculator
 *
 * Based on the correct anvil mechanics from the Minecraft Wiki:
 *   merge_cost = sacrifice.value + 2^target.work - 1 + 2^sacrifice.work - 1
 *   result.value = target.value + sacrifice.value
 *   result.work = max(target.work, sacrifice.work) + 1
 *
 * Where value = accumulated enchantment cost (initially: level * weight per enchantment)
 *
 * XP cost uses tiered formula:
 *   1-16:  level^2 + 6*level
 *   17-31: 2.5*level^2 - 40.5*level + 360
 *   32+:   4.5*level^2 - 162.5*level + 2220
 */

const MAXIMUM_MERGE_LEVELS = 39;

// ==================== Data Structures ====================

class ItemObj {
  /**
   * @param {string} namespace - 'book', 'item', or an enchantment ID
   * @param {number} value - accumulated enchantment cost
   * @param {number[]} enchantIds - list of enchantment IDs (indices into ENCHANTMENT_DB)
   */
  constructor(namespace, value = 0, enchantIds = []) {
    this.i = namespace;
    this.e = enchantIds.slice();
    this.c = {};      // instruction tree for step extraction
    this.w = 0;       // work counter (prior work penalty = 2^w - 1)
    this.l = value;   // accumulated value
    this.x = 0;       // total XP cost
  }
}

class MergeEnchants extends ItemObj {
  constructor(left, right) {
    const mergeCost = right.l + Math.pow(2, left.w) - 1 + Math.pow(2, right.w) - 1;
    if (mergeCost > MAXIMUM_MERGE_LEVELS) {
      throw new MergeTooExpensiveError();
    }
    const newValue = left.l + right.l;
    super(left.i, newValue);
    this.e = left.e.concat(right.e);
    this.w = Math.max(left.w, right.w) + 1;
    this.x = left.x + right.x + experience(mergeCost);
    this.c = { L: left.c, R: right.c, l: mergeCost, w: this.w, v: this.l };
  }
}

class MergeTooExpensiveError extends Error {
  constructor() {
    super("Merge cost exceeds maximum allowed levels");
    this.name = "MergeTooExpensiveError";
  }
}

// ==================== XP Calculation ====================

function experience(level) {
  if (level === 0) return 0;
  if (level <= 16) return level * level + 6 * level;
  if (level <= 31) return 2.5 * level * level - 40.5 * level + 360;
  return 4.5 * level * level - 162.5 * level + 2220;
}

// ==================== Memoization ====================

let memoResults = {};

function hashFromItem(item) {
  const sorted = item.e.slice().sort();
  return [item.i[0], sorted, item.w];
}

function memoizeHashFromArgs(args) {
  const items = args[0];
  return items.map(item => hashFromItem(item));
}

function memoize(fn) {
  return function(...args) {
    const key = JSON.stringify(memoizeHashFromArgs(args));
    if (!memoResults[key]) {
      memoResults[key] = fn(...args);
    }
    return memoResults[key];
  };
}

// ==================== Combination Generator ====================

function combinations(set, k) {
  if (k > set.length || k <= 0) return [];
  if (k === set.length) return [set];
  if (k === 1) return set.map(item => [item]);

  const combs = [];
  for (let i = 0; i <= set.length - k; i++) {
    const head = [set[i]];
    const tailCombs = combinations(set.slice(i + 1), k - 1);
    for (let j = 0; j < tailCombs.length; j++) {
      combs.push(head.concat(tailCombs[j]));
    }
  }
  return combs;
}

// ==================== Core Algorithm ====================

const cheapestItemsFromList = memoize(function(items) {
  const work2item = {};
  const count = items.length;

  if (count === 1) {
    work2item[items[0].w] = items[0];
    return work2item;
  }

  if (count === 2) {
    const cheapest = cheapestFromTwo(items[0], items[1]);
    work2item[cheapest.w] = cheapest;
    return work2item;
  }

  return cheapestFromListN(items, Math.floor(count / 2));
});

function cheapestFromTwo(left, right) {
  // If one is an 'item', it must be on the left (target slot)
  if (right.i === "item") return new MergeEnchants(right, left);
  if (left.i === "item") return new MergeEnchants(left, right);

  let normal;
  try { normal = new MergeEnchants(left, right); } catch { return new MergeEnchants(right, left); }

  let reversed;
  try { reversed = new MergeEnchants(right, left); } catch { return normal; }

  const compared = compareCheapest(normal, reversed);
  const keys = Object.keys(compared);
  return compared[keys[0]];
}

function cheapestFromListN(items, maxSubcount) {
  const cheapestWork2item = {};
  const knownWorks = [];

  for (let subcount = 1; subcount <= maxSubcount; subcount++) {
    combinations(items, subcount).forEach(leftItems => {
      const rightItems = items.filter(item => !leftItems.includes(item));

      const leftW2i = cheapestItemsFromList(leftItems);
      const rightW2i = cheapestItemsFromList(rightItems);
      const newW2i = cheapestFromDictionaries2(leftW2i, rightW2i);

      for (const work in newW2i) {
        const newItem = newW2i[work];
        if (knownWorks.includes(work)) {
          const cur = cheapestWork2item[work];
          const compared = compareCheapest(cur, newItem);
          cheapestWork2item[work] = compared[work];
        } else {
          cheapestWork2item[work] = newItem;
          knownWorks.push(work);
        }
      }
    });
  }
  return cheapestWork2item;
}

function compareCheapest(item1, item2) {
  const w2i = {};
  const w1 = item1.w, w2 = item2.w;

  if (w1 === w2) {
    if (item1.l === item2.l) {
      w2i[item1.x <= item2.x ? w1 : w2] = item1.x <= item2.x ? item1 : item2;
    } else if (item1.l < item2.l) {
      w2i[w1] = item1;
    } else {
      w2i[w2] = item2;
    }
  } else {
    w2i[w1] = item1;
    w2i[w2] = item2;
  }
  return w2i;
}

function cheapestFromDictionaries2(leftW2i, rightW2i) {
  let cheapestW2i = {};
  const knownWorks = [];

  for (const lw in leftW2i) {
    for (const rw in rightW2i) {
      let newW2i;
      try {
        newW2i = cheapestItemsFromList([leftW2i[lw], rightW2i[rw]]);
      } catch (e) {
        if (!(e instanceof MergeTooExpensiveError)) throw e;
        continue;
      }

      for (const work in newW2i) {
        const newItem = newW2i[work];
        if (knownWorks.includes(work)) {
          const cur = cheapestW2i[work];
          const compared = compareCheapest(cur, newItem);
          cheapestW2i[work] = compared[work];
        } else {
          cheapestW2i[work] = newItem;
          knownWorks.push(work);
        }
      }
    }
  }

  cheapestW2i = removeExpensiveCandidates(cheapestW2i);
  return cheapestW2i;
}

function removeExpensiveCandidates(w2i) {
  const result = {};
  let cheapestValue;

  for (const work in w2i) {
    const value = w2i[work].l;
    if (!(value >= cheapestValue)) {
      result[work] = w2i[work];
      cheapestValue = value;
    }
  }
  return result;
}

// ==================== Public API ====================

/**
 * Build an enchantment ID lookup from selected enchantments.
 * Returns a map from enchantment string ID to numeric index.
 */
function buildIdLookup(enchantments) {
  const lookup = {};
  enchantments.forEach((ench, idx) => {
    lookup[ench.id] = idx;
  });
  return lookup;
}

/**
 * Build weight lookup from selected enchantments.
 */
function buildWeightLookup(enchantments) {
  return enchantments.map(ench => {
    const data = ENCHANTMENT_DB.find(e => e.id === ench.id);
    return data ? data.weight : 1;
  });
}

/**
 * Calculate optimal enchantment order.
 *
 * @param {string} itemType - 'book' or item name
 * @param {Array<{id: string, level: number}>} enchantments - selected enchantments
 * @param {Array<{enchantments: Object, label: string}>} multiBooks - pre-combined books
 * @returns {Object} { instructions, totalLevels, totalXP, tooExpensive, itemObj }
 */
function calculateOptimalOrder(itemType, enchantments, multiBooks = []) {
  // Reset memoization
  memoResults = {};

  // Build ID and weight lookups
  const allEnchIds = {};
  const allWeights = [];
  let nextId = 0;

  // Register all enchantments we'll encounter
  const allEnchantmentIds = new Set();
  enchantments.forEach(e => allEnchantmentIds.add(e.id));
  multiBooks.forEach(mb => {
    Object.keys(mb.enchantments).forEach(id => allEnchantmentIds.add(id));
  });

  allEnchantmentIds.forEach(enchId => {
    const data = ENCHANTMENT_DB.find(e => e.id === enchId);
    allEnchIds[enchId] = nextId;
    allWeights[nextId] = data ? data.weight : 1;
    nextId++;
  });

  // Create book objects for individual enchantments
  const enchantObjs = enchantments.map(ench => {
    const id = allEnchIds[ench.id];
    const value = ench.level * allWeights[id];
    const obj = new ItemObj("book", value, [id]);
    obj.c = { I: id, l: obj.l, w: obj.w };
    return obj;
  });

  // Create book objects for multi-enchantment books
  multiBooks.forEach(mb => {
    let totalValue = 0;
    const ids = [];
    for (const [enchId, level] of Object.entries(mb.enchantments)) {
      const id = allEnchIds[enchId];
      totalValue += level * allWeights[id];
      ids.push(id);
    }
    const obj = new ItemObj("book", totalValue, ids);
    obj.c = { I: "multi", l: obj.l, w: obj.w, ids: ids };
    enchantObjs.push(obj);
  });

  if (enchantObjs.length === 0) {
    return { instructions: [], totalLevels: 0, totalXP: 0, tooExpensive: false };
  }

  // Find most expensive enchantment
  let mostExpIdx = 0;
  for (let i = 1; i < enchantObjs.length; i++) {
    if (enchantObjs[i].l > enchantObjs[mostExpIdx].l) mostExpIdx = i;
  }

  // Create the base item
  let item;
  if (itemType === "book") {
    const id = enchantObjs[mostExpIdx].e[0];
    item = new ItemObj(String(id), enchantObjs[mostExpIdx].l);
    item.e.push(id);
    enchantObjs.splice(mostExpIdx, 1);
    // Find new most expensive
    if (enchantObjs.length > 0) {
      mostExpIdx = 0;
      for (let i = 1; i < enchantObjs.length; i++) {
        if (enchantObjs[i].l > enchantObjs[mostExpIdx].l) mostExpIdx = i;
      }
    }
  } else {
    item = new ItemObj("item");
  }

  if (enchantObjs.length === 0) {
    // Only one enchantment, nothing to merge
    return {
      instructions: [],
      totalLevels: 0,
      totalXP: 0,
      tooExpensive: false,
    };
  }

  // Merge most expensive enchantment with base item
  let mergedItem;
  try {
    mergedItem = new MergeEnchants(item, enchantObjs[mostExpIdx]);
    mergedItem.c.L = { I: item.i, l: 0, w: 0 };
  } catch (e) {
    return {
      instructions: [],
      totalLevels: 0,
      totalXP: 0,
      tooExpensive: true,
      error: "First merge exceeds cost limit",
    };
  }
  enchantObjs.splice(mostExpIdx, 1);

  if (enchantObjs.length === 0) {
    // Only two items total, already merged
    const instructions = extractInstructions(mergedItem.c, allEnchIds);
    let totalLevels = 0;
    instructions.forEach(step => totalLevels += step.mergeCost);
    return {
      instructions,
      totalLevels,
      totalXP: experience(totalLevels),
      tooExpensive: instructions.some(s => s.mergeCost > MAXIMUM_MERGE_LEVELS),
    };
  }

  // Combine remaining items and find optimal order
  const allObjs = enchantObjs.concat(mergedItem);
  let cheapestItems;
  try {
    cheapestItems = cheapestItemsFromList(allObjs);
  } catch (e) {
    return {
      instructions: [],
      totalLevels: 0,
      totalXP: 0,
      tooExpensive: true,
      error: "No valid combination found within cost limits",
    };
  }

  // Find cheapest result
  let cheapestCost = Infinity;
  let cheapestKey;
  for (const key in cheapestItems) {
    const xpCost = cheapestItems[key].x;
    if (xpCost < cheapestCost) {
      cheapestCost = xpCost;
      cheapestKey = key;
    }
  }

  if (!cheapestKey) {
    return {
      instructions: [],
      totalLevels: 0,
      totalXP: 0,
      tooExpensive: true,
      error: "No valid combination found",
    };
  }

  const cheapestItem = cheapestItems[cheapestKey];
  const instructions = extractInstructions(cheapestItem.c, allEnchIds);

  let totalLevels = 0;
  instructions.forEach(step => totalLevels += step.mergeCost);

  return {
    instructions,
    totalLevels,
    totalXP: experience(totalLevels),
    tooExpensive: instructions.some(s => s.mergeCost > MAXIMUM_MERGE_LEVELS),
  };
}

// ==================== Instruction Extraction ====================

/**
 * Reverse lookup: numeric ID -> enchantment string ID
 */
function reverseIdLookup(allEnchIds) {
  const reverse = {};
  for (const [strId, numId] of Object.entries(allEnchIds)) {
    reverse[numId] = strId;
  }
  return reverse;
}

/**
 * Extract step-by-step instructions from the instruction tree.
 */
function extractInstructions(comb, allEnchIds) {
  const reverseLookup = reverseIdLookup(allEnchIds);
  const instructions = [];

  function walk(node) {
    for (const key in node) {
      if (key === "L" || key === "R") {
        if (typeof node[key].I === "undefined") {
          walk(node[key]);
        }
        // Resolve numeric IDs to enchantment names
        if (Number.isInteger(node[key].I)) {
          const numId = node[key].I;
          const strId = reverseLookup[numId];
          if (strId) {
            const enchData = ENCHANTMENT_DB.find(e => e.id === strId);
            node[key].I = enchData ? enchData.name : strId;
          }
        } else if (typeof node[key].I === "string") {
          if (node[key].I === "item") {
            node[key].I = "Item";
          } else if (node[key].I === "multi") {
            node[key].I = "Multi-Book";
          } else if (!isNaN(parseInt(node[key].I))) {
            const numId = parseInt(node[key].I);
            const strId = reverseLookup[numId];
            if (strId) {
              const enchData = ENCHANTMENT_DB.find(e => e.id === strId);
              node[key].I = enchData ? enchData.name : strId;
            }
          }
        }
      }
    }

    // Calculate merge cost for this step
    let mergeCost;
    if (Number.isInteger(node.R.v)) {
      mergeCost = node.R.v + Math.pow(2, node.L.w) - 1 + Math.pow(2, node.R.w) - 1;
    } else {
      mergeCost = node.R.l + Math.pow(2, node.L.w) - 1 + Math.pow(2, node.R.w) - 1;
    }

    const work = Math.max(node.L.w, node.R.w) + 1;

    instructions.push({
      left: node.L,
      right: node.R,
      mergeCost: mergeCost,
      xpCost: experience(mergeCost),
      priorWorkAfter: Math.pow(2, work) - 1,
    });
  }

  walk(comb);
  return instructions;
}

/**
 * Get a display label for an instruction side (left or right).
 */
function getStepLabel(side) {
  if (side.I) {
    return String(side.I);
  }
  return "Combined";
}

/**
 * Convert number to Roman numeral
 */
function toRoman(num) {
  const map = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };
  if (map[num]) return map[num];
  return String(num);
}
