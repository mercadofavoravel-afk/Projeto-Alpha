import Link from 'next/link';

import { SITE_CONFIG } from '@/lib/site-config';

export function Footer() {
  return (
    <footer className="footer luxury-footer">
      <div className="wrap luxury-footer-grid">
        <div className="luxury-footer-brand">
          <div className="eyebrow">Rio de Janeiro</div>

          <strong>IMÓVEIS DE ALTO PADRÃO</strong>

          <p>
            Curadoria de residências e empreendimentos excepcionais nos endereços mais desejados do
            Rio.
          </p>
        </div>

        <div className="luxury-footer-column">
          <span>Explorar</span>
          <Link href="/empreendimentos">Empreendimentos</Link>
          <Link href="/colecoes">Coleções</Link>
          <Link href="/artigos">Conteúdos</Link>
          <Link href="/buscar">Buscar</Link>
        </div>

        <div className="luxury-footer-column">
          <span>Curadoria</span>
          <Link href="/descubra">Descubra seu perfil</Link>
          <Link href="/descubra">Seleção personalizada</Link>
        </div>

        <div className="luxury-footer-column">
          <span>Atendimento</span>
          <p>Atendimento reservado e orientado ao perfil de cada cliente.</p>
          <a
            aria-label="Enviar e-mail para Imóveis de Alto Padrão Rio"
            href={`mailto:${SITE_CONFIG.email}`}
          >
            {SITE_CONFIG.email}
          </a>
          <a
            aria-label="Abrir WhatsApp da Imóveis de Alto Padrão Rio"
            href={SITE_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp: {SITE_CONFIG.whatsapp}
          </a>
        </div>
      </div>

      <div className="wrap luxury-footer-bottom">
        <span>© {new Date().getFullYear()} Imóveis de Alto Padrão Rio</span>

        <span>Rio de Janeiro · Brasil</span>
      </div>
    </footer>
  );
}
