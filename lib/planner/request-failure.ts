export function plannerFailureMessage(language: "en" | "hi" | "kn", error: unknown): string {
  const failure = error && typeof error === "object" ? error as { code?: string; status?: number; name?: string } : {};
  if (failure.code === "FAMILY_PROFILE_REQUIRED") {
    return {
      en: "Complete your family profile before planning meals.",
      hi: "भोजन योजना बनाने से पहले अपनी पारिवारिक प्रोफ़ाइल पूरी करें।",
      kn: "ಊಟದ ಯೋಜನೆ ಮಾಡುವ ಮೊದಲು ನಿಮ್ಮ ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.",
    }[language];
  }
  const reason = failure.code === "ENTITLEMENT_PENDING" ? "billing" : failure.name === "AbortError" ? "timeout" : failure.status === 401 ? "login" : failure.code === "PAYMENT_REQUIRED" ? "subscription" : failure.status === 403 ? "permission" : failure.status === 429 ? "limit" : "unavailable";
  const text = {
    en: { billing: "Your subscription could not be confirmed. If you already paid, retry without starting another checkout.", timeout: "The planner took too long to respond. Please retry shortly.", login: "Please sign in again, then retry your meal plan.", subscription: "An active subscription or eligible trial is required. Check your subscription before retrying.", permission: "Your account cannot access this family plan. Check the signed-in account.", limit: "Too many requests. Please wait before trying again.", unavailable: "The meal plan could not be prepared. Please retry or contact support with the reference below." },
    hi: { billing: "सदस्यता की पुष्टि नहीं हो सकी। यदि भुगतान किया है, तो दोबारा भुगतान किए बिना फिर कोशिश करें।", timeout: "Planner का उत्तर आने में अधिक समय लगा। कुछ देर बाद फिर कोशिश करें।", login: "कृपया फिर sign in करके meal plan दोबारा बनाएं।", subscription: "Active subscription या eligible trial जरूरी है। अपना subscription देखें।", permission: "इस खाते को family plan का access नहीं है। Signed-in account देखें।", limit: "बहुत अधिक requests हैं। कुछ देर बाद कोशिश करें।", unavailable: "Meal plan तैयार नहीं हो सका। फिर कोशिश करें या नीचे के reference के साथ support से संपर्क करें।" },
    kn: { billing: "ಚಂದಾದಾರಿಕೆ ದೃಢಪಡಿಸಲಾಗಲಿಲ್ಲ. ಈಗಾಗಲೇ ಪಾವತಿಸಿದ್ದರೆ, ಮತ್ತೆ ಪಾವತಿಸದೆ ಮರುಪ್ರಯತ್ನಿಸಿ.", timeout: "Planner ಪ್ರತಿಕ್ರಿಯಿಸಲು ಹೆಚ್ಚು ಸಮಯ ತೆಗೆದುಕೊಂಡಿದೆ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.", login: "ಮತ್ತೆ sign in ಮಾಡಿ meal plan ಪ್ರಯತ್ನಿಸಿ.", subscription: "Active subscription ಅಥವಾ eligible trial ಅಗತ್ಯ. Subscription ಪರಿಶೀಲಿಸಿ.", permission: "ಈ ಖಾತೆಗೆ family plan access ಇಲ್ಲ. Signed-in account ಪರಿಶೀಲಿಸಿ.", limit: "ಹೆಚ್ಚು requests ಆಗಿವೆ. ಸ್ವಲ್ಪ ಸಮಯ ಕಾಯಿರಿ.", unavailable: "Meal plan ತಯಾರಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಕೆಳಗಿನ reference ಜೊತೆಗೆ support ಸಂಪರ್ಕಿಸಿ." },
  }[language][reason];
  const codes = ["AUTHENTICATION_REQUIRED", "SESSION_REVOKED", "SESSION_UNAVAILABLE", "PAYMENT_REQUIRED", "FORBIDDEN", "VALIDATION_ERROR", "WEEKLY_PLAN_FAILED", "MEAL_PLAN_FAILED", "RATE_LIMITED"];
  const reference = [failure.status && Number.isInteger(failure.status) ? `HTTP ${failure.status}` : "", failure.code && codes.includes(failure.code) ? failure.code : ""].filter(Boolean).join(" · ");
  return reference ? `${text} (${reference})` : text;
}
