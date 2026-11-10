/** One address, no spaces, something before and after the @, and a dot in the domain. */
export const isValidEmail = (value: string | null | undefined): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? "").trim());
