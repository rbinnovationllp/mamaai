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
    tabs: { available: 'Available', low: 'Running Low', expiry: 'Use Soon (Expiry)', out: 'Out of Stock' },
  },
  hi: {
    title: 'मेरी Pantry Intelligence',
    subtitle: 'Stock, expiry dates और meal subtraction track करें.',
    add: '+ Ingredient जोड़ें',
    empty: 'इस filter में अभी कोई ingredient नहीं है.',
    quantity: 'Quantity',
    expires: 'Expires',
    modalTitle: 'Pantry Ingredient जोड़ें',
    ingredientName: 'Ingredient Name',
    unit: 'Unit (kg, g, L)',
    cancel: 'Cancel',
    save: 'Ingredient Save करें',
    tabs: { available: 'Available', low: 'Running Low', expiry: 'Use Soon (Expiry)', out: 'Out of Stock' },
  },
  kn: {
    title: 'ನನ್ನ Pantry Intelligence',
    subtitle: 'Stock, expiry dates ಮತ್ತು meal subtraction track ಮಾಡಿ.',
    add: '+ Ingredient ಸೇರಿಸಿ',
    empty: 'ಈ filter ಗೆ ಈಗ ಯಾವುದೇ ingredient ಇಲ್ಲ.',
    quantity: 'Quantity',
    expires: 'Expires',
    modalTitle: 'Pantry Ingredient ಸೇರಿಸಿ',
    ingredientName: 'Ingredient Name',
    unit: 'Unit (kg, g, L)',
    cancel: 'Cancel',
    save: 'Ingredient Save ಮಾಡಿ',
    tabs: { available: 'Available', low: 'Running Low', expiry: 'Use Soon (Expiry)', out: 'Out of Stock' },
  },
};

const PANTRY_STORAGE_KEY = 'mamaai_pantry_items_v1';

interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  expiryDate?: string;
}

export default function PantryPage() {
  const { language } = useLanguage();
  const t = pantryCopy[language];
  const [items, setItems] = useState<PantryItem[]>([
    { id: '1', name: 'Basmati Rice', category: 'Grains', quantity: 2, unit: 'kg', minStock: 1, expiryDate: '2026-12-01' },
    { id: '2', name: 'Toor Dal', category: 'Pulses', quantity: 0.2, unit: 'kg', minStock: 0.5, expiryDate: '2026-08-20' },
  ]);

  const [filter, setFilter] = useState<'available' | 'low' | 'expiry' | 'out'>('available');
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Vegetables', quantity: 1, unit: 'kg', minStock: 1, expiryDate: '' });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PANTRY_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setItems(parsed.filter((item) => item?.name));
      }
    } catch {
      // Keep starter pantry items if local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Pantry persistence is helpful, but the page should still work without it.
    }
  }, [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const item: PantryItem = {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      minStock: Number(newItem.minStock),
      expiryDate: newItem.expiryDate || undefined,
    };

    setItems((prev) => [...prev, item]);
    setShowModal(false);
    setNewItem({ name: '', category: 'Vegetables', quantity: 1, unit: 'kg', minStock: 1, expiryDate: '' });
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'out') return item.quantity <= 0;
    if (filter === 'low') return item.quantity > 0 && item.quantity <= item.minStock;
    if (filter === 'expiry') {
      if (!item.expiryDate) return false;
      const days = (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      return days <= 14 && days >= 0;
    }
    return item.quantity > 0;
  });

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 font-sans">
      <AppPageNav />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-600">{t.subtitle}</p>
        </div>
        <LanguageSelector />
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition"
        >
          {t.add}
        </button>
      </div>

      {/* Filter Tabs */}
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

      {/* Item List Display */}
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

      {/* Interactive Modal */}
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
                  placeholder="Quantity"
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
                placeholder="Expiry Date"
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
