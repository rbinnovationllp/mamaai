/** Only exact product-help questions bypass food-advice classification. */
export function isAskMamaProductHelpQuestion(message: string): boolean {
  const text = message.normalize("NFKC").trim().replace(/[?？।.!]+$/u, "").trim().toLowerCase();
  return [
    "how does mamaai work", "how do i sign in", "how is my data protected",
    "mamaai कैसे काम करता है", "मैं sign in कैसे करूं", "मेरा data कैसे सुरक्षित है",
    "mamaai ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ", "ನಾನು sign in ಹೇಗೆ ಮಾಡಲಿ", "ನನ್ನ data ಹೇಗೆ ಸುರಕ್ಷಿತವಾಗಿದೆ",
    "how does pet meal plan work", "what is pet meal plan", "how do i use pet meal plan",
    "how does the pet meal plan work", "how does meal planning work", "how does the meal planner work",
    "how does weekly meal planning work", "pet meal plan कैसे काम करता है", "pet meal plan ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
  ].includes(text);
}
