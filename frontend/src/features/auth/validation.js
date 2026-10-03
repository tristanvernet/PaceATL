/**
 * @param {{ name?: string, email: string, password: string, confirmPassword?: string }} values
 * @param {'login' | 'signup'} mode
 * @returns {Record<string, string>}
 */
export function validateAuth(values, mode) {
  const errors = {};
  if (
    mode === "signup" &&
    (!values.name?.trim() || values.name.trim().length > 100)
  )
    errors.name = "Enter your name (up to 100 characters).";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ||
    values.email.trim().length > 254
  )
    errors.email = "Enter a valid email address.";
  if (
    mode === "signup" &&
    (values.password.length < 12 || values.password.length > 128)
  )
    errors.password = "Use between 12 and 128 characters.";
  if (mode === "login" && !values.password)
    errors.password = "Enter your password.";
  if (mode === "signup" && values.confirmPassword !== values.password)
    errors.confirmPassword = "Passwords must match.";
  return errors;
}
