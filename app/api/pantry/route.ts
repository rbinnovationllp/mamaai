import { NextResponse } from "next/server";
import { z } from "zod";
import { PantryRepository } from "@/lib/repositories/pantry-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";

const pantryItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).optional(),
  ingredientName: z.string().trim().min(1).optional(),
  category: z.string().trim().optional(),
  quantity: z.coerce.number().min(0),
  unit: z.string().trim().min(1),
  minStock: z.coerce.number().min(0).optional(),
  minimumQuantity: z.coerce.number().min(0).optional(),
  purchaseDate: z.string().trim().optional().or(z.literal("")),
  expiryDate: z.string().trim().optional().or(z.literal("")),
});

const pantrySaveSchema = z.object({
  item: pantryItemSchema.optional(),
  items: z.array(pantryItemSchema).max(100).optional(),
});

function toClientItem(record: Awaited<ReturnType<PantryRepository["listForUser"]>>[number]) {
  return {
    id: record.id,
    name: record.ingredientName,
    ingredientName: record.ingredientName,
    normalizedIngredientKey: record.normalizedIngredientKey,
    category: record.category,
    quantity: record.quantity,
    unit: record.unit,
    minStock: record.minimumQuantity,
    minimumQuantity: record.minimumQuantity,
    purchaseDate: record.purchaseDate,
    expiryDate: record.expiryDate,
    status: record.status,
    updatedAt: record.updatedAt,
  };
}

function toRepositoryInput(item: z.infer<typeof pantryItemSchema>) {
  return {
    id: item.id,
    ingredientName: item.ingredientName || item.name || "",
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    minimumQuantity: item.minimumQuantity ?? item.minStock ?? 0,
    purchaseDate: item.purchaseDate || undefined,
    expiryDate: item.expiryDate || undefined,
  };
}

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    const repository = new PantryRepository();
    const items = await repository.listForUser(user.userId);

    return NextResponse.json({
      userId: user.userId,
      items: items.map(toClientItem),
      available: items.filter((i) => i.status === "AVAILABLE").map(toClientItem),
      runningLow: items.filter((i) => i.status === "RUNNING_LOW").map(toClientItem),
      useSoon: items.filter((i) => i.status === "USE_SOON").map(toClientItem),
      outOfStock: items.filter((i) => i.status === "OUT_OF_STOCK").map(toClientItem),
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: { code: "PANTRY_LOAD_FAILED", message: error instanceof Error ? error.message : "Unable to load pantry." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const body = await request.json();
    const parsed = pantrySaveSchema.safeParse(body);
    if (!parsed.success || (!parsed.data.item && !parsed.data.items?.length)) {
      return NextResponse.json(
        { error: { code: "PANTRY_SAVE_INVALID", message: "Please provide a pantry item to save.", details: parsed.success ? undefined : parsed.error.issues } },
        { status: 400 }
      );
    }

    const repository = new PantryRepository();
    const saved = parsed.data.items?.length
      ? await repository.saveMany(user.userId, parsed.data.items.map(toRepositoryInput))
      : [await repository.saveItem(user.userId, toRepositoryInput(parsed.data.item!))];

    return NextResponse.json({
      userId: user.userId,
      saved: true,
      items: saved.map(toClientItem),
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: { code: "PANTRY_SAVE_FAILED", message: error instanceof Error ? error.message : "Unable to save pantry item." } },
      { status: 500 }
    );
  }
}
