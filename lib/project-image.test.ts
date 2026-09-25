import { describe, expect, it } from 'vitest';
import { projectImage, projectImageFromMedia } from './project-image';

describe('project photo attribution', () => {
  it('does not present a Parque Studios photo as a different property', () => {
    expect(projectImage('bruma-mozak', '/images/parque-03.webp')).toBeUndefined();
    expect(projectImage('bruma-mozak', '/images/parque-03.webp', '/uploads/bruma.jpg')).toBe(
      '/uploads/bruma.jpg',
    );
    expect(projectImage('parque-studios', '/images/parque-03.webp')).toBe('/images/parque-03.webp');
  });

  it('uses the matching project book image when the database still points at Parque', () => {
    expect(projectImage('be-in-rio-prudente-589', '/images/parque-05.webp')).toBe(
      '/images/be-in-rio-prudente-589.jpg',
    );
    expect(projectImage('be-in-rio-nascimento-silva-387', '/images/parque-08.webp')).toBe(
      '/images/be-in-rio-nascimento-silva-387.jpg',
    );
  });

  it('does not use a floor plan or video as the project cover', () => {
    expect(
      projectImageFromMedia('green-park', null, [
        { kind: 'FLOOR_PLAN', url: 'https://example.com/plantas/green-park.pdf' },
        { kind: 'VIDEO', url: 'https://example.com/video.mp4' },
        { kind: 'IMAGE', url: 'https://example.com/fachada.jpg' },
      ]),
    ).toBe('https://example.com/fachada.jpg');
    expect(
      projectImageFromMedia('green-park', null, [
        { kind: 'FLOOR_PLAN', url: 'https://example.com/planta.jpg' },
      ]),
    ).toBeUndefined();
  });
});
