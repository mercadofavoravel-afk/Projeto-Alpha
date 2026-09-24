import { describe, expect, it } from 'vitest';
import { projectImage } from './project-image';

describe('project photo attribution', () => {
  it('does not present a Parque Studios photo as a different property', () => {
    expect(projectImage('bruma-mozak', '/images/parque-03.webp')).toBeUndefined();
    expect(projectImage('bruma-mozak', '/images/parque-03.webp', '/uploads/bruma.jpg')).toBe(
      '/uploads/bruma.jpg',
    );
    expect(projectImage('parque-studios', '/images/parque-03.webp')).toBe('/images/parque-03.webp');
  });
});
