// components/Footer.tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 py-10 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h3 className="font-bold text-white text-base mb-2">MAMAAI</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            One Family. Different Needs. One Intelligent Meal Plan.
          </p>
          <p className="mt-4 text-xs font-semibold text-emerald-400">
            A product of Rashi Bhartiya Innovation LLP
          </p>
          <p className="text-xs text-slate-400">Gurugram, Haryana, India</p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Support & Help</h4>
          <ul className="space-y-2 text-xs">
            <li>
              Email: {' '}
              <a href="mailto:admin@mamaai.in" className="text-emerald-400 hover:underline">
                admin@mamaai.in
              </a>
            </li>
            <li>
              Phone: {' '}
              <a href="tel:+918450092846" className="text-emerald-400 hover:underline">
                +91 84500 92846
              </a>
            </li>
            <li><Link href="/help" className="hover:underline">Help & Support Center</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Legal</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/terms" className="hover:underline">Terms & Conditions</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="/disclaimer" className="hover:underline">Health & Food Disclaimer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Important Notice</h4>
          <p className="text-[11px] text-slate-400 leading-normal">
            MAMAAI provides AI-assisted meal planning for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </footer>
  );
}