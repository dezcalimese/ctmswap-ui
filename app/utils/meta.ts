export const createMetaTags = (
  title = "CTMSwap",
  description = "The gateway to the Cointinuum ecosystem.",
  image = "/img/ctm-logo.png"
) => ({
  title,
  description,
  "og:type": "website",
  "og:title": title,
  "og:description": description,
  "og:image": image,
  "twitter:card": "summary_large_image",
  "twitter:title": title,
  "twitter:description": description,
  "twitter:image": image,
});
