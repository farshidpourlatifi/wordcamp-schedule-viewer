import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("px-4", "font-bold")).toBe("px-4 font-bold");
  });

  it("drops falsy values so conditional classes can be inlined", () => {
    const isHidden = false;
    expect(cn("px-4", isHidden && "hidden", null, undefined)).toBe("px-4");
  });

  it("lets a later Tailwind class win over an earlier conflicting one", () => {
    // The point of twMerge: a caller's override must replace the default,
    // not merely sit alongside it and depend on CSS source order.
    expect(cn("p-4", "p-8")).toBe("p-8");
    expect(cn("text-muted-foreground", "text-foreground")).toBe(
      "text-foreground",
    );
  });
});
