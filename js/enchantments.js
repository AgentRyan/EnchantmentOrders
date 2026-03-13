/**
 * Minecraft Java Edition Enchantment Database
 * Source: Minecraft Wiki (Java Edition 1.21+)
 *
 * Each enchantment has:
 *   - name: Display name
 *   - id: Internal ID
 *   - maxLevel: Maximum enchantment level
 *   - itemMultiplier: Cost multiplier when applied to an item
 *   - bookMultiplier: Cost multiplier when applied via book
 *   - items: Array of item categories this enchantment applies to
 *   - exclusiveWith: Array of enchantment IDs that conflict
 */

const ENCHANTMENT_DB = [
  // === Melee Weapon Enchantments ===
  { id: "sharpness", name: "Sharpness", maxLevel: 5, itemMultiplier: 1, bookMultiplier: 1,
    items: ["sword", "axe"], exclusiveWith: ["smite", "bane_of_arthropods", "cleaving"] },
  { id: "smite", name: "Smite", maxLevel: 5, itemMultiplier: 1, bookMultiplier: 1,
    items: ["sword", "axe"], exclusiveWith: ["sharpness", "bane_of_arthropods", "cleaving"] },
  { id: "bane_of_arthropods", name: "Bane of Arthropods", maxLevel: 5, itemMultiplier: 1, bookMultiplier: 1,
    items: ["sword", "axe"], exclusiveWith: ["sharpness", "smite", "cleaving"] },
  { id: "cleaving", name: "Cleaving", maxLevel: 3, itemMultiplier: 1, bookMultiplier: 1,
    items: ["axe"], exclusiveWith: ["sharpness", "smite", "bane_of_arthropods"] },
  { id: "knockback", name: "Knockback", maxLevel: 2, itemMultiplier: 1, bookMultiplier: 1,
    items: ["sword"], exclusiveWith: [] },
  { id: "fire_aspect", name: "Fire Aspect", maxLevel: 2, itemMultiplier: 2, bookMultiplier: 1,
    items: ["sword"], exclusiveWith: [] },
  { id: "looting", name: "Looting", maxLevel: 3, itemMultiplier: 2, bookMultiplier: 1,
    items: ["sword"], exclusiveWith: [] },
  { id: "sweeping_edge", name: "Sweeping Edge", maxLevel: 3, itemMultiplier: 2, bookMultiplier: 1,
    items: ["sword"], exclusiveWith: [] },

  // === Ranged Weapon Enchantments ===
  { id: "power", name: "Power", maxLevel: 5, itemMultiplier: 1, bookMultiplier: 1,
    items: ["bow"], exclusiveWith: [] },
  { id: "punch", name: "Punch", maxLevel: 2, itemMultiplier: 2, bookMultiplier: 1,
    items: ["bow"], exclusiveWith: [] },
  { id: "flame", name: "Flame", maxLevel: 1, itemMultiplier: 2, bookMultiplier: 1,
    items: ["bow"], exclusiveWith: [] },
  { id: "infinity", name: "Infinity", maxLevel: 1, itemMultiplier: 4, bookMultiplier: 1,
    items: ["bow"], exclusiveWith: ["mending"] },
  { id: "multishot", name: "Multishot", maxLevel: 1, itemMultiplier: 2, bookMultiplier: 1,
    items: ["crossbow"], exclusiveWith: ["piercing"] },
  { id: "quick_charge", name: "Quick Charge", maxLevel: 3, itemMultiplier: 1, bookMultiplier: 1,
    items: ["crossbow"], exclusiveWith: [] },
  { id: "piercing", name: "Piercing", maxLevel: 4, itemMultiplier: 1, bookMultiplier: 1,
    items: ["crossbow"], exclusiveWith: ["multishot"] },
  { id: "loyalty", name: "Loyalty", maxLevel: 3, itemMultiplier: 1, bookMultiplier: 1,
    items: ["trident"], exclusiveWith: ["riptide"] },
  { id: "impaling", name: "Impaling", maxLevel: 5, itemMultiplier: 2, bookMultiplier: 1,
    items: ["trident"], exclusiveWith: [] },
  { id: "riptide", name: "Riptide", maxLevel: 3, itemMultiplier: 2, bookMultiplier: 1,
    items: ["trident"], exclusiveWith: ["loyalty", "channeling"] },
  { id: "channeling", name: "Channeling", maxLevel: 1, itemMultiplier: 4, bookMultiplier: 1,
    items: ["trident"], exclusiveWith: ["riptide"] },

  // === Tool Enchantments ===
  { id: "efficiency", name: "Efficiency", maxLevel: 5, itemMultiplier: 1, bookMultiplier: 1,
    items: ["pickaxe", "shovel", "axe", "hoe", "shears"], exclusiveWith: [] },
  { id: "silk_touch", name: "Silk Touch", maxLevel: 1, itemMultiplier: 4, bookMultiplier: 1,
    items: ["pickaxe", "shovel", "axe", "hoe"], exclusiveWith: ["fortune"] },
  { id: "fortune", name: "Fortune", maxLevel: 3, itemMultiplier: 2, bookMultiplier: 1,
    items: ["pickaxe", "shovel", "axe", "hoe"], exclusiveWith: ["silk_touch"] },
  { id: "luck_of_the_sea", name: "Luck of the Sea", maxLevel: 3, itemMultiplier: 2, bookMultiplier: 1,
    items: ["fishing_rod"], exclusiveWith: [] },
  { id: "lure", name: "Lure", maxLevel: 3, itemMultiplier: 2, bookMultiplier: 1,
    items: ["fishing_rod"], exclusiveWith: [] },

  // === Armor Enchantments ===
  { id: "protection", name: "Protection", maxLevel: 4, itemMultiplier: 1, bookMultiplier: 1,
    items: ["helmet", "chestplate", "leggings", "boots"], exclusiveWith: ["blast_protection", "fire_protection", "projectile_protection"] },
  { id: "fire_protection", name: "Fire Protection", maxLevel: 4, itemMultiplier: 1, bookMultiplier: 1,
    items: ["helmet", "chestplate", "leggings", "boots"], exclusiveWith: ["protection", "blast_protection", "projectile_protection"] },
  { id: "blast_protection", name: "Blast Protection", maxLevel: 4, itemMultiplier: 2, bookMultiplier: 1,
    items: ["helmet", "chestplate", "leggings", "boots"], exclusiveWith: ["protection", "fire_protection", "projectile_protection"] },
  { id: "projectile_protection", name: "Projectile Protection", maxLevel: 4, itemMultiplier: 1, bookMultiplier: 1,
    items: ["helmet", "chestplate", "leggings", "boots"], exclusiveWith: ["protection", "fire_protection", "blast_protection"] },
  { id: "thorns", name: "Thorns", maxLevel: 3, itemMultiplier: 4, bookMultiplier: 2,
    items: ["helmet", "chestplate", "leggings", "boots"], exclusiveWith: [] },
  { id: "respiration", name: "Respiration", maxLevel: 3, itemMultiplier: 2, bookMultiplier: 1,
    items: ["helmet"], exclusiveWith: [] },
  { id: "aqua_affinity", name: "Aqua Affinity", maxLevel: 1, itemMultiplier: 2, bookMultiplier: 1,
    items: ["helmet"], exclusiveWith: [] },
  { id: "feather_falling", name: "Feather Falling", maxLevel: 4, itemMultiplier: 1, bookMultiplier: 1,
    items: ["boots"], exclusiveWith: [] },
  { id: "depth_strider", name: "Depth Strider", maxLevel: 3, itemMultiplier: 2, bookMultiplier: 1,
    items: ["boots"], exclusiveWith: ["frost_walker"] },
  { id: "frost_walker", name: "Frost Walker", maxLevel: 2, itemMultiplier: 2, bookMultiplier: 1,
    items: ["boots"], exclusiveWith: ["depth_strider"] },
  { id: "soul_speed", name: "Soul Speed", maxLevel: 3, itemMultiplier: 4, bookMultiplier: 2,
    items: ["boots"], exclusiveWith: [] },
  { id: "swift_sneak", name: "Swift Sneak", maxLevel: 3, itemMultiplier: 4, bookMultiplier: 2,
    items: ["leggings"], exclusiveWith: [] },

  // === Universal Enchantments ===
  { id: "unbreaking", name: "Unbreaking", maxLevel: 3, itemMultiplier: 1, bookMultiplier: 1,
    items: ["sword", "axe", "pickaxe", "shovel", "hoe", "bow", "crossbow", "trident",
            "helmet", "chestplate", "leggings", "boots", "fishing_rod", "shears",
            "flint_and_steel", "shield", "elytra", "carrot_on_a_stick", "warped_fungus_on_a_stick", "brush", "mace"],
    exclusiveWith: [] },
  { id: "mending", name: "Mending", maxLevel: 1, itemMultiplier: 2, bookMultiplier: 1,
    items: ["sword", "axe", "pickaxe", "shovel", "hoe", "bow", "crossbow", "trident",
            "helmet", "chestplate", "leggings", "boots", "fishing_rod", "shears",
            "flint_and_steel", "shield", "elytra", "carrot_on_a_stick", "warped_fungus_on_a_stick", "brush", "mace"],
    exclusiveWith: ["infinity"] },
  { id: "curse_of_vanishing", name: "Curse of Vanishing", maxLevel: 1, itemMultiplier: 4, bookMultiplier: 1,
    items: ["sword", "axe", "pickaxe", "shovel", "hoe", "bow", "crossbow", "trident",
            "helmet", "chestplate", "leggings", "boots", "fishing_rod", "shears",
            "flint_and_steel", "shield", "elytra", "carrot_on_a_stick", "warped_fungus_on_a_stick",
            "compass", "carved_pumpkin", "brush", "mace"],
    exclusiveWith: [] },
  { id: "curse_of_binding", name: "Curse of Binding", maxLevel: 1, itemMultiplier: 4, bookMultiplier: 1,
    items: ["helmet", "chestplate", "leggings", "boots", "elytra", "carved_pumpkin"],
    exclusiveWith: [] },

  // === Mace Enchantments ===
  { id: "density", name: "Density", maxLevel: 5, itemMultiplier: 1, bookMultiplier: 1,
    items: ["mace"], exclusiveWith: ["breach", "smite", "bane_of_arthropods", "sharpness"] },
  { id: "breach", name: "Breach", maxLevel: 4, itemMultiplier: 2, bookMultiplier: 1,
    items: ["mace"], exclusiveWith: ["density", "smite", "bane_of_arthropods", "sharpness"] },
  { id: "wind_burst", name: "Wind Burst", maxLevel: 3, itemMultiplier: 4, bookMultiplier: 2,
    items: ["mace"], exclusiveWith: [] },
];

/**
 * Item categories with display names and icons
 */
const ITEM_CATEGORIES = [
  { id: "sword", name: "Sword", icon: "\u2694\uFE0F" },
  { id: "axe", name: "Axe", icon: "\uD83E\uDE93" },
  { id: "pickaxe", name: "Pickaxe", icon: "\u26CF\uFE0F" },
  { id: "shovel", name: "Shovel", icon: "\uD83E\uDEA3" },
  { id: "hoe", name: "Hoe", icon: "\uD83C\uDF3E" },
  { id: "bow", name: "Bow", icon: "\uD83C\uDFF9" },
  { id: "crossbow", name: "Crossbow", icon: "\uD83C\uDFF9" },
  { id: "trident", name: "Trident", icon: "\uD83D\uDD31" },
  { id: "mace", name: "Mace", icon: "\uD83D\uDCA5" },
  { id: "helmet", name: "Helmet", icon: "\uD83E\uDDE2" },
  { id: "chestplate", name: "Chestplate", icon: "\uD83D\uDC55" },
  { id: "leggings", name: "Leggings", icon: "\uD83D\uDC56" },
  { id: "boots", name: "Boots", icon: "\uD83D\uDC62" },
  { id: "fishing_rod", name: "Fishing Rod", icon: "\uD83C\uDFA3" },
  { id: "shears", name: "Shears", icon: "\u2702\uFE0F" },
  { id: "flint_and_steel", name: "Flint & Steel", icon: "\uD83D\uDD25" },
  { id: "shield", name: "Shield", icon: "\uD83D\uDEE1\uFE0F" },
  { id: "elytra", name: "Elytra", icon: "\uD83E\uDE82" },
  { id: "brush", name: "Brush", icon: "\uD83D\uDD8C\uFE0F" },
  { id: "carrot_on_a_stick", name: "Carrot on a Stick", icon: "\uD83E\uDD55" },
  { id: "warped_fungus_on_a_stick", name: "Warped Fungus on a Stick", icon: "\uD83C\uDF44" },
  { id: "carved_pumpkin", name: "Carved Pumpkin", icon: "\uD83C\uDF83" },
  { id: "compass", name: "Compass", icon: "\uD83E\uDDED" },
];

/**
 * Get all enchantments applicable to a given item type
 */
function getEnchantmentsForItem(itemId) {
  return ENCHANTMENT_DB.filter(e => e.items.includes(itemId));
}

/**
 * Check if two enchantments are mutually exclusive
 */
function areExclusive(enchId1, enchId2) {
  const ench1 = ENCHANTMENT_DB.find(e => e.id === enchId1);
  return ench1 && ench1.exclusiveWith.includes(enchId2);
}

/**
 * Find all conflicts in a set of selected enchantment IDs
 * Returns array of [enchId1, enchId2] pairs
 */
function findConflicts(enchantmentIds) {
  const conflicts = [];
  for (let i = 0; i < enchantmentIds.length; i++) {
    for (let j = i + 1; j < enchantmentIds.length; j++) {
      if (areExclusive(enchantmentIds[i], enchantmentIds[j])) {
        conflicts.push([enchantmentIds[i], enchantmentIds[j]]);
      }
    }
  }
  return conflicts;
}
