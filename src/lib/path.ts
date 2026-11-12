export function isCurrentPath(pathname: string, href: string) {
  const normalize = (value: string) =>
    value === "/" ? "/" : value.replace(/\/+$/, "");

  return normalize(pathname) === normalize(href);
}

export function isMainNavActive(pathname: string, href: string) {
  if (href === "/ingredients") {
    return pathname === "/ingredients" || pathname.startsWith("/ingredients/");
  }

  if (href === "/saved-ingredients") {
    return pathname === "/saved-ingredients" || pathname.startsWith("/portions/");
  }

  if (href === "/meals") {
    return pathname === "/meals" || pathname.startsWith("/meals/");
  }

  return false;
}
