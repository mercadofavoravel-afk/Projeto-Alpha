import { isPublicSiteUrl } from './public-destination';
import { SITE_CONFIG } from './site-config';

const destinationPattern = /(?:https?:\/\/|mailto:)[^\s<>"')\]]+/giu;

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.,;:!?]+$/u, '');
}

function isOfficialDestination(value: string) {
  if (value === `mailto:${SITE_CONFIG.email}`) {
    return true;
  }

  if (value.replace(/\/$/u, '') === SITE_CONFIG.whatsappUrl.replace(/\/$/u, '')) {
    return true;
  }

  return isPublicSiteUrl(value);
}

export function findInvalidEditorialDestinations(value: string) {
  return Array.from(
    new Set(
      (value.match(destinationPattern) ?? [])
        .map(trimTrailingPunctuation)
        .filter((destination) => !isOfficialDestination(destination)),
    ),
  );
}
