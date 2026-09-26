import { describe, expect, it } from 'vitest';

import { sourceFromReferrer } from './campaign-attribution';

const site = 'https://imoveisdealtopadraorio.com.br';

describe('sourceFromReferrer', () => {
  it('identifies search, maps, social and property portal referrals', () => {
    expect(sourceFromReferrer('https://www.google.com.br/search?q=ip', site)).toEqual({
      utmSource: 'google',
      utmMedium: 'organic',
    });
    expect(sourceFromReferrer('https://www.google.com/maps/place/rio', site)).toEqual({
      utmSource: 'google_maps',
      utmMedium: 'referral',
    });
    expect(sourceFromReferrer('https://www.bing.com/search?q=rj', site)).toEqual({
      utmSource: 'bing',
      utmMedium: 'organic',
    });
    expect(sourceFromReferrer('https://l.instagram.com/?u=article', site)).toEqual({
      utmSource: 'instagram',
      utmMedium: 'social',
    });
    expect(sourceFromReferrer('https://www.zapimoveis.com.br/imovel/123', site)).toEqual({
      utmSource: 'zapimoveis',
      utmMedium: 'referral',
    });
  });

  it('does not invent a platform for same-domain, absent or deceptive referrers', () => {
    expect(sourceFromReferrer('https://www.imoveisdealtopadraorio.com.br/artigo/', site)).toEqual(
      {},
    );
    expect(sourceFromReferrer('https://imoveisdealtopadraorio.com.br/alpha/', site)).toEqual({});
    expect(sourceFromReferrer('https://google.com.example.com/search', site)).toEqual({});
    expect(sourceFromReferrer('', site)).toEqual({});
  });
});
