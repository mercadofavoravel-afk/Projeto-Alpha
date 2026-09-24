import { expect, it } from 'vitest';
import { projectAreaLabel } from './project-facts';

it('limits Stay 360 published area range to the typologies named by the developer', () => {
  expect(projectAreaLabel('stay-360-leblon')).toBe('28 a 50 m² (studios e gardens)');
});
