import { describe, it, expect } from "vitest";
import { maskEmail } from "@/lib/mask-email";

describe("maskEmail", () => {
  it("masks a normal email", () => {
    expect(maskEmail("moses.bakare@gmail.com")).toBe("mos*******@gm***.com");
    expect(maskEmail("ab@gmail.com")).toBe("a***@gmail.com");
  });
  it("says so when there is none", () => {
    expect(maskEmail("")).toBe("Not set up");
    expect(maskEmail(null)).toBe("Not set up");
    expect(maskEmail(undefined)).toBe("Not set up");
    expect(maskEmail("   ")).toBe("Not set up");
  });
  it("never throws on odd stored values (this crashed the dashboard)", () => {
    for (const odd of ["noatsign", "08012345678", "name@", "@domain.com", "name@domain", "name@domain.", "a@b", "x y@z", "name@@x.com", "abc"]) {
      expect(() => maskEmail(odd)).not.toThrow();
      expect(typeof maskEmail(odd)).toBe("string");
    }
  });
  it("does not leak a value that is not an email", () => {
    expect(maskEmail("08012345678")).not.toContain("08012345678");
    expect(maskEmail("noatsign")).toBe("no******");
  });
});
