import { describe, it, expect, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NewPasswordFields, passwordProblem } from "@/components/PasswordFields";

afterEach(cleanup);

const Harness = () => {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  return <NewPasswordFields password={pw} confirm={confirm} onPassword={setPw} onConfirm={setConfirm} />;
};

describe("passwordProblem", () => {
  it("needs 8 characters and two identical entries", () => {
    expect(passwordProblem("short", "short")).toMatch(/at least 8/i);
    expect(passwordProblem("longenough1", "longenough2")).toMatch(/do not match/i);
    expect(passwordProblem("longenough1", "")).toMatch(/do not match/i);
    expect(passwordProblem("longenough1", "longenough1")).toBeNull();
  });
});

describe("NewPasswordFields", () => {
  it("hides the password by default and the eye button reveals what you typed, per box", () => {
    render(<Harness />);
    const first = screen.getByLabelText("New Password") as HTMLInputElement;
    const second = screen.getByLabelText("Retype New Password") as HTMLInputElement;
    expect(first.type).toBe("password");
    expect(second.type).toBe("password");

    fireEvent.change(first, { target: { value: "myNewPass1" } });
    fireEvent.click(screen.getByRole("button", { name: "Show new password" }));
    expect(first.type).toBe("text");
    expect(first.value).toBe("myNewPass1");
    expect(second.type).toBe("password"); // the other box is unaffected

    fireEvent.click(screen.getByRole("button", { name: "Hide new password" }));
    expect(first.type).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: "Show retyped password" }));
    expect(second.type).toBe("text");
  });

  it("tells you live whether the two entries match", () => {
    render(<Harness />);
    const first = screen.getByLabelText("New Password");
    const second = screen.getByLabelText("Retype New Password");
    expect(screen.getByText(/Use the eye button to check/i)).toBeTruthy();

    fireEvent.change(first, { target: { value: "myNewPass1" } });
    fireEvent.change(second, { target: { value: "myNewPass" } });
    expect(screen.getByText(/do not match yet/i)).toBeTruthy();

    fireEvent.change(second, { target: { value: "myNewPass1" } });
    expect(screen.getByText("Passwords match")).toBeTruthy();

    // changing the first box afterwards breaks the match again
    fireEvent.change(first, { target: { value: "myNewPass2" } });
    expect(screen.getByText(/do not match yet/i)).toBeTruthy();
  });
});
