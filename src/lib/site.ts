export type SiteLink = {
  href: string;
  title: string;
  isExternal?: boolean;
};

export const site = {
  title: "Diet app",
  description: "Search foods and save meals. Food data comes from Fineli.",
  header: {
    title: "Diet app",
    slogan: "Search foods. Save meals.",
    links: [
      { href: "/", title: "Home" },
      { href: "/about", title: "About" },
    ] satisfies SiteLink[],
    callToAction: { href: "/login", title: "Sign in" } satisfies SiteLink,
  },
  footer: {
    pages: {
      title: "Pages",
      links: [
        { href: "/", title: "Home" },
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
      link: {
        href: "https://fineli.fi/",
        title: "Fineli",
        isExternal: true,
      } satisfies SiteLink,
    },
  },
};
