'use client';

export function ShareButton({ familyName }: { familyName: string }) {
  const shareText = encodeURIComponent(
    `रोज़ 'आज क्या बनाएं?' सोचते हैं? मैंने MAMAAI इस्तेमाल किया — यह पूरे परिवार की पसंद और जरूरत देखकर एक smart family meal plan बनाता है. Try it free for 3 days: https://www.mamaai.in | Community launch support: https://www.sabsewa.in`
  );

  return (
    <a
      href={`https://api.whatsapp.com/send?text=${shareText}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
    >
      <span>Share MAMAAI on WhatsApp</span>
    </a>
  );
}
