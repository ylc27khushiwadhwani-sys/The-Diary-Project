import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingPage } from "./LandingPage";

describe("landing doors", () => {
  it("signed-out visitors get the signup and signin popups", () => {
    const onAuth = vi.fn();
    render(<LandingPage onAuth={onAuth} onGuest={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /sign up to get a library card/i }));
    expect(onAuth).toHaveBeenCalledWith("signup");
    fireEvent.click(screen.getByRole("button", { name: /i already have a library card/i }));
    expect(onAuth).toHaveBeenCalledWith("signin");
  });

  it("a card holder gets one clear way inside, never a signup popup", () => {
    const onEnter = vi.fn();
    const onAuth = vi.fn();
    render(<LandingPage onAuth={onAuth} onGuest={vi.fn()} isSignedIn onEnter={onEnter} />);
    expect(screen.queryByRole("button", { name: /sign up/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /step inside your library/i }));
    expect(onEnter).toHaveBeenCalled();
    expect(onAuth).not.toHaveBeenCalled();
  });
});
