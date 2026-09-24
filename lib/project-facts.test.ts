import { expect, it } from 'vitest';
import { projectAreaLabel } from './project-facts';

it('limits Stay 360 published area range to the typologies named by the developer', () => {
  expect(projectAreaLabel('stay-360-leblon')).toBe('28 a 50 m² (studios e gardens)');
});

it('shows the confirmed Copacabana area span on the project page', () => {
  expect(projectAreaLabel('be-in-rio-copacabana')).toBe('37,12 a 153,24 m²');
});

it('shows developer-confirmed Soul and Paradís area spans on their pages', () => {
  expect(projectAreaLabel('soul-rio-gago-coutinho')).toBe('27,81 a 82,65 m²');
  expect(projectAreaLabel('paradis-mozak')).toBe('62 a 147 m²');
});

it('shows the area spans published by the client for Green Park and Pompeu', () => {
  expect(projectAreaLabel('green-park')).toBe('64 a 265 m²');
  expect(projectAreaLabel('be-in-rio-pompeu')).toBe('30 a 80,01 m²');
});
