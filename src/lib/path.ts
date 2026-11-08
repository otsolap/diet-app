export function isCurrentPath(pathname: string, href: string) {
  const normalize = (value: string) =>
    value === "/" ? "/" : value.replace(/\/+$/, "");

  return normalize(pathname) === normalize(href);
}
