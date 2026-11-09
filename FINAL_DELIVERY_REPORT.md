# Relatório de entrega — Kurio NFT Marketplace

## Publicação

- GitHub: [LucasArts2020/marketplace-de-nft](https://github.com/LucasArts2020/marketplace-de-nft).
- Produção: [marketplace-de-nft.vercel.app](https://marketplace-de-nft.vercel.app).
- Revisão da aplicação verificada: [38ce3bed695efaf588b79eb4adfd43170520aadc](https://github.com/LucasArts2020/marketplace-de-nft/commit/38ce3bed695efaf588b79eb4adfd43170520aadc).
- A Vercel clonou a branch principal e registrou o commit `38ce3be` no build de produção `dpl_2Dm77tXA7ZS43i7Mv52QEDsi43gc`. O commit posterior de evidências não altera o código publicado.

## Correções

- MSW inicia em todos os builds. A Vercel serve o worker e os assets estáticos, com fallback para rotas SPA. O cliente Socket.IO é importado após a inicialização do worker.
- Imagens WebP em 480 e 960 px, descoberta antecipada da arte em mobile, rotas secundárias carregadas sob demanda e espaço reservado no detalhe. Tailwind inspeciona apenas a pasta de código da aplicação.
- Descrição SEO, robots.txt e favicon. Links do rodapé com área de toque ampliada e nome acessível do carrinho e da compra alinhado aos rótulos visíveis.
- Erros de cadastro, avatar, senha, carteira e checkout associados aos formulários ou campos pertinentes. Confirmação divergente recebe foco e aria-invalid.
- Oito baselines reais de Playwright nas quatro telas, com contextos isolados e data fixa. Diferenças não são atualizadas automaticamente.
- Lighthouse 13.6.0 no lockfile e comando que gera 12 relatórios HTML e 12 JSON, registra as configurações e calcula medianas.
- Reset do estado simulado e recuperação com a mesma chave após timeout antes da criação do pedido.

## Verificações

| Verificação | Resultado |
|---|---|
| TypeScript, lint e build otimizado | Aprovados. Clone limpo do GitHub também instalou o lockfile e compilou. |
| Playwright em produção | **50 passaram, 2 ignorados por perfil, 0 falhas** em 1,6 min. Os dois ignorados são o diálogo desktop no projeto mobile e o fluxo de tela inteira mobile no projeto desktop. |
| Primeira rodada pública | 48 passaram e 2 falharam no seletor do preço responsivo, que correspondia a duas versões no DOM. O seletor passou a usar só o preço visível, e o reset passou nos dois perfis. [Relatório final e traces da primeira rodada](audit/playwright/index.html). |
| Regressão visual | As quatro telas coincidiram com as oito baselines em Chromium desktop/mobile. |
| MSW e Socket.IO públicos | O catálogo respondeu pelo service worker. Cenários de alteração de preço e estoque, queda/reconexão, descarte de evento antigo e recuperação de pedido foram exercitados pelo cliente real. |
| Rotas e estado | Acesso direto e refresh em HTTPS, cadastro, login, favoritos, carrinho, checkout, recibo, perfil e carteiras. Idempotência antes e depois do commit e snapshot de pedido verificados. |
| Sondagens adicionais | Catálogo aberto refletiu 1,19 → 1,45 ETH. Replay de pedido recusado retornou HTTP 200 com o mesmo ID e sem recibo. Nenhuma origem HTTP externa observada nesse fluxo. Zoom nativo 200%/400% em início/detalhe manteve 720/360 px sem overflow. Hover no Emerald manteve título e preço separados. |
| Equivalência de build | SHA-256 iguais entre local e produção para JS principal, CSS, service worker e arte WebP de destaque. |

## Lighthouse

Medianas de três rodadas por combinação, no build otimizado. Lighthouse 13.6.0, Edge Chromium headless, Windows, throttling simulado e fixtures padrão.

| Tela e perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Início mobile | 90 | 100 | 100 | 100 | 3602 | 0,00115 | 50 |
| Detalhe mobile | 91 | 100 | 100 | 100 | 3440 | 0,00000 | 30 |
| Início desktop | 100 | 100 | 100 | 100 | 791 | 0,02642 | 0 |
| Detalhe desktop | 99 | 100 | 100 | 100 | 826 | 0,00039 | 0 |

As quatro medianas atingiram as metas. O início mobile teve rodadas de 91, 90 e 89, com mediana 90. [Resumo e configurações](audit/lighthouse/delivery/summary.json) · [Relatório HTML de detalhe mobile](audit/lighthouse/delivery/detalhe-mobile-1.report.html).

## Situação dos requisitos

A matriz abaixo acompanha os 107 IDs da [auditoria inicial](DELIVERY_AUDIT.md). As evidências que permanecem válidas estão na matriz original. Um estado parcial mantém a ressalva identificada quando a execução final não cobre todo o requisito.

PASSOU 89 · FALHOU 0 · PARCIAL 18 · NÃO VERIFICADO 0

| ID | Requisito | Status | Evidência de revalidação |
|---|---|---|---|
| ST01 | React | PASSOU | Mantido conforme a auditoria inicial. |
| ST02 | TypeScript | PASSOU | Mantido conforme a auditoria inicial. |
| ST03 | TanStack Router | PASSOU | Mantido conforme a auditoria inicial. |
| ST04 | TanStack Query | PASSOU | Mantido conforme a auditoria inicial. |
| ST05 | Axios | PASSOU | Mantido conforme a auditoria inicial. |
| ST06 | REST APIs | PASSOU | Mantido conforme a auditoria inicial. |
| ST07 | Socket.IO | PASSOU | Mantido conforme a auditoria inicial. |
| ST08 | Tailwind CSS | PASSOU | Mantido conforme a auditoria inicial. |
| ST09 | shadcn/ui | PARCIAL | Mantido conforme a auditoria inicial. |
| ST10 | MSW | PASSOU | Mantido conforme a auditoria inicial. |
| ST11 | Playwright | PASSOU | Mantido conforme a auditoria inicial. |
| ST12 | Lighthouse | PASSOU | Lighthouse 13.6.0 fixado, comando reproduzível e 12 execuções. |
| UI01 | Início com destaques e navegação ao NFT | PASSOU | Mantido conforme a auditoria inicial. |
| UI02 | Detalhe com galeria e informações | PASSOU | Mantido conforme a auditoria inicial. |
| UI03 | Carrinho com resumo | PASSOU | Mantido conforme a auditoria inicial. |
| UI04 | Pagamento com dados, carteira, rede, revisão e envio | PASSOU | Mantido conforme a auditoria inicial. |
| UI05 | Confirmação com ID, itens, taxas e total | PASSOU | Mantido conforme a auditoria inicial. |
| UI06 | Login com validação e retorno | PASSOU | Mantido conforme a auditoria inicial. |
| UI07 | Cadastro validado e conflito | PASSOU | Mantido conforme a auditoria inicial. |
| UI08 | Perfil, avatar e senha | PASSOU | Mantido conforme a auditoria inicial. |
| UI09 | Carteira principal e secundária | PASSOU | Mantido conforme a auditoria inicial. |
| UI10 | Ações auxiliares coerentes e referências simuladas | PARCIAL | Mantido conforme a auditoria inicial. |
| CAT01 | Busca | PASSOU | Mantido conforme a auditoria inicial. |
| CAT02 | Filtros combináveis | PASSOU | Mantido conforme a auditoria inicial. |
| CAT03 | Ordenação e paginação | PASSOU | Mantido conforme a auditoria inicial. |
| CAT04 | URL, refresh, histórico e reinício de página | PASSOU | Mantido conforme a auditoria inicial. |
| CAT05 | Vazio, erro e respostas obsoletas | PASSOU | Mantido conforme a auditoria inicial. |
| CAT06 | Acesso direto e NFT inexistente | PASSOU | Mantido conforme a auditoria inicial. |
| CAT07 | Edição indisponível e limite de quantidade | PASSOU | Mantido conforme a auditoria inicial. |
| CAT08 | Favorito autenticado e persistente | PASSOU | Mantido conforme a auditoria inicial. |
| CAR01 | Inclusão, edição, remoção e disponibilidade | PASSOU | Mantido conforme a auditoria inicial. |
| CAR02 | Persistência e preservação do visitante após login | PASSOU | Mantido conforme a auditoria inicial. |
| CAR03 | Aplicar/remover cupom, inválido e expirado | PASSOU | Mantido conforme a auditoria inicial. |
| CAR04 | Subtotal, desconto, taxa, total e ETH decimal | PASSOU | Mantido conforme a auditoria inicial. |
| CAR05 | Atualização com preço e estoque durante uso | PASSOU | Mantido conforme a auditoria inicial. |
| PAY01 | Validação dos campos do layout | PARCIAL | Mantido conforme a auditoria inicial. |
| PAY02 | Conexão, recusa e desconexão de carteira | PASSOU | Mantido conforme a auditoria inicial. |
| PAY03 | Revalidar preço, disponibilidade, cupom e taxa | PARCIAL | Mantido conforme a auditoria inicial. |
| PAY04 | Nova aprovação após alteração | PASSOU | Mantido conforme a auditoria inicial. |
| PAY05 | Clique repetido, mesma chave e conflito com corpo distinto | PASSOU | Mantido conforme a auditoria inicial. |
| PAY06 | Timeout após criação e recuperação | PASSOU | Mantido conforme a auditoria inicial. |
| PAY07 | Timeout anterior à criação e reenvio | PASSOU | Checkout: timeout pré-commit, consulta 404 e segundo POST com chave idêntica. |
| PAY08 | Pedido pendente após refresh e desconexão | PASSOU | Mantido conforme a auditoria inicial. |
| PAY09 | Pedido confirmado ou recusado e terminalidade | PASSOU | Sondagem pública repete POST de pedido recusado e recebe 200 com o mesmo ID, recusado e sem recibo. |
| PAY10 | Confirmação somente após API simulada | PASSOU | Mantido conforme a auditoria inicial. |
| PAY11 | Snapshot imutável do recibo | PASSOU | Mantido conforme a auditoria inicial. |
| PAY12 | Preservar itens em falhas e remover apenas comprados | PARCIAL | Mantido conforme a auditoria inicial. |
| SES01 | Cadastro, login, logout e refresh de sessão | PASSOU | Mantido conforme a auditoria inicial. |
| SES02 | Proteção das rotas privadas | PASSOU | Mantido conforme a auditoria inicial. |
| SES03 | Expiração e retomada de contexto | PASSOU | Mantido conforme a auditoria inicial. |
| SES04 | Limpar cache privado e subscriptions | PARCIAL | Mantido conforme a auditoria inicial. |
| SES05 | Senhas fictícias e persistência sem texto puro | PASSOU | Mantido conforme a auditoria inicial. |
| INT01 | Contratos tipados e erros REST documentados | PASSOU | Mantido conforme a auditoria inicial. |
| INT02 | Loading, vazio, erro, sucesso e atualização em background | PARCIAL | Mantido conforme a auditoria inicial. |
| INT03 | Invalidação, cancelamento e rollback | PASSOU | Mantido conforme a auditoria inicial. |
| INT04 | Isolamento por usuário e parâmetros | PASSOU | Mantido conforme a auditoria inicial. |
| INT05 | Rota desconhecida e deep links de todas as telas | PARCIAL | Mantido conforme a auditoria inicial. |
| INT06 | Política de cache, retries e sincronização | PASSOU | Mantido conforme a auditoria inicial. |
| MSW01 | Rede como fonte única de negócio em desenvolvimento/demo/testes | PASSOU | Mantido conforme a auditoria inicial. |
| MSW02 | Fixtures suficientes, dois usuários, preços e imagens válidos | PASSOU | Mantido conforme a auditoria inicial. |
| MSW03 | Persistência e reset integral | PASSOU | Reset dos dados persistidos e reload com preço original e carrinho vazio em desktop e mobile. |
| MSW04 | Latência variável, fora de ordem, HTTP 4xx/5xx | PASSOU | Mantido conforme a auditoria inicial. |
| MSW05 | Indisponibilidade de conexão HTTP simulável | PARCIAL | Mantido conforme a auditoria inicial. |
| MSW06 | Sessão expirada, conflito, cupom, esgotamento e pagamentos | PASSOU | Mantido conforme a auditoria inicial. |
| RT01 | nft.updated atualiza catálogo, detalhe e carrinho | PASSOU | Preço mudou no catálogo aberto em sondagem pública, no detalhe no teste de reset e no carrinho no checkout.spec. |
| RT02 | order.updated confirma ou recusa, com identidade e versão | PASSOU | Mantido conforme a auditoria inicial. |
| RT03 | Duplicatas e eventos antigos | PARCIAL | Mantido conforme a auditoria inicial. |
| RT04 | Reconciliação REST e pedido pendente | PASSOU | Mantido conforme a auditoria inicial. |
| RT05 | Limpeza de listeners e isolamento de sessão | PARCIAL | Mantido conforme a auditoria inicial. |
| UX01 | Fidelidade de tipografia, paleta, imagem, proporção e composição | PARCIAL | Mantido conforme a auditoria inicial. |
| UX02 | 390, 768 e 1440 px, alinhamento e overflow | PASSOU | Mantido conforme a auditoria inicial. |
| UX03 | Hover sem sobreposição, zoom sem perda | PASSOU | Hover do Emerald sem sobreposição. Zoom nativo 200% e 400% em início/detalhe, sem overflow e com ações alcançáveis. |
| UX04 | Skeletons e shimmer em catálogo, detalhe e cotação | PARCIAL | Mantido conforme a auditoria inicial. |
| UX05 | Movimento reduzido | PASSOU | Playwright emula movimento reduzido e verifica animation-name none no loading. |
| UX06 | Teclado, foco visível e diálogos | PARCIAL | Mantido conforme a auditoria inicial. |
| UX07 | Labels e erros associados aos campos | PARCIAL | Erros relacionados e foco verificados para confirmação de senha e endereço. Erros de API genéricos mantêm descrição no formulário. |
| UX08 | Alt, contraste e feedback sem depender de cor | PARCIAL | Mantido conforme a auditoria inicial. |
| UX09 | Compra e toque no mobile | PARCIAL | Mantido conforme a auditoria inicial. |
| T01 | E2E 1: busca, filtros, ordenação, paginação, histórico | PASSOU | Mantido conforme a auditoria inicial. |
| T02 | E2E 2: detalhe direto e inexistente | PASSOU | Mantido conforme a auditoria inicial. |
| T03 | E2E 3: cadastro, login, expiração, logout, troca | PASSOU | Mantido conforme a auditoria inicial. |
| T04 | E2E 4: favoritos, falha e rollback | PASSOU | Mantido conforme a auditoria inicial. |
| T05 | E2E 5: carrinho, cupom, refresh/login | PASSOU | Mantido conforme a auditoria inicial. |
| T06 | E2E 6: compra completa | PASSOU | Mantido conforme a auditoria inicial. |
| T07 | E2E 7: falha, clique repetido e timeout | PASSOU | Mantido conforme a auditoria inicial. |
| T08 | E2E 8: perfil, avatar, senha, carteiras e erros | PASSOU | Mantido conforme a auditoria inicial. |
| T09 | E2E 9: preço/disponibilidade via Socket.IO | PASSOU | Mantido conforme a auditoria inicial. |
| T10 | E2E 10: duplicatas/antigos, queda e retomada | PASSOU | Mantido conforme a auditoria inicial. |
| T11 | E2E 11: teclado, foco e formulários | PASSOU | Mantido conforme a auditoria inicial. |
| T12 | E2E 12: skeleton lento, falha e retry | PASSOU | Mantido conforme a auditoria inicial. |
| T13 | Contextos isolados, controle de relógio e eventos | PARCIAL | Mantido conforme a auditoria inicial. |
| T14 | Baselines visuais versionadas das quatro telas | PASSOU | Oito referências versionadas e comparadas em produção sem atualizar baselines. |
| T15 | Relatório HTML e traces em falhas | PASSOU | Mantido conforme a auditoria inicial. |
| LH01 | 12 auditorias, relatórios HTML/JSON e métricas | PASSOU | Mantido conforme a auditoria inicial. |
| LH02 | Performance ≥90 em 4 grupos | PASSOU | Medianas 90, 91, 100 e 99. |
| LH03 | Accessibility ≥95 em 4 grupos | PASSOU | Mantido conforme a auditoria inicial. |
| LH04 | Best Practices ≥95 em 4 grupos | PASSOU | Mantido conforme a auditoria inicial. |
| LH05 | SEO ≥90 em 4 grupos | PASSOU | SEO 100 nas quatro combinações. |
| LH06 | Comando e configuração de auditoria entregues no projeto | PASSOU | npm run audit:lighthouse, com presets, resumo e instruções versionados. |
| DL01 | Repositório Git público e revisão entregue | PASSOU | GitHub público, push para main, SHA verificável. |
| DL02 | Código, lockfile, assets, mocks, fixtures, testes | PASSOU | Mantido conforme a auditoria inicial. |
| DL03 | URL pública funcional com HTTPS | PASSOU | Alias HTTPS público respondeu 200 sem autenticação Vercel. |
| DL04 | Correspondência de commit e deploy | PASSOU | Log do deploy Git registra o clone do SHA auditado. |
| DL05 | MSW, Socket.IO, compra, deep links e refresh no deploy | PASSOU | Playwright público valida MSW, Socket.IO, rotas, refresh, checkout e recuperação. |
| DL06 | Setup, env, credenciais, cenários e testes no README | PASSOU | README documenta setup, fixtures, reset, testes, Lighthouse e publicação. |
| DL07 | Arquitetura, contratos, eventos, decisões e limitações | PASSOU | Arquitetura atualizada, controles REST e eventos documentados, com limitações. |
| DL08 | Execução de checkout limpo sem backend privado | PASSOU | Clone limpo com npm ci/build e execução dos fluxos no deploy sem backend privado. |

## Limitações registradas

- A comparação de fidelidade usa o material disponível do Figma e os anexos. Há artes provisórias em parte do catálogo.
- As baselines foram geradas em Chromium no Windows. O zoom nativo foi verificado nas telas de início e detalhe. A cobertura manual com tecnologia assistiva permanece parcial.
- A auditoria de dependências de desenvolvimento apontou 10 avisos moderados associados à árvore do lint, via minimatch. A consulta das dependências de produção não apontou ocorrências.
- A matriz preserva lacunas específicas de cobertura. Os testes de checkout exercitam cupom, cotação obsoleta e mudanças de preço/estoque, mas não isolam todas as combinações de revalidação ou todos os eventos tardios de uma sessão antiga.

## Veredito

**Publicada e validada em produção. Aceite integral dos 107 requisitos ainda pendente.** O deploy, os fluxos principais, as baselines e as metas Lighthouse passaram. Permanecem ressalvas de fidelidade, acessibilidade manual e cobertura de estados específicos.

**Pontuação estimada de reavaliação: 88/100.** Fidelidade 15/20, fluxos 18/20, integração 14/15, tempo real 9/10, mocks 9/10, testes 9/10, acessibilidade 4/5, performance 5/5 e documentação 5/5.

## Revisão da seção 12 em 09/11/2026

A entrega inclui fonte, lockfile, assets, worker MSW, fixtures, testes, baselines e configuração Lighthouse. README ampliado com variáveis opcionais, comandos e exemplos executáveis de todos os controles de falha. ARCHITECTURE reescrito conforme o código atual, incluindo sessão de uma hora, persistência, cache, transações, idempotência, reconciliação e desvios de UX/Figma. Contratos atualizados para criadores e retorno de favoritos.

Validação em clone local novo, sem node_modules, .env.local ou .vercel: npm ci, typecheck e lint aprovados. Build otimizado executado pelo Playwright e Lighthouse. Foram acrescentados testes de entrada direta e refresh em detalhe, carrinho e checkout protegido, em desktop e mobile.

Limitação identificada pelo npm audit: 10 alertas moderados na cadeia de desenvolvimento ESLint/typescript-eslint, derivados de minimatch. npm audit --omit=dev retornou zero vulnerabilidades. O ajuste sugerido automaticamente envolve downgrade de versões principais das ferramentas e não foi aplicado como correção automática. Os mocks não dependem dessas ferramentas no navegador. Essa pendência deve ser revisada em manutenção de dependências.

Resultados desta revisão: 56 testes Playwright aprovados e 2 skips intencionais por viewport no checkout limpo. Em produção, 26 testes de fundação/checkout aprovados em desktop e mobile, incluindo REST interceptado pelo worker, eventos Socket.IO, reconexão, refresh, compra, idempotência e recuperação de timeout. Deploy dpl_42NuPmsYsXwfeUgQ85NFDQAukARx em estado READY, alias https://marketplace-de-nft.vercel.app. Os 13 assets JS/CSS referenciados no HTML e o mockServiceWorker.js tiveram SHA-256 idêntico ao build do clone limpo. Código e documentação publicados em a966a94, com evidências adicionais no commit subsequente.

Lighthouse executado em 12 rodadas: medianas de desempenho 88/90 para início/detalhe mobile e 99/99 desktop. Acessibilidade, boas práticas e SEO 100 nos quatro grupos. O comando retornou 1 porque a home mobile ficou abaixo da meta 90. Resumo em audit/delivery-section12/lighthouse-summary.json. As demais verificações da seção 12 passaram, mas a meta de performance não está aprovada nesta rodada.

A repetição isolada da home mobile, sem testes concorrentes, registrou 89, 90 e 90, com mediana 90. A diferença entre rodadas indica que a página opera perto do limite. O resultado da execução completa foi preservado.
