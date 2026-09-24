import { expect, it } from 'vitest';
import { projectAreaLabel } from './project-facts';

it('limits Stay 360 published area range to the typologies named by the developer', () => {
  expect(projectAreaLabel('stay-360-leblon')).toBe('28 a 50 m² (studios e gardens)');
});

it('shows the confirmed Copacabana area span on the project page', () => {
  expect(projectAreaLabel('be-in-rio-copacabana')).toBe('37,12 a 153,24 m²');
});
