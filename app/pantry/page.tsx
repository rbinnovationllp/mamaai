'use client';

import React, { useEffect, useState } from 'react';
import { AppPageNav } from '@/components/AppPageNav';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { VoiceTextInput } from '@/components/VoiceTextInput';

const pantryCopy = {
  en: {
    title: 'My Pantry Intelligence',
    subtitle: 'Track stock, expiry dates, and automatic meal subtractions.',
    add: '+ Add Ingredient',
    empty: 'No ingredients match this category filter right now.',
    quantity: 'Quantity',
    expires: 'Expires',
    modalTitle: 'Add Pantry Ingredient',
    ingredientName: 'Ingredient Name',
    unit: 'Unit (kg, g, L)',
    cancel: 'Cancel',
    save: 'Save Ingredient',
    syncing: 'Syncing pantry...',
    savedCloud: 'Pantry saved to your MAMAAI account.',
    localFallback: 'Pantry is saved on this device until account sync is available.',
    migrated: 'Existing pantry items were safely synced to your account.',
    tabs: { available: 'Available', low: 'Running Low', expiry: 'Use Soon (Expiry)', out: 'Out of Stock' },
  },
  hi: {
    title: 'मेरी पैंट्री इंटेलिजेंस',
    subtitle: 'स्टॉक, एक्सपायरी तारीख और भोजन में इस्तेमाल होने वाली सामग्री को ट्रैक करें।',
    add: '+ सामग्री जोड़ें',
    empty: 'इस फिल्टर में अभी कोई सामग्री नहीं है।',
    quantity: 'मात्रा',
    expires: 'एक्सपायरी',
    modalTitle: 'पैंट्री सामग्री जोड़ें',
    ingredientName: 'सामग्री का नाम',
    unit: 'यूनिट (kg, g, L)',
    cancel: 'रद्द करें',
    save: 'सामग्री सेव करें',
    syncing: 'पैंट्री सिंक हो रही है...',
    savedCloud: 'पैंट्री आपके MAMAAI खाते में सेव हो गई।',
    localFallback: 'खाता सिंक उपलब्ध होने तक पैंट्री इस डिवाइस पर सेव है।',
    migrated: 'आपकी पुरानी पैंट्री सामग्री सुरक्षित रूप से खाते में सिंक हो गई।',
    tabs: { available: 'उपलब्ध', low: 'कम स्टॉक', expiry: 'जल्द इस्तेमाल करें', out: 'स्टॉक खत्म' },
  },
  kn: {
    title: 'ನನ್ನ ಪ್ಯಾಂಟ್ರಿ ಇಂಟೆಲಿಜೆನ್ಸ್',
    subtitle: 'ಸ್ಟಾಕ್, ಅವಧಿ ದಿನಾಂಕ ಮತ್ತು ಊಟದಲ್ಲಿ ಬಳಸುವ ಪದಾರ್ಥಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
    add: '+ ಪದಾರ್ಥ ಸೇರಿಸಿ',
    empty: 'ಈ ಫಿಲ್ಟರ್‌ಗೆ ಈಗ ಯಾವುದೇ ಪದಾರ್ಥ ಇಲ್ಲ.',
    quantity: 'ಪ್ರಮಾಣ',
    expires: 'ಅವಧಿ ಮುಗಿಯುವ ದಿನ',
    modalTitle: 'ಪ್ಯಾಂಟ್ರಿ ಪದಾರ್ಥ ಸೇರಿಸಿ',
    ingredientName: 'ಪದಾರ್ಥದ ಹೆಸರು',
    unit: 'ಯುನಿಟ್ (kg, g, L)',
    cancel: 'ರದ್ದುಮಾಡಿ',
    save: 'ಪದಾರ್ಥ ಉಳಿಸಿ',
    syncing: 'ಪ್ಯಾಂಟ್ರಿ ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...',
    savedCloud: 'ಪ್ಯಾಂಟ್ರಿ ನಿಮ್ಮ MAMAAI ಖಾತೆಯಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.',
    localFallback: 'ಖಾತೆ ಸಿಂಕ್ ಲಭ್ಯವಾಗುವವರೆಗೆ ಪ್ಯಾಂಟ್ರಿ ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಯುತ್ತದೆ.',
    migrated: 'ನಿಮ್ಮ ಹಿಂದಿನ ಪ್ಯಾಂಟ್ರಿ ಪದಾರ್ಥಗಳು ಸುರಕ್ಷಿತವಾಗಿ ಖಾತೆಗೆ ಸಿಂಕ್ ಆಗಿವೆ.',
    tabs: { available: 'ಲಭ್ಯ', low: 'ಕಡಿಮೆ ಸ್ಟಾಕ್', expiry: 'ಬೇಗ ಬಳಸಿ', out: 'ಸ್ಟಾಕ್ ಮುಗಿದಿದೆ' },
  },
};

const PANTRY_STORAGE_KEY = 'mamaai_pantry_items_v1';

interface PantryItem {
  id: string;
  name: string;
  ingredientName?: string;
  normalizedIngredientKey?: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  minimumQuantity?: number;
  purchaseDate?: string;
  expiryDate?: string;
  status?: 'AVAILABLE' | 'RUNNING_LOW' | 'USE_SOON' | 'OUT_OF_STOCK';
}

const starterItems: PantryItem[] = [
  { id: 'starter-rice', name: 'Basmati Rice', category: 'Grains', quantity: 2, unit: 'kg', minStock: 1, expiryDate: '2026-12-01' },
  { id: 'starter-dal', name: 'Toor Dal', category: 'Pulses', quantity: 0.2, unit: 'kg', minStock: 0.5, expiryDate: '2026-08-20' },
];

function normalizeClientItem(item: any): PantryItem {
  return {
    id: String(item.id || `pantry-${Date.now()}`),
    name: String(item.name || item.ingredientName || ''),
    ingredientName: item.ingredientName || item.name,
    normalizedIngredientKey: item.normalizedIngredientKey,
    category: String(item.category || 'Pantry'),
    quantity: Number(item.quantity || 0),
    unit: String(item.unit || 'unit'),
    minStock: Number(item.minStock ?? item.minimumQuantity ?? 0),
    minimumQuantity: Number(item.minimumQuantity ?? item.minStock ?? 0),
    purchaseDate: item.purchaseDate || undefined,
    expiryDate: item.expiryDate || undefined,
    status: item.status,
  };
}

function readLocalPantry(): PantryItem[] {
  try {
    const saved = window.localStorage.getItem(PANTRY_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((item) => item?.name || item?.ingredientName).map(normalizeClientItem) : [];
  } catch {
    return [];
  }
}

function writeLocalPantry(items: PantryItem[]) {
  try {
    window.localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // The pantry page remains usable even if browser storage is blocked.
  }
}

export default function PantryPage() {
  const { language } = useLanguage();
  const t = pantryCopy[language];
  const [items, setItems] = useState<PantryItem[]>(starterItems);
  const [filter, setFilter] = useState<'available' | 'low' | 'expiry' | 'out'>('available');
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Vegetables', quantity: 1, unit: 'kg', minStock: 1, expiryDate: '' });
  const [syncStatus, setSyncStatus] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPantry() {
      const localItems = readLocalPantry();
      if (localItems.length && !cancelled) setItems(localItems);
      setSyncStatus(t.syncing);

      try {
        const response = await fetch('/api/pantry', { cache: 'no-store' });
        if (!response.ok) throw new Error('Pantry account sync unavailable');
        const data = await response.json();
        const serverItems = Array.isArray(data.items) ? data.items.map(normalizeClientItem) : [];

        if (serverItems.length) {
          if (!cancelled) {
            setItems(serverItems);
            writeLocalPantry(serverItems);
            setSyncStatus(t.savedCloud);
          }
        } else if (localItems.length) {
          const migration = await fetch('/api/pantry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: localItems }),
          });
          if (!migration.ok) throw new Error('Pantry migration unavailable');
          const migrated = await migration.json();
          const migratedItems = Array.isArray(migrated.items) ? migrated.items.map(normalizeClientItem) : localItems;
          if (!cancelled) {
            setItems(migratedItems);
            writeLocalPantry(migratedItems);
            setSyncStatus(t.migrated);
          }
        } else if (!cancelled) {
          setItems(starterItems);
          setSyncStatus(t.savedCloud);
        }
      } catch {
        if (!cancelled) {
          setItems(localItems.length ? localItems : starterItems);
          setSyncStatus(t.localFallback);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    loadPantry();
    return () => {
      cancelled = true;
    };
  }, [t.localFallback, t.migrated, t.savedCloud, t.syncing]);

  useEffect(() => {
    if (loaded) writeLocalPantry(items);
  }, [items, loaded]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const optimisticItem: PantryItem = {
      id: Date.now().toString(),
      name: newItem.name,
      ingredientName: newItem.name,
      category: newItem.category,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      minStock: Number(newItem.minStock),
      minimumQuantity: Number(newItem.minStock),
      expiryDate: newItem.expiryDate || undefined,
    };

    setItems((prev) => [...prev, optimisticItem]);
    setShowModal(false);
    setNewItem({ name: '', category: 'Vegetables', quantity: 1, unit: 'kg', minStock: 1, expiryDate: '' });

    try {
      const response = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: optimisticItem }),
      });
      if (!response.ok) throw new Error('Pantry account sync unavailable');
      const data = await response.json();
      const savedItem = Array.isArray(data.items) && data.items[0] ? normalizeClientItem(data.items[0]) : optimisticItem;
      setItems((prev) => prev.map((item) => (item.id === optimisticItem.id ? savedItem : item)));
      setSyncStatus(t.savedCloud);
    } catch {
      setSyncStatus(t.localFallback);
    }
  };

  const filteredItems = items.filter((item) => {
    const minStock = Number(item.minStock ?? item.minimumQuantity ?? 0);
    if (filter === 'out') return item.quantity <= 0 || item.status === 'OUT_OF_STOCK';
    if (filter === 'low') return item.status === 'RUNNING_LOW' || (item.quantity > 0 && item.quantity <= minStock);
    if (filter === 'expiry') {
      if (item.status === 'USE_SOON') return true;
      if (!item.expiryDate) return false;
      const days = (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      return days <= 14 && days >= 0;
    }
    return item.quantity > 0 && item.status !== 'OUT_OF_STOCK';
  });

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 font-sans">
      <AppPageNav />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-600">{t.subtitle}</p>
          {syncStatus ? <p className="mt-2 text-xs font-semibold text-emerald-700">{syncStatus}</p> : null}
        </div>
        <LanguageSelector />
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition"
        >
          {t.add}
        </button>
      </div>

      <div className="flex space-x-2 border-b mb-6 overflow-x-auto pb-2">
        {[
          { id: 'available', label: t.tabs.available },
          { id: 'low', label: t.tabs.low },
          { id: 'expiry', label: t.tabs.expiry },
          { id: 'out', label: t.tabs.out },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
              filter === tab.id
                ? 'border-b-2 border-emerald-600 text-emerald-600 bg-emerald-50/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500 text-sm shadow-sm">
          {t.empty}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow transition">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{item.category}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {t.quantity}: <span className="font-bold text-gray-800">{item.quantity} {item.unit}</span>
              </p>
              {item.expiryDate && (
                <p className="text-xs text-amber-600 mt-1">{t.expires}: {item.expiryDate}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">{t.modalTitle}</h2>
            <form onSubmit={handleAddItem} className="space-y-3">
              <VoiceTextInput
                type="text"
                placeholder={t.ingredientName}
                required
                value={newItem.name}
                onValueChange={(value) => setNewItem({ ...newItem, name: value })}
                inputClassName="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder={t.quantity}
                  required
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <VoiceTextInput
                  type="text"
                  placeholder={t.unit}
                  required
                  value={newItem.unit}
                  onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                  inputClassName="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <input
                type="date"
                value={newItem.expiryDate}
                onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  {t.cancel}
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
