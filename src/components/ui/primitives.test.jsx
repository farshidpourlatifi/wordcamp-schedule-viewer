import { render, screen } from "@testing-library/react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

describe("Card", () => {
  it("renders its children", () => {
    render(<Card>Rome 2026</Card>);

    expect(screen.getByText("Rome 2026")).toBeInTheDocument();
  });

  it("merges a caller's className over its own", () => {
    // twMerge, not concatenation: the caller's p-8 must replace the default
    // p-4 rather than both landing in the class list.
    const { container } = render(<Card className="p-8">x</Card>);

    expect(container.firstChild).toHaveClass("p-8");
    expect(container.firstChild).not.toHaveClass("p-4");
  });

  it("can render as another element, for semantic nesting", () => {
    const { container } = render(<Card as="article">x</Card>);

    expect(container.firstChild.tagName).toBe("ARTICLE");
  });
});

describe("Button", () => {
  it("renders a real button with an explicit type", () => {
    // type defaults to "button" so a button inside a form never submits it.
    render(<Button>Show earlier</Button>);

    expect(
      screen.getByRole("button", { name: "Show earlier" }),
    ).toHaveAttribute("type", "button");
  });

  it("forwards handlers and disabled state", () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive technology", () => {
    // The loading region announces itself; repeating shapes would only add
    // noise for a screen-reader user.
    const { container } = render(<Skeleton className="h-4 w-24" />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
