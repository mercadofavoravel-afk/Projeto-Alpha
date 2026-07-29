import type { Metadata } from "next";
import { buildCanonical } from "./canonical";
import { siteConfig } from "./site";
import type { MetadataOptions } from "./types";

function resolveImage(image?: string | null) {
  if (!image) return buildCanonical(siteConfig.defaultImage);
  if (/^https?:\/\//.test(image)) return image;
  return buildCanonical(image);
}

export function createMetadata(options: MetadataOptions): Metadata {
  const canonical = buildCanonical(options.path);
  const image = resolveImage(options.image);
  const imageAlt = options.imageAlt || options.title;

  return {
    title: options.title,
    description: options.description,
    keywords: options.keywords,
    alternates: { canonical },
    robots: options.noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: options.type ?? "website",
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      title: options.title,
      description: options.description,
      url: canonical,
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [image],
      site: siteConfig.twitterHandle,
    },
  };
}
