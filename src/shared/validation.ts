/** Accept any standard email (not limited to @gmail.com). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhilippineMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone.replace(/\s/g, ""));
}
