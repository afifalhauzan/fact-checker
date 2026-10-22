import { describe, expect, it } from "vitest";
import { emailPasswordLoginSchema, registerSchema } from "../lib/auth-schemas";

describe("authentication form schemas", () => {
  it("accepts a valid login payload", () => {
    expect(emailPasswordLoginSchema.safeParse({ email: "demo@example.com", password: "secret1" }).success).toBe(true);
  });

  it("rejects a malformed login email", () => {
    const result = emailPasswordLoginSchema.safeParse({ email: "not-an-email", password: "secret1" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Email tidak valid");
  });

  it("rejects a missing login email", () => {
    expect(emailPasswordLoginSchema.safeParse({ password: "secret1" }).success).toBe(false);
  });

  it("requires at least six password characters for login", () => {
    const result = emailPasswordLoginSchema.safeParse({ email: "demo@example.com", password: "12345" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Password minimal 6 karakter");
  });

  it("trims a valid registration name", () => {
    const result = registerSchema.safeParse({
      name: "  Siti Rahmawati  ", email: "siti@example.com", password: "secret12", passwordConfirmation: "secret12",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Siti Rahmawati");
  });

  it("rejects names shorter than two characters after trimming", () => {
    expect(registerSchema.safeParse({
      name: " A ", email: "siti@example.com", password: "secret12", passwordConfirmation: "secret12",
    }).success).toBe(false);
  });

  it("requires a valid email and an eight-character registration password", () => {
    expect(registerSchema.safeParse({
      name: "Siti", email: "invalid", password: "secret12", passwordConfirmation: "secret12",
    }).success).toBe(false);
    expect(registerSchema.safeParse({
      name: "Siti", email: "siti@example.com", password: "short", passwordConfirmation: "short",
    }).success).toBe(false);
  });

  it("requires matching registration passwords", () => {
    const result = registerSchema.safeParse({
      name: "Siti", email: "siti@example.com", password: "secret12", passwordConfirmation: "different12",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Password tidak sama");
  });
});
