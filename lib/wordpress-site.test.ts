import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  isMatrixWordPressSite,
  isPublicWordPressIPv4,
  normalizeWordPressSite,
} from './wordpress-site';

describe('cadastro seguro do WordPress por cliente', () => {
  it('normaliza sites HTTPS e permite instalações em subdiretórios', () => {
    expect(normalizeWordPressSite('https://www.exemplo.com.br/blog/')).toBe(
      'https://www.exemplo.com.br/blog',
    );
  });

  it('recusa endereços internos, IPs, portas e credenciais no URL', () => {
    for (const value of [
      'http://exemplo.com.br',
      'https://localhost',
      'https://10.0.0.1',
      'https://site.local',
      'https://exemplo.com.br:8443',
      'https://usuario:senha@exemplo.com.br',
      'https://exemplo.com.br?senha=x',
    ])
      expect(normalizeWordPressSite(value)).toBeNull();
  });

  it('recusa IPs de rede privada e metadados mesmo após DNS', () => {
    for (const ip of [
      '127.0.0.1',
      '169.254.169.254',
      '10.5.4.3',
      '172.16.0.1',
      '192.168.1.2',
      '100.64.0.1',
    ])
      expect(isPublicWordPressIPv4(ip)).toBe(false);
    expect(isPublicWordPressIPv4('8.8.8.8')).toBe(true);
  });

  it('reserva o domínio da imobiliária para a operação matriz', () => {
    expect(isMatrixWordPressSite('https://www.imoveisdealtopadraorio.com.br')).toBe(true);
    expect(isMatrixWordPressSite('https://imoveisdealtopadraorio.com.br/alpha')).toBe(true);
    expect(isMatrixWordPressSite('https://cliente-imoveisdealtopadraorio.com.br')).toBe(false);
  });
});
