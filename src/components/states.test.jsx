import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoadingState, ErrorState } from "@/components/states";

describe("LoadingState", () => {
  it("announces itself as a live region with real text", () => {
    // The skeleton shapes are aria-hidden, so without this the region would
    // announce nothing at all to a screen reader.
    render(<LoadingState />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading WordCamps");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("renders skeleton cards rather than a spinner", () => {
    // Skeletons reserve the space the content will take, so the page does not
    // jump when ~1,500 records land.
    const { container } = render(<LoadingState />);

    expect(
      container.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThan(1);
  });
});

describe("ErrorState", () => {
  it("is announced as an alert", () => {
    render(<ErrorState error={new Error("HTTP 503")} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows a plain-language message and the underlying reason", () => {
    // The sentence is for the visitor; the reason is what makes a bug report
    // actionable.
    render(<ErrorState error={new Error("HTTP 503")} />);

    expect(screen.getByText("Could not load WordCamps.")).toBeInTheDocument();
    expect(screen.getByText("HTTP 503")).toBeInTheDocument();
  });

  it("renders without an error object", () => {
    render(<ErrorState />);

    expect(screen.getByText("Could not load WordCamps.")).toBeInTheDocument();
  });

  it("offers a retry only when a handler is supplied", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    const { rerender } = render(<ErrorState error={new Error("x")} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(<ErrorState error={new Error("x")} onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
