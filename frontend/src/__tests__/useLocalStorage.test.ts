import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../shared/hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => localStorage.clear());

  it("returns default value when key is empty", () => {
    const { result } = renderHook(() => useLocalStorage("test_key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("persists value across renders", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage("test_key", "default"),
    );
    act(() => result.current[1]("updated"));
    rerender();
    expect(result.current[0]).toBe("updated");
  });

  it("reads existing value from localStorage", () => {
    localStorage.setItem("test_key", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("test_key", "default"));
    expect(result.current[0]).toBe("stored");
  });

  it("supports remove function", () => {
    localStorage.setItem("test_key", JSON.stringify("value"));
    const { result } = renderHook(() =>
      useLocalStorage<string | null>("test_key", null),
    );
    act(() => result.current[1](null));
    expect(localStorage.getItem("test_key")).toBe("null");
  });
});
