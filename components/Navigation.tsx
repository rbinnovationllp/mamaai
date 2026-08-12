'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'My Family', href: '/family' },
    { label: 'Meal Planner', href: '/planner' },
    { label: 'My Pantry', href: '/pantry' },
    { label: 'Grocery List', href: '/grocery' },
    { label: 'Recipes', href: '/recipes' },
    { label: 'Ask MAMA', href: '/ask-mama' },
    { label: 'Meal History', href: '/history' },
    { label: 'Preferences', href: '/preferences' },
    { label: 'Subscription', href: '/subscription' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="font-extrabold text-2xl text-emerald-600 tracking-tight">
              MAMAAI
            </Link>
            <span className="hidden sm:inline-block text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
              XPrize Edition
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}