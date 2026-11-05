export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 12;
export const PASSWORD_HELP_TEXT = "Password must be 8–12 characters.";

export function isPasswordLengthValid(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}
