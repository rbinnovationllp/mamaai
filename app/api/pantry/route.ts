import { NextResponse } from 'next/server';
import { evaluatePantryStatus } from '@/lib/pantry';

export async function GET(request: Request) {
  // Fetch pantry items from database and evaluate status
  const rawPantryItems: any[] = []; // Load from your DB connection
  const evaluated = evaluatePantryStatus(rawPantryItems);

  return NextResponse.json({
    available: evaluated.filter((i) => i.status === 'AVAILABLE'),
    runningLow: evaluated.filter((i) => i.status === 'RUNNING_LOW'),
    useSoon: evaluated.filter((i) => i.status === 'USE_SOON'),
    outOfStock: evaluated.filter((i) => i.status === 'OUT_OF_STOCK'),
  });
}