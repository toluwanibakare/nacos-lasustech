import { describe, it, expect } from "vitest";
import { studentPhotoUrl } from "@/lib/photo-url";

describe("studentPhotoUrl", () => {
  it("keeps older records that already include the folder", () => {
    expect(studentPhotoUrl("uploads/students/230303010053_1774283047.jpg")).toBe("https://nacosid.tmb.it.com/uploads/students/230303010053_1774283047.jpg");
  });
  it("adds the uploads folder to a bare file name (photos saved by the ID card flow)", () => {
    expect(studentPhotoUrl("230303010001_1792420050.jpg")).toBe("https://nacosid.tmb.it.com/uploads/230303010001_1792420050.jpg");
  });
  it("copes with a leading slash", () => {
    expect(studentPhotoUrl("/uploads/x.png")).toBe("https://nacosid.tmb.it.com/uploads/x.png");
    expect(studentPhotoUrl("/x.png")).toBe("https://nacosid.tmb.it.com/uploads/x.png");
  });
  it("leaves complete addresses alone", () => {
    expect(studentPhotoUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(studentPhotoUrl("blob:abc")).toBe("blob:abc");
  });
  it("returns null for nothing", () => {
    expect(studentPhotoUrl("")).toBeNull();
    expect(studentPhotoUrl(null)).toBeNull();
    expect(studentPhotoUrl(undefined)).toBeNull();
    expect(studentPhotoUrl("   ")).toBeNull();
  });
});
