// lib/grocery/engine.ts
export interface InventoryItem {
    name: string;
    quantity: number;
    unit: "g" | "kg" | "ml" | "l" | "pcs";
}

export function calculateGroceryDelta(required: InventoryItem[], pantry: InventoryItem[]) {
    return required.map((req) => {
        const pantryMatch = pantry.find(
            (p) => p.name.toLowerCase().trim() === req.name.toLowerCase().trim()
        );

        if (!pantryMatch) {
            return { ...req, toBuy: req.quantity, status: "needed" };
        }

        // Convert standard units deterministically
        const reqNormalized = normalizeUnit(req.quantity, req.unit);
        const pantryNormalized = normalizeUnit(pantryMatch.quantity, pantryMatch.unit);

        if (reqNormalized.unit !== pantryNormalized.unit) {
            return {
                ...req,
                toBuy: req.quantity,
                status: "uncertain_units",
                note: `Pantry has ${pantryMatch.quantity} ${pantryMatch.unit}; verify manually.`,
            };
        }

        const deficit = reqNormalized.amount - pantryNormalized.amount;
        if (deficit <= 0) {
            return { ...req, toBuy: 0, status: "in_stock" };
        }

        return {
            name: req.name,
            toBuy: formatUnit(deficit, reqNormalized.unit),
            unit: req.unit,
            status: "needed",
        };
    }).filter(item => item.toBuy !== 0);
}

function normalizeUnit(amount: number, unit: string): { amount: number; unit: string } {
    const u = unit.toLowerCase();
    if (u === "kg") return { amount: amount * 1000, unit: "g" };
    if (u === "l" || u === "liter" || u === "litre") return { amount: amount * 1000, unit: "ml" };
    return { amount, unit: u };
}

function formatUnit(amount: number, unit: string): number {
    return Math.round(amount * 100) / 100;
}