import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFile } from "node:fs/promises";

import {
  Headphones,
  Shirt,
  House,
  Watch,
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  ArrowRight,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  X,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";

const icons = {
  headphones: Headphones,
  shirt: Shirt,
  house: House,
  watch: Watch,
  search: Search,
  "shopping-bag": ShoppingBag,
  "user-round": UserRound,
  menu: Menu,
  "arrow-right": ArrowRight,
  heart: Heart,
  star: Star,
  truck: Truck,
  "shield-check": ShieldCheck,
  "rotate-ccw": RotateCcw,
  x: X,
  plus: Plus,
  minus: Minus,
  "trash-2": Trash2,
};

for (const [name, Icon] of Object.entries(icons)) {
  const svg = renderToStaticMarkup(
    React.createElement(Icon, {
      width: 24,
      height: 24,
      strokeWidth: 2,
      color: "#111827",
      "aria-hidden": true,
    })
  );

  await writeFile(
    `public/assets/icons/${name}.svg`,
    svg,
    "utf8"
  );

  console.log(`Created: ${name}.svg`);
}

console.log("\nAll 18 Shopora icons exported successfully!");
