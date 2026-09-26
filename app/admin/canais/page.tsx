import Link from 'next/link';

import { requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type Channel = {
  name: string;
  status: string;
  next: string;
};

const channels: Channel[] = [
  {
    name: 'Google Busca',
    status:
      'Site público e sitemap Alpha enviado ao Search Console; indexação das URLs ainda depende do Google.',
    next: 'Monitorar cobertura, consultas e páginas Alpha no Search Console.',
  },
  {
    name: 'Google Imagens',
    status:
      'Páginas públicas com imagens e metadados. Aparição de imagens específicas não confirmada.',
    next: 'Verificar rastreamento das imagens, texto alternativo e relatório de desempenho por tipo Imagem.',
  },
  {
    name: 'Google Maps / Perfil da Empresa',
    status: 'Perfil da marca e verificação de propriedade não confirmados.',
    next: 'Localizar ou reivindicar o perfil elegível e confirmar nome, endereço ou área de atendimento, telefone e site.',
  },
  {
    name: 'Bing / Copilot',
    status:
      'Sitemap Alpha público; propriedade do Bing Webmaster Tools e indexação no Bing não confirmadas.',
    next: 'Verificar o domínio no Bing Webmaster Tools, importar o sitemap e acompanhar indexação. Copilot usa busca na web quando aplicável.',
  },
  {
    name: 'Apple Maps',
    status: 'Cadastro da empresa e URL pública não confirmados.',
    next: 'Conferir a ficha da empresa e consistência dos dados locais.',
  },
  {
    name: 'Ecosia e outras buscas',
    status: 'Exibição de páginas Alpha não confirmada.',
    next: 'Validar URLs em resultados e medir visitas com origem identificada.',
  },
  {
    name: 'YouTube',
    status: 'Canal oficial vinculado ao domínio não confirmado.',
    next: 'Confirmar canal, publicar vídeos próprios por produto/bairro e vincular cada vídeo à página correspondente.',
  },
  {
    name: 'Instagram',
    status: 'Perfil oficial vinculado ao domínio não confirmado.',
    next: 'Confirmar perfil, criar peças por produto e usar links próprios rastreáveis.',
  },
  {
    name: 'TikTok / Kwai',
    status: 'Perfis oficiais vinculados ao domínio não confirmados.',
    next: 'Confirmar perfis e publicar vídeos adaptados a cada rede com destino rastreável.',
  },
  {
    name: 'LinkedIn',
    status: 'Página oficial da empresa vinculada ao domínio não confirmada.',
    next: 'Confirmar página da empresa e distribuir análises locais e artigos com links próprios.',
  },
  {
    name: 'ZAP / Viva Real / OLX',
    status: 'Conta anunciante, inventário autorizado e anúncios da marca não confirmados.',
    next: 'Conferir cadastro e regras comerciais; publicar somente imóveis autorizados e dados atualizados.',
  },
  {
    name: 'Guias e plataformas locais',
    status: 'Cadastros da marca e desempenho não confirmados.',
    next: 'Priorizar diretórios locais relevantes e verificar identidade, URL e origem dos leads.',
  },
];

export default async function ChannelsPage() {
  await requirePermission('analytics:read');

  return (
    <>
      <div className="eyebrow">Distribuição orgânica · diagnóstico de 26/09/2026</div>
      <h1>Canais orgânicos</h1>
      <p>
        Mapa de presença verificável e pendências. Um sitemap público permite descoberta, mas não
        comprova indexação, perfil ativo, posição nas buscas ou tráfego em outra plataforma.
      </p>

      <div className="panel">
        <h2>Presença e próximas verificações</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>O que está confirmado</th>
                <th>Próxima ação</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.name}>
                  <td>
                    <b>{channel.name}</b>
                  </td>
                  <td>{channel.status}</td>
                  <td>{channel.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Como medir sem confundir canais</h2>
        <p>
          O <Link href="/admin/origens">painel de origens</Link> mostra cadastros identificados por
          UTM, artigo e região. O <Link href="/admin/seo">painel SEO</Link> verifica a estrutura das
          páginas Alpha. Visitas, visualizações de perfis e impressões externas exigem relatórios
          das próprias plataformas; esses dados ainda não entram neste painel.
        </p>
        <p>
          Use um URL público distinto para cada artigo e parâmetros utm_source, utm_medium e
          utm_campaign nos links compartilhados. Cada canal deve levar à página Alpha ou à página
          própria do produto, com formulário de contato e identidade consistente.
        </p>
      </div>
    </>
  );
}
