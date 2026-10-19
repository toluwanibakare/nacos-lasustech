/**
 * Hides most of an email for display ("abc*******@gm***.com"). Records can hold odd values
 * (no "@", nothing after the dot, spaces), so this never throws: anything it cannot read as an
 * email is masked as a whole.
 */
export const maskEmail = (email: string | null | undefined): string => {
  const value = String(email ?? "").trim();
  if (!value) return "Not set up";
  const at = value.lastIndexOf("@");
  if (at < 1 || at === value.length - 1) {
    return value.length <= 3 ? "***" : `${value.slice(0, 2)}${"*".repeat(Math.min(value.length - 2, 8))}`;
  }
  const name = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (name.length <= 3) return `${name.slice(0, 1)}***@${domain}`;
  const dot = domain.lastIndexOf(".");
  if (dot < 1) return `${name.slice(0, 3)}*******@${domain.slice(0, 2)}***`;
  const domainName = domain.slice(0, dot);
  const tld = domain.slice(dot + 1);
  const maskedDomain = domainName.length > 2 ? `${domainName.slice(0, 2)}***` : "***";
  return `${name.slice(0, 3)}*******@${maskedDomain}${tld ? `.${tld}` : ""}`;
};
