import { render, screen } from "@testing-library/react";

import { App } from "@/App";

describe("App", () => {
  it("renders the page heading inside a main landmark", () => {
    render(<App />);

    // Asserting on role rather than markup: the heading level and the <main>
    // landmark are what assistive tech navigates by, so they are the contract.
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /wordcamp schedule viewer/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
