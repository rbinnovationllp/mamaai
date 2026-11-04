import { isAskMamaProductHelpQuestion } from "./ask-mama-product-help";
/** Reject requests that attempt to alter safety policy or solicit unsupported pet-feeding advice. */
export function classifyAskMamaSafetyRequest(message: string): "prompt_injection" | "pet_feeding" | undefined {
  const text = message.normalize("NFKD").toLocaleLowerCase();
  if (/(ignore|bypass|override).{0,40}(instruction|restriction|allerg|safety)|reveal.{0,30}(system prompt|secret|instruction)/.test(text)) return "prompt_injection";
  if (isAskMamaProductHelpQuestion(message)) return undefined;
  if (/\b(dog|cat|puppy|kitten|pet)\b.{0,50}\b(feed|meal|diet|food|eat)\b|\b(feed|meal|diet|food)\b.{0,50}\b(dog|cat|puppy|kitten|pet)\b/.test(text)) return "pet_feeding";
  return undefined;
}
