import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts in favour of the last one.
 *
 * `clsx` flattens conditionals and arrays into a class string; `twMerge` then
 * removes earlier classes that the later ones override, so a caller can pass
 * `className="p-8"` to a component whose default is `p-4` and actually get
 * `p-8` — plain string concatenation would emit both and let CSS source order
 * decide, which is not what the caller meant.
 *
 * @param {...(string|Object|Array|undefined|null|false)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
