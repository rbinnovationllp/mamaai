// components/PetSafetyLock.tsx
import Link from 'next/link';

export default function PetSafetyLock() {
  return (
    <div className="p-6 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50/50 text-center max-w-md mx-auto my-6">
      <div className="text-3xl mb-2">🔒 🐾</div>
      <h3 className="font-bold text-lg text-gray-800">Someone with paws is missing from your family food plan.</h3>
      <p className="text-sm text-gray-600 mt-2 mb-4">
        Add your dog or cat and let MamaAI help you organise their meals, feeding routine and food budget too.
      </p>
      <Link
        href="/subscription"
        className="inline-block bg-emerald-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition"
      >
        Upgrade to Premium Family+
      </Link>
    </div>
  );
}