// components/Footer.tsx

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
            <li><a href="/help" className="inline-flex min-h-11 items-center hover:underline">Help & Support Center</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Legal</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="/terms" className="inline-flex min-h-11 items-center hover:underline">Terms & Conditions</a></li>
            <li><a href="/privacy" className="inline-flex min-h-11 items-center hover:underline">Privacy Policy</a></li>
            <li><a href="/disclaimer" className="inline-flex min-h-11 items-center hover:underline">Food and Health Disclaimer</a></li>
            <li><a href="/refund-policy" className="inline-flex min-h-11 items-center hover:underline">Refund and Cancellation</a></li>
            <li><a href="/account/export" className="inline-flex min-h-11 items-center hover:underline">Data Export Request</a></li>
            <li><a href="/account/delete" className="inline-flex min-h-11 items-center hover:underline">Account Deletion Request</a></li>
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

