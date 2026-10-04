// Products a store can order.
// SKUs come from server/src/seed.json. Two are not in the seed (cheese, bananas): see the note below.
// cold: true means the line needs a refrigerated truck (chilled or frozen).
export const GROUPS = [
  {
    id: "chilled",
    label: "Chilled",
    cold: true,
    items: [
      { sku: "SKU-7001", name: "Fresh milk 1 L", pack: "crate of 12", unit: "crate", kg: 13 },
      { sku: "SKU-7010", name: "Set yoghurt 80 g", pack: "tray of 24", unit: "tray", kg: 2.5 },
      { sku: "SKU-7020", name: "Cheese slices 200 g", pack: "case of 20", unit: "case", kg: 4.5 },
    ],
  },
  {
    id: "produce",
    label: "Produce",
    cold: false,
    items: [
      { sku: "SKU-8001", name: "Carrots 1 kg", pack: "box of 10", unit: "box", kg: 10.5 },
      { sku: "SKU-8010", name: "Bananas, ambul", pack: "box, 12 kg", unit: "box", kg: 12.5 },
    ],
  },
  {
    id: "frozen",
    label: "Frozen",
    cold: true,
    items: [{ sku: "SKU-7101", name: "Chicken 1 kg", pack: "carton of 10", unit: "carton", kg: 10.5 }],
  },
  {
    id: "pantry",
    label: "Pantry",
    cold: false,
    items: [
      { sku: "SKU-1150", name: "Rice, samba 5 kg", pack: "bag", unit: "bag", kg: 5.1 },
      { sku: "SKU-1101", name: "Rice, 5 kg", pack: "bag", unit: "bag", kg: 5.1 },
      { sku: "SKU-2207", name: "Coconut oil 1 L", pack: "case of 12", unit: "case", kg: 11.5 },
      { sku: "SKU-4410", name: "Cream crackers", pack: "pack", unit: "pack", kg: 0.5 },
      { sku: "SKU-3305", name: "Detergent powder 1 kg", pack: "carton", unit: "carton", kg: 10.5 },
      { sku: "SKU-5120", name: "Ceylon tea 400 g", pack: "pack", unit: "pack", kg: 0.4 },
    ],
  },
];

// Flat list with the group's cold flag on every item
export const ALL_ITEMS = GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, cold: g.cold })));
