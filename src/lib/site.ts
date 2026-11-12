export type SiteLink = {
  href: string;
  title: string;
  isExternal?: boolean;
};

export const mainNav = [
  { href: "/ingredients", title: "Search", tab: "search" },
  { href: "/saved-ingredients", title: "Ingredients", tab: "ingredients" },
  { href: "/meals", title: "Meals", tab: "meals" },
] as const;

export const site = {
  title: "Diet app",
  description: "Search foods and save meals. Food data comes from Fineli.",
  header: {
    title: "Diet app",
    slogan: "Search foods. Save meals.",
    callToAction: { href: "/login", title: "Sign in" } satisfies SiteLink,
  },
  footer: {
    pages: {
      title: "Pages",
      links: [
        { href: "/", title: "Home" },
        { href: "/ingredients", title: "Search" },
        { href: "/about", title: "About" },
        { href: "/login", title: "Sign in" },
      ] satisfies SiteLink[],
    },
    brand: {
      title: "About",
      description:
        "Diet app helps you search foods and save meals. Food data comes from Fineli, the Finnish national food composition database.",
    },
    subFooter: {
      title: "Diet app",
      credit: "Food data: Finnish Institute for Health and Welfare,",
      fineli: {
        href: "https://fineli.fi/",
        title: "Fineli",
        isExternal: true,
      } satisfies SiteLink,
      license: {
        href: "https://creativecommons.org/licenses/by/4.0/",
        title: "CC BY 4.0",
        isExternal: true,
      } satisfies SiteLink,
    },
  },
};
