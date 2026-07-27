# Lote 1 — SEO técnico e metadados

## Implementado

- Configuração central de identidade e URL do site em `lib/seo/site.ts`.
- Metadados globais com `metadataBase`, template de títulos e idioma pt-BR.
- Canonical, Open Graph, Twitter Cards e robots por página.
- Metadados dinâmicos para páginas de empreendimentos.
- JSON-LD para organização imobiliária, WebSite/SearchAction, breadcrumbs e empreendimentos.
- Componente seguro e reutilizável `JsonLd`.
- Sitemap com rotas públicas e páginas de empreendimentos.
- Robots com bloqueio de admin, APIs e fluxos privados de autenticação.
- Área administrativa marcada como `noindex` sem remover sua navegação/RBAC.
- Hierarquia de títulos públicos ajustada para `h1` nas páginas principais.
- Testes ampliados para metadados e dados estruturados.

## Configuração necessária em produção

Definir `NEXT_PUBLIC_SITE_URL` com a URL pública final, sem barra no final. Exemplo:

```env
NEXT_PUBLIC_SITE_URL=https://www.imoveisdealtopadraorio.com.br
```
