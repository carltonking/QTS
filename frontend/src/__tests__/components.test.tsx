import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Badge } from "../shared/components/Badge";
import { Button } from "../shared/components/Button";
import { Card } from "../shared/components/Card";

describe("Badge", () => {
  it("renders label in brackets", () => {
    render(<Badge label="test" />);
    expect(screen.getByText("[ TEST ]")).toBeTruthy();
  });

  it("renders small variant", () => {
    render(<Badge label="sm" size="sm" />);
    expect(screen.getByText("[ SM ]")).toBeTruthy();
  });
});

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText("Click Me")).toBeTruthy();
  });

  it("disables when disabled", () => {
    render(<Button disabled>No</Button>);
    const button = screen.getByText("No") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});

describe("Card", () => {
  it("renders children", () => {
    render(
      <BrowserRouter>
        <Card>Content</Card>
      </BrowserRouter>,
    );
    expect(screen.getByText("Content")).toBeTruthy();
  });
});
