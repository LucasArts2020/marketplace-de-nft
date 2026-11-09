# Auditoria final de entrega — Kurio NFT Marketplace

Este documento preserva a auditoria inicial. A revalidação da publicação e as mudanças na matriz estão no [relatório de entrega](FINAL_DELIVERY_REPORT.md).

## A. Resumo executivo

**Veredito: NÃO PRONTO PARA ENTREGA.** A compra simulada, o catálogo, a conta e o transporte Socket.IO funcionaram no preview. Há requisitos obrigatórios de entrega em aberto: repositório e deploy públicos, baselines visuais e metas Lighthouse. A auditoria usou o README original anexado como critério, as capturas fornecidas como referência visual e a árvore local como objeto de teste. Nenhum código da aplicação foi alterado.

**Placar e totais:** 77/100 estimados. 107 requisitos auditados, com 71 aprovados, 7 falhos, 25 parciais e 4 não verificados.

**Eliminatórios (§11):** o uso efetivo de React, TypeScript, Router, Query, Axios, REST, Socket.IO, Tailwind, MSW, Playwright e Lighthouse foi observado. O Lighthouse precisou ser invocado externamente, porque o projeto não disponibiliza comando nem configuração. O Button local aplica a composição típica do shadcn/ui e é usado em produção, mas a origem canônica e a extensão da adoção ficaram sem evidência suficiente. Nenhuma ocorrência de fluxos principais apenas visuais, confirmação sem resposta de API, vazamento entre contas nas operações verificadas, atalhos de socket por setters ou ausência de E2E foi encontrada. A falta de um destino público verificável e de uma revisão Git é um bloqueio de entrega obrigatório do §12, separado das seis condições eliminatórias do §11.

## B. Matriz completa

**Leitura.** Cada linha tem um dos estados **PASSOU**, **FALHOU**, **PARCIAL** ou **NÃO VERIFICADO**. Aprovações de runtime são restritas ao build local. Em arquivos, `src/` é omitido para concisão. `C` = catalog.spec, `D` = cart.spec, `P` = checkout.spec, `A` = account.spec, `F` = foundation.spec, `R` = responsive.spec, todos em `tests/`. `S` = sondagem Chromium adicional descrita em D. `LH` = relatórios de E. Correções e impacto são proporcionais ao escopo de cada verificação.

| ID | Requisito original | Status | Arquivos | Evidência e procedimento | Impacto | Correção recomendada |
|---|---|---|---|---|---|---|
| ST01 | React | PASSOU | main.tsx | createRoot e interação nas nove telas, R | Stack | — |
| ST02 | TypeScript | PASSOU | tsconfig.json, contracts/ | tsc sem emissão, contratos usados na API | Stack | — |
| ST03 | TanStack Router | PASSOU | main.tsx | C valida URLs, histórico e detalhe direto. A valida retorno autenticado | Stack | — |
| ST04 | TanStack Query | PASSOU | commerce/, catalog/, socket/realtime.tsx | C cancela consulta, A executa rollback, P observa atualização de cache | Stack | — |
| ST05 | Axios | PASSOU | api/http.ts, api/ | Timeout real em P e requisições MSW em F | Stack | — |
| ST06 | REST APIs | PASSOU | api/, mocks/ | F exige resposta de service worker, P observa POST e GET | Stack | — |
| ST07 | Socket.IO | PASSOU | socket/realtime.tsx, mocks/socket.ts | Cliente io, binding ws.link e tráfego durante F/P | Stack | — |
| ST08 | Tailwind CSS | PASSOU | vite.config.ts, styles.css | Plugin Tailwind no build, classes e breakpoints observados em R | Stack | — |
| ST09 | shadcn/ui | PARCIAL | components/ui/button.tsx | Button local com Slot, CVA e merge usado nas telas. Só o padrão Button foi localizado, sem components.json ou registro da origem | Risco de interpretação da stack | Documentar proveniência e demonstrar os componentes adotados |
| ST10 | MSW | PASSOU | main.tsx, mocks/browser.ts, public/mockServiceWorker.js | F comprova service worker no build | Stack | — |
| ST11 | Playwright | PASSOU | playwright.config.ts, tests/ | 42 testes passaram nos dois projetos | Stack | — |
| ST12 | Lighthouse | PARCIAL | package.json, audit/lighthouse/ | Ferramenta executada nesta auditoria. Comando da solução ausente | Stack e reprodução | Versionar comando e configuração |
| UI01 | Início com destaques e navegação ao NFT | PASSOU | catalog/catalog-page.tsx | R/C mostram hero, resultados, navegação e miniaturas | Descoberta | — |
| UI02 | Detalhe com galeria e informações | PASSOU | catalog/nft-page.tsx | C troca miniatura, abre zoom, fecha com Escape e abre avaliações | Descoberta | — |
| UI03 | Carrinho com resumo | PASSOU | commerce/cart-page.tsx | D altera itens, aplica cupom e observa totais | Compra | — |
| UI04 | Pagamento com dados, carteira, rede, revisão e envio | PASSOU | commerce/checkout-page.tsx, contracts/checkout.ts | P e R completam, P seleciona Polygon, A seleciona secundária | Compra | — |
| UI05 | Confirmação com ID, itens, taxas e total | PASSOU | commerce/confirmed-receipt.tsx | P verifica referência SIM e total; R captura recibo; S confirma snapshot | Compra | — |
| UI06 | Login com validação e retorno | PASSOU | commerce/account.tsx, main.tsx | A e R autenticam e retornam à rota; modal desktop e rota mobile | Sessão | — |
| UI07 | Cadastro validado e conflito | PASSOU | commerce/account.tsx, mocks/commerce.ts | A provoca duplicidade e cadastra outro usuário | Conta | — |
| UI08 | Perfil, avatar e senha | PASSOU | commerce/profile-page.tsx | A edita dados, carrega avatar, rejeita senha atual errada e troca a senha | Conta | — |
| UI09 | Carteira principal e secundária | PASSOU | commerce/wallets-page.tsx | A rejeita endereço inválido, cadastra, recarrega e edita a secundária | Conta | — |
| UI10 | Ações auxiliares coerentes e referências simuladas | PARCIAL | catalog/home-editorial.tsx, commerce/account.tsx, commerce/confirmed-receipt.tsx | Opções sociais/newsletter desabilitadas por inspeção e captura, recibo oferece cópia de ID. Auditoria de todos os links auxiliares não concluída | UX | Inventariar estados desabilitados e testar links remanescentes |
| CAT01 | Busca | PASSOU | catalog/header-search.tsx, api/catalog.ts | C observa resultado de Emerald e busca vazia | Descoberta | — |
| CAT02 | Filtros combináveis | PASSOU | catalog/catalog-page.tsx, mocks/catalog.ts | C verifica categoria e coleção na requisição MSW e usa rede/faixa | Descoberta | — |
| CAT03 | Ordenação e paginação | PASSOU | contracts/catalog.ts, catalog/catalog-page.tsx | C valida página 2 e ordem por preço | Descoberta | — |
| CAT04 | URL, refresh, histórico e reinício de página | PASSOU | main.tsx, contracts/catalog.ts | C usa back/forward e refresh, confirma retirada de page ao filtrar | Estado | — |
| CAT05 | Vazio, erro e respostas obsoletas | PASSOU | catalog/catalog-page.tsx, mocks/catalog.ts | C cancela Emerald lento, exibe Sage e recupera 503; busca inexistente | Robustez | — |
| CAT06 | Acesso direto e NFT inexistente | PASSOU | main.tsx, catalog/nft-page.tsx | C abre ID direto e observa 404 | Navegação | — |
| CAT07 | Edição indisponível e limite de quantidade | PASSOU | catalog/nft-page.tsx, mocks/commerce.ts | C bloqueia aumento e edição esgotada; D valida estoque | Compra | — |
| CAT08 | Favorito autenticado e persistente | PASSOU | commerce/favorites.tsx, mocks/commerce.ts | A autentica, recarrega, reverte falha e troca de conta | Conta | — |
| CAR01 | Inclusão, edição, remoção e disponibilidade | PASSOU | commerce/use-cart.ts, mocks/commerce.ts | D executa ações, valida limites e conflito de merge | Compra | — |
| CAR02 | Persistência e preservação do visitante após login | PASSOU | commerce/session.tsx, mocks/commerce-store.ts | D verifica merge único, conflito sem perda e reload | Compra | — |
| CAR03 | Aplicar/remover cupom, inválido e expirado | PASSOU | commerce/cart-page.tsx, mocks/commerce.ts | D observa erros e remoção | Compra | — |
| CAR04 | Subtotal, desconto, taxa, total e ETH decimal | PASSOU | contracts/eth.ts, mocks/commerce.ts | BigInt em wei; D verifica 2.396 ETH, 2.158 ETH e 3.229 ETH | Precisão | — |
| CAR05 | Atualização com preço e estoque durante uso | PASSOU | commerce/cart-page.tsx, socket/realtime.tsx | P muda preço para 2.34, total 2.356 e estoque a zero | Tempo real | — |
| PAY01 | Validação dos campos do layout | PARCIAL | contracts/checkout.ts, commerce/checkout-page.tsx | Formulário e parser em uso, R preenche fluxo. Nem todas as entradas inválidas foram exercitadas e erros da API são globais | UX e validação | Testar campos obrigatórios e formatos separadamente |
| PAY02 | Conexão, recusa e desconexão de carteira | PASSOU | commerce/checkout-page.tsx, mocks/commerce.ts | P usa connection-refused, conecta, desconecta e revisa | Compra | — |
| PAY03 | Revalidar preço, disponibilidade, cupom e taxa | PARCIAL | mocks/commerce.ts, commerce/checkout-page.tsx | P invalida revisão por preço, estoque, mudança no carrinho; handler compara cupom, taxa, rede e expiração. Corridas de cupom/taxa não exercitadas | Integridade | Acrescentar testes independentes de cupom, taxa e expiração |
| PAY04 | Nova aprovação após alteração | PASSOU | commerce/checkout-page.tsx | P desabilita confirmação, força revisão e observa novo total | Compra | — |
| PAY05 | Clique repetido, mesma chave e conflito com corpo distinto | PASSOU | commerce/checkout-page.tsx, mocks/commerce.ts | P faz dblclick e replay/409. S contou um POST e dois replays 200 com mesmo ID | Idempotência | — |
| PAY06 | Timeout após criação e recuperação | PASSOU | commerce/checkout-page.tsx, mocks/commerce.ts | P atinge 10 s após gravação, recarrega e recupera por GET com um POST | Idempotência | — |
| PAY07 | Timeout anterior à criação e reenvio | NÃO VERIFICADO | commerce/checkout-page.tsx, mocks/commerce.ts | Existe GET 404 seguido de POST com a mesma chave; cenário nativo encontrado só para timeout pós-commit | Recuperação | Reproduzir falha pré-commit e contar pedidos/chaves |
| PAY08 | Pedido pendente após refresh e desconexão | PASSOU | commerce/checkout-page.tsx, mocks/commerce.ts | P observa pendência, recarrega e recupera; queda usa REST sem novo POST | Compra | — |
| PAY09 | Pedido confirmado ou recusado e terminalidade | PARCIAL | mocks/commerce.ts, commerce/checkout-page.tsx | P observa os três estados, recusa preserva itens, replay confirmado e guarda terminal no settle. Não foi verificado replay terminal recusado | Integridade | Testar reenvio e eventos atrasados para recusado |
| PAY10 | Confirmação somente após API simulada | PASSOU | commerce/checkout-page.tsx | P observa pendente antes de confirmação e ausência de recibo na recusa | Eliminatório | — |
| PAY11 | Snapshot imutável do recibo | PASSOU | mocks/commerce.ts, commerce/confirmed-receipt.tsx | S comparou JSON completo do pedido antes/depois de alterar preço | Integridade | — |
| PAY12 | Preservar itens em falhas e remover apenas comprados | PARCIAL | mocks/commerce.ts | P verifica recusa preservando e carrinho vazio após compra. Atualização seletiva em settle, sem execução dedicada com outros itens mantidos | Integridade | Exercitar itens adicionados após o snapshot |
| SES01 | Cadastro, login, logout e refresh de sessão | PASSOU | commerce/session.tsx, mocks/commerce.ts | A, D e P autenticam, recarregam, fazem logout e alternam usuário | Sessão | — |
| SES02 | Proteção das rotas privadas | PASSOU | main.tsx, commerce/checkout-page.tsx, mocks/commerce.ts | P/A verificam redirecionamento por ação de login e pedido isolado. S confirma 401 em sessão/perfil/carteiras/favoritos/pedido | Segurança | — |
| SES03 | Expiração e retomada de contexto | PASSOU | commerce/session.tsx, commerce/account-data.ts, checkout-page.tsx | A expira token, troca conta e recupera o rascunho do proprietário | Sessão | — |
| SES04 | Limpar cache privado e subscriptions | PARCIAL | commerce/session.tsx, socket/realtime.tsx, mocks/socket.ts | D/A/P verificam isolamento de dados, código cancela e remove listeners; teste de evento atrasado da sessão anterior ausente | Segurança | Verificar socket antigo e cache por geração após logout |
| SES05 | Senhas fictícias e persistência sem texto puro | PASSOU | mocks/commerce.ts, mocks/commerce-store.ts, README.md | Hash SHA-256 com salt persiste em StoredAccount; credenciais do README são fixtures | Segurança da demo | — |
| INT01 | Contratos tipados e erros REST documentados | PASSOU | contracts/, api/, docs/CONTRATOS.md | Typecheck e testes observam 401/404/409/422/503 conforme operação | Arquitetura | — |
| INT02 | Loading, vazio, erro, sucesso e atualização em background | PARCIAL | catalog/catalog-page.tsx, commerce/ | C/D/P/A exercitam estados críticos; cobertura de erros/vazios em todas as nove telas incompleta | Resiliência | Adicionar tabela de estados por rota e injeções dedicadas |
| INT03 | Invalidação, cancelamento e rollback | PASSOU | socket/realtime.tsx, commerce/favorites.tsx | C cancela HTTP obsoleto, A verifica rollback, P confirma reconciliação | Estado | — |
| INT04 | Isolamento por usuário e parâmetros | PASSOU | commerce/account-data.ts, catalog/catalog-page.tsx, mocks/commerce.ts | C testa chave por parâmetros, A/D/P isolam favoritos/carrinho/rascunho/pedido | Eliminatório | — |
| INT05 | Rota desconhecida e deep links de todas as telas | PARCIAL | main.tsx, playwright.config.ts | Deep links de detalhe, conta e pedido exercitados no preview. Fallback genérico existe; deploy e todas as rotas diretas ainda não verificados | Navegação | Smoke por rota e 404 no ambiente público |
| INT06 | Política de cache, retries e sincronização | PASSOU | ARCHITECTURE.md, docs/CONTRATOS.md | Documentação e inspeção de query keys, cancelamento e invalidação | Arquitetura | — |
| MSW01 | Rede como fonte única de negócio em desenvolvimento/demo/testes | PASSOU | main.tsx, api/, mocks/, .env.demo, .env.development | F observa MSW; S não detectou origem HTTP externa na compra auditada | Eliminatório | — |
| MSW02 | Fixtures suficientes, dois usuários, preços e imagens válidos | PASSOU | mocks/catalog-state.ts, mocks/commerce.ts | S consultou 16 NFTs, 16 IDs distintos, 16 preços válidos e 16 imagens decodificadas; A/D usam Ana e Bia. 500 NFTs não são requisito | Mocking | — |
| MSW03 | Persistência e reset integral | PARCIAL | mocks/commerce-store.ts, README.md | Reload mantém estado em D/A/P. Reset documentado por limpeza manual da origem; falta procedimento automatizado de reset do cenário completo | Reprodução | Automatizar reset e validar retorno de contas, catálogo e pedidos ao estado inicial |
| MSW04 | Latência variável, fora de ordem, HTTP 4xx/5xx | PASSOU | mocks/catalog.ts, mocks/commerce.ts | C observa atraso de 1200/80 ms, cancelamento e 503; A/D/P observam 4xx | Robustez | — |
| MSW05 | Indisponibilidade de conexão HTTP simulável | PARCIAL | mocks/socket.ts, mocks/commerce.ts | Queda do socket e recusa de carteira têm controles distintos; não foi encontrado cenário de falha de rede REST antes do processamento | Robustez | Adicionar cenário MSW de falha de transporte e retry |
| MSW06 | Sessão expirada, conflito, cupom, esgotamento e pagamentos | PASSOU | mocks/commerce.ts, mocks/market.ts | A/D/P executam controles e respostas reais de handlers | Mocking | — |
| RT01 | nft.updated atualiza catálogo, detalhe e carrinho | PARCIAL | socket/realtime.tsx, mocks/socket.ts | F observa socket real e P valida efeito em carrinho e checkout. Invalidação de catálogo/detalhe existe; atualização visual simultânea nessas telas não executada | Tempo real | Assert de preço e estoque nas três telas |
| RT02 | order.updated confirma ou recusa, com identidade e versão | PASSOU | contracts/realtime.ts, mocks/commerce.ts, socket/realtime.tsx | P observa confirmação conectada antes do fallback de 5 s e recusa. IDs incluem recurso e versão | Tempo real | — |
| RT03 | Duplicatas e eventos antigos | PARCIAL | socket/realtime.tsx, tests/checkout.spec.ts | P dispara replay/older de NFT e checa revisão habilitada. Falta exercitar eventos obsoletos de pedido e assert explícito de descarte | Tempo real | Cobrir ambos os eventos e provar ausência de efeitos duplicados |
| RT04 | Reconciliação REST e pedido pendente | PASSOU | socket/realtime.tsx, commerce/checkout-page.tsx | P atualiza total após reconectar, recupera pedido durante queda e mantém um POST | Tempo real | — |
| RT05 | Limpeza de listeners e isolamento de sessão | PARCIAL | socket/realtime.tsx, mocks/socket.ts | Cleanup e filtro por autor inspecionados, sem teste direto do socket anterior após troca | Segurança | Testar concorrência de sessões e subscriptions encerradas |
| UX01 | Fidelidade de tipografia, paleta, imagem, proporção e composição | PARCIAL | styles.css, public/art/, docs/FIGMA.md | Comparação com capturas anexadas e relatório R. Roboto Mono e paleta coerentes; variantes vetoriais, ícones sociais ausentes e checkout mobile mais longo. Link original do Figma não abriu nesta auditoria | Até 20 pontos | Fechar diferenças documentadas e validar frames restantes |
| UX02 | 390, 768 e 1440 px, alinhamento e overflow | PASSOU | styles.css, tests/responsive.spec.ts | R valida viewport, imagens, fonte, navegação e scrollWidth durante o fluxo | Layout | — |
| UX03 | Hover sem sobreposição, zoom sem perda | NÃO VERIFICADO | styles.css, catalog/catalog-page.tsx | Hover da busca e zoom da galeria testados; comparação completa de hover dos cards e zoom do navegador não executada | Acessibilidade | Testar cards em hover e zoom de 200%/400% |
| UX04 | Skeletons e shimmer em catálogo, detalhe e cotação | PARCIAL | catalog/loading.tsx, commerce/cart-page.tsx, styles.css | C exercita loading lento de catálogo, componentes de detalhe/resumo presentes; LH encontra deslocamento elevado no detalhe mobile | UX e CLS | Ajustar geometria e testar loading lento das três áreas |
| UX05 | Movimento reduzido | PARCIAL | styles.css | CSS restringe shimmer a no-preference e remove transições da busca; não houve execução com preferência emulada | Acessibilidade | Emular reducedMotion e conferir animação computada |
| UX06 | Teclado, foco visível e diálogos | PARCIAL | styles.css, commerce/account.tsx, catalog/nft-page.tsx | R valida skip link, A e C verificam retorno de foco. Fluxo completo só com teclado e foco do recibo não verificados | Acessibilidade | Cobrir Tab, Shift+Tab, Escape, modais e checkout |
| UX07 | Labels e erros associados aos campos | FALHOU | commerce/account.tsx, profile-page.tsx, wallets-page.tsx, catalog/nft-page.tsx | Labels visíveis e alerts globais, mas ausência de aria-describedby/aria-invalid nos erros de campo. LH detecta nome divergente no botão Comprar NFT e no Carrinho | Acessibilidade | Associar erros, preservar texto visível no nome acessível |
| UX08 | Alt, contraste e feedback sem depender de cor | PARCIAL | public/art/, styles.css, commerce/, catalog/ | Imagens principais têm alt, P/A observam feedback textual. Lighthouse só cobre início/detalhe; contraste de todos os estados e telas não verificado | Acessibilidade | Testar contraste e textos alternativos por tela e estado |
| UX09 | Compra e toque no mobile | PARCIAL | catalog/nft-page.tsx, catalog/home-editorial.tsx | P/R compram no mobile. Lighthouse encontra alvos pequenos no rodapé, e CTA no detalhe exige rolagem em alguns tamanhos | UX | Aumentar áreas acionáveis e rever altura até a compra |
| T01 | E2E 1: busca, filtros, ordenação, paginação, histórico | PASSOU | tests/catalog.spec.ts | C aprovado nos dois projetos | Testes | — |
| T02 | E2E 2: detalhe direto e inexistente | PASSOU | tests/catalog.spec.ts | C aprovado nos dois projetos | Testes | — |
| T03 | E2E 3: cadastro, login, expiração, logout, troca | PASSOU | tests/account.spec.ts | A aprovado nos dois projetos | Testes | — |
| T04 | E2E 4: favoritos, falha e rollback | PASSOU | tests/account.spec.ts | A aprovado nos dois projetos | Testes | — |
| T05 | E2E 5: carrinho, cupom, refresh/login | PASSOU | tests/cart.spec.ts | D aprovado nos dois projetos | Testes | — |
| T06 | E2E 6: compra completa | PASSOU | tests/checkout.spec.ts, tests/responsive.spec.ts | P/R aprovados nos dois projetos | Testes | — |
| T07 | E2E 7: falha, clique repetido e timeout | PASSOU | tests/checkout.spec.ts | P cobre recusa, dblclick, conflito e timeout pós-commit | Testes | — |
| T08 | E2E 8: perfil, avatar, senha, carteiras e erros | PASSOU | tests/account.spec.ts | A aprovado nos dois projetos | Testes | — |
| T09 | E2E 9: preço/disponibilidade via Socket.IO | PASSOU | tests/checkout.spec.ts | P usa controle de cenário e recebe pelo cliente real | Testes | — |
| T10 | E2E 10: duplicatas/antigos, queda e retomada | PASSOU | tests/checkout.spec.ts | P dispara replay/older de NFT, desconecta, reconcilia e recupera pedido | Testes | — |
| T11 | E2E 11: teclado, foco e formulários | PASSOU | tests/responsive.spec.ts, tests/account.spec.ts, tests/catalog.spec.ts | R, A e C cobrem skip, Escape, foco e erros de formulário | Testes | — |
| T12 | E2E 12: skeleton lento, falha e retry | PASSOU | tests/catalog.spec.ts | C observa carregamento, cancela consulta obsoleta, injeta 503 e retenta | Testes | — |
| T13 | Contextos isolados, controle de relógio e eventos | PARCIAL | playwright.config.ts, tests/checkout.spec.ts, mocks/commerce.ts | Contextos Playwright separados, comandos para eventos/latência. Sem page.clock ou relógio injetável, pedido e expiração usam tempo real | Reprodutibilidade | Injetar relógio nos cenários de tempo sem esconder integração |
| T14 | Baselines visuais versionadas das quatro telas | FALHOU | tests/responsive.spec.ts, playwright.config.ts | Capturas anexadas, sem toHaveScreenshot, arquivos de referência ou Git utilizável | Regressão | Gerar snapshots estáveis e comitá-los |
| T15 | Relatório HTML e traces em falhas | PASSOU | playwright.config.ts, playwright-report/index.html | Relatório novo existe. retain-on-failure configurado; nenhuma falha da suíte nesta execução, portanto nenhum trace de falha novo | Evidência | — |
| LH01 | 12 auditorias, relatórios HTML/JSON e métricas | PASSOU | audit/lighthouse/ | 12 execuções válidas, 12 HTML e 12 JSON, métricas e ambiente na seção E | Performance | Incorporar a reprodução ao projeto |
| LH02 | Performance ≥90 em 4 grupos | FALHOU | audit/lighthouse/ | Medianas da seção E | Performance | Corrigir descoberta/render da arte e CLS |
| LH03 | Accessibility ≥95 em 4 grupos | PASSOU | audit/lighthouse/ | Medianas da seção E | Acessibilidade | Corrigir nomes e alvos mesmo quando a meta numérica passa |
| LH04 | Best Practices ≥95 em 4 grupos | PASSOU | audit/lighthouse/ | Medianas da seção E | Qualidade | Corrigir favicon e avisos observados |
| LH05 | SEO ≥90 em 4 grupos | FALHOU | audit/lighthouse/, index.html, public/ | Medianas da seção E. Meta description ausente e robots.txt respondendo HTML no preview | SEO | Adicionar descrição e robots.txt válido |
| LH06 | Comando e configuração de auditoria entregues no projeto | FALHOU | package.json, README.md | Inspeção do manifesto e arquivos. A execução desta auditoria foi avulsa | Reprodução | Versionar comando, presets e condições |
| DL01 | Repositório Git público e revisão entregue | FALHOU | .git/, README.md | git rev-parse HEAD falha, git remote -v e git ls-files vazios | Bloqueio de entrega | Criar revisão e publicar URL acessível |
| DL02 | Código, lockfile, assets, mocks, fixtures, testes | PASSOU | src/, public/, tests/, package-lock.json | Cópia limpa dos arquivos locais e npm ci/build aprovados | Reprodução | — |
| DL03 | URL pública funcional com HTTPS | FALHOU | README.md | Nenhuma URL de aplicação entregue ou encontrada. A existência de publicação externa não foi inferida | Bloqueio de entrega | Publicar e documentar a URL |
| DL04 | Correspondência de commit e deploy | NÃO VERIFICADO | .git/, README.md | Sem commit e sem URL para cruzar | Integridade da entrega | Registrar SHA no deploy e conferir com o repositório |
| DL05 | MSW, Socket.IO, compra, deep links e refresh no deploy | NÃO VERIFICADO | main.tsx, public/mockServiceWorker.js | Preview local funciona. Versão pública indisponível para auditoria | Bloqueio de aceite | Smoke pós-deploy em HTTPS, incluindo conta, compra e reconexão |
| DL06 | Setup, env, credenciais, cenários e testes no README | PARCIAL | README.md, .env.example | Setup e credenciais presentes; reset manual, ausência do comando Lighthouse e links de entrega | Documentação | Atualizar instruções e exemplos completos |
| DL07 | Arquitetura, contratos, eventos, decisões e limitações | PARCIAL | ARCHITECTURE.md, docs/CONTRATOS.md, docs/FIGMA.md | Contratos e eventos documentados. Trechos ainda descrevem etapas antigas como futuras e desvios visuais estão espalhados | Documentação | Consolidar comportamento comprovado e limitações atuais |
| DL08 | Execução de checkout limpo sem backend privado | PARCIAL | package-lock.json, .env.demo, README.md | Instalação e build em cópia limpa, sem checkout de commit disponível. S não observou requisição externa na compra | Reprodução | Repetir npm ci, build e E2E de clone público |

### Parecer por tela

| Tela | Resultado funcional no preview | Comparação visual e lacunas |
|---|---|---|
| Início | Busca, filtros, paginação e falhas MSW confirmadas. Navegação sem salto ao mudar aba/ordem. | Paleta, hero e grade de duas colunas mobile presentes. Hero usa composição mais simples que o frame e algumas artes são provisórias. Lighthouse identifica alvos e rótulo do carrinho. |
| Detalhe | Acesso direto, NFT inexistente, galeria, zoom, estoque, favoritos e inclusão no carrinho confirmados. | Miniaturas e arte correspondem à composição geral. No mobile, miniaturas adicionais ocupam altura e o CTA pode ficar abaixo da primeira dobra. CLS elevado e nome acessível divergente. |
| Carrinho | Alterações, remoção, vazio, cupom inválido/expirado, persistência e totais confirmados. | Resumo e lista adaptados às duas larguras. Captura demonstra a hierarquia mobile. Falta baseline e teste específico da geometria do skeleton. |
| Pagamento | Dados, escolha de carteira/rede, revisão, recusa, recuperação, cotação obsoleta e confirmação verificados. | Desktop tem formulário e resumo lado a lado. Mobile mostra seleção e campos em sequência, com mais etapas visíveis que o frame. Erros da API não apontam todos os campos e estados sem carteira/falha inicial não foram exercitados separadamente. |
| Confirmação | Recibo só após confirmação REST, snapshot persistente, queda e retomada testados. | Composição em modal e totais coerentes. A arte do envelope e a ação de copiar referência simulada diferem da referência visual. O foco no recibo e a cópia em si não foram exercitados nesta auditoria. |
| Login | Autenticação, retorno, sessão expirada, modal desktop e página mobile exercitados. | Telas com marca, senha e alternativas indisponíveis. Ícones sociais e detalhes tipográficos divergem. Feedback de erro global. |
| Cadastro | Conflito, conta criada e retorno confirmados. | Modal e tela inteira seguem a hierarquia geral, com diferenças nos controles auxiliares. Falta cobertura de todas as combinações de senha/formato e associação de erros aos campos. |
| Perfil | Edição, avatar e persistência, senha atual inválida e troca bem-sucedida confirmados. | Menu e formulário próximos da referência, com ações separadas de perfil e senha. Mobile adapta a uma coluna. Falha de consulta e remoção de avatar não exercitadas em isolamento. |
| Carteiras | Validação de endereço, edição e persistência de principal e secundária, uso no checkout confirmados. | Menu, formulário em duas colunas e estado vazio secundário visíveis no desktop. A opção de reaproveitar a principal preenche campos para revisão. Não foi reproduzida falha de carregamento de carteiras. |

## C. Problemas priorizados

| Prioridade | Problema | Evidência |
|---|---|---|
| P0 — bloqueio obrigatório de entrega | Não há revisão nem URL pública entregues | Git sem HEAD e remoto, README sem endereço. A validação de equivalência, HTTPS, refresh, MSW e Socket.IO público fica bloqueada. |
| P1 | Metas de Performance mobile e SEO falham | Performance 87 no início mobile e 73 no detalhe mobile. SEO 83 nos quatro grupos. |
| P1 | Regressão visual obrigatória ausente | Os anexos de captura documentam a execução, mas não comparam com imagens aprovadas. |
| P1 | Auditoria Lighthouse indisponível pelos comandos da solução | A execução foi externa e a configuração ainda precisa integrar a entrega. |
| P1 | Erros de formulário sem associação ao campo | Formulários mostram alertas globais. LH também registra divergência entre rótulo visível e nome acessível. |
| P2 | Reprodução incompleta de falhas e controle de tempo | Reset manual, timeout pré-commit não comprovado e timers reais em testes sensíveis. |
| P2 | Fidelidade visual e controles incompletamente auditados | Assets provisórios, composição auxiliar divergente e acesso ao Figma original indisponível nesta execução. |
| P2 | Dependências e peso inicial | npm ci reportou 10 ocorrências moderadas, sem triagem de explorabilidade. Build reportou chunk principal de 516,16 kB minificado e 159,98 kB gzip. |
| P3 | Favicon ausente | 404 registrado pelo Lighthouse; Best Practices ainda supera a meta. |

## D. Resultados dos testes

| Comando ou procedimento | Resultado |
|---|---|
| `npm.cmd run typecheck` e `npm.cmd run lint` | Ambos passaram. |
| `npm.cmd run test:e2e -- --workers=4` | **42 passaram, 2 ignorados por perfil, 0 falhas**, em cerca de 1,5 min. Build de demonstração e preview iniciados pela configuração do Playwright. O teste de modal é desktop e o de tela inteira é mobile. [Relatório HTML e capturas](playwright-report/index.html). |
| `npm.cmd ci` e `npm.cmd run build` em pasta temporária | Passaram em cópia sem node_modules usando os arquivos locais não ignorados pelo Git. Como a origem não tem commit, o procedimento não equivale a clonar a revisão pública. O build gerou dist e aviso de tamanho de chunk. |
| Sondagem S, Chromium isolado via Playwright, preview 4183 | Abriu Emerald Ape, consultou todas as páginas de NFTs pelo navegador controlado pelo MSW e decodificou as 16 imagens. Verificou 401 sem token em sessão, perfil, carteiras, favoritos e pedido. Fez compra por clique duplo, contou 1 POST da UI, repetiu em paralelo o POST com o corpo/chave capturados e obteve 200 com o mesmo ID. Após mudar o preço para 9.81 ETH via controle Socket.IO, o JSON do pedido confirmado continuou idêntico. Nenhuma origem HTTP externa foi registrada nesse fluxo. |

Os grupos T01–T12 foram exercitados pela suíte, com as lacunas de granularidade descritas separadamente na matriz. Não foram gerados traces de falha do Playwright porque a execução passou. A tentativa inicial de orquestrar o preview em segundo plano foi bloqueada pela política do shell. O preview foi iniciado em sessão própria e as 12 auditorias concluíram normalmente.

## E. Lighthouse

| Página | Perfil | Performance ≥90 | Accessibility ≥95 | Best Practices ≥95 | SEO ≥90 | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Início | Mobile | **87** | 97 | 96 | **83** | 3.872 | 0,00007 | 106 |
| Início | Desktop | 99 | 97 | 96 | **83** | 886 | 0,02642 | 0 |
| Detalhe | Mobile | **73** | 97 | 96 | **83** | 3.432 | 0,40345 | 47 |
| Detalhe | Desktop | 96 | 97 | 96 | **83** | 899 | 0,11490 | 0 |

Cada célula representa a mediana independente de três rodadas. LCP e TBT estão em milissegundos. CLS não tem unidade. Os arquivos têm nomes como [início mobile HTML](audit/lighthouse/inicio-mobile-1.report.html) e [detalhe mobile JSON](audit/lighthouse/detalhe-mobile-1.report.json). As 12 execuções terminaram sem runtimeError e cada uma gerou HTML e JSON.

**Ambiente.** Windows NT 10.0.26200, Ryzen 5 5600G com 12 processadores lógicos, Node 24.22.0, npm 11.19.1, Playwright 1.65.0, Lighthouse 13.6.0 e Edge Chromium 157.0.4341.42 em headless. Vite 8.3.6, build otimizado demo, preview HTTP local. Presets padrão mobile e desktop, throttling simulado, perfis limpos a cada chamada, sequência alternada, fixtures padrão e sem adaptação no código auditado.

**Reprodução.** Rode `npm.cmd run build` e `npm.cmd run preview -- --host 127.0.0.1 --port 4183 --strictPort`. Em outra sessão configure CHROME_PATH com o caminho do navegador Chromium. Execute o comando abaixo para cada uma das duas rotas e cada perfil, três vezes, alterando o nome de saída. Para desktop acrescente `--preset=desktop`.

```powershell
npm.cmd exec --yes --package=lighthouse@13.6.0 -- lighthouse http://127.0.0.1:4183/nfts/emerald-ape-042 '--chrome-flags=--headless --no-first-run --no-default-browser-check' --output=json --output=html --output-path=./audit/lighthouse/detalhe-mobile-1 --quiet
```

**Causas observadas.** No início mobile, a LCP mediana de 3.872 ms coincide com a composição do hero. O relatório identifica atraso na descoberta do recurso, compatível com renderização após bootstrap de módulos e MSW. No detalhe mobile, a LCP de 3.432 ms e CLS de 0,403 explicam a nota mais baixa. O relatório atribui o deslocamento ao reposicionamento do rodapé e sinaliza o ícone de carrinho sem dimensões reservadas. A substituição do skeleton pela geometria final também deve ser investigada antes de atribuir todo o CLS ao ícone. O SEO perdeu pontos por falta de descrição e robots.txt inválido no preview. O favicon retorna 404. Accessibility 97 nas duas rotas não cobre as demais telas e convive com falhas de nome acessível e tamanho de alvo.

## F. Verificação do deploy

| Verificação | Resultado |
|---|---|
| Repositório Git acessível e SHA | **FALHOU.** Diretório Git local presente, sem commit e sem remoto. |
| URL pública entregável | **FALHOU.** Não fornecida nem encontrada nos arquivos da entrega. |
| Equivalência da revisão, HTTPS, refresh, deep links, MSW e Socket.IO publicados | **NÃO VERIFICADO.** Falta o endereço publicado e o SHA. |
| Build e smoke locais | **PASSOU.** Vite preview carrega acesso direto a detalhe, checkout e pedido. Playwright valida service worker e Socket.IO. Isso comprova apenas o ambiente local. |

O [Figma original](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) não abriu pela consulta desta auditoria. A revisão visual se baseia nos anexos disponíveis, nos frames inventariados em [docs/FIGMA.md](docs/FIGMA.md) e nas capturas do build.

## G. Plano de correção

1. **Versionar a entrega e preparar a publicação.** Versionar a árvore, registrar URL e SHA em README e configurar fallback SPA para rotas públicas. Aceite: clone limpo com npm ci, build e E2E. Na URL HTTPS, deep links sobrevivem a refresh, MSW controla a origem e a compra recebe Socket.IO.
2. **Corrigir Performance e SEO.** Trabalhar em `src/catalog/nft-page.tsx`, `src/catalog/loading.tsx`, `src/catalog/catalog-page.tsx`, `index.html` e `public/`. Reservar geometria, antecipar descoberta da arte e revisar o carregamento inicial. Aceite: 12 novas medições, todas as medianas nas metas, com a mesma funcionalidade e arte.
3. **Fechar o requisito de baselines e estabilidade E2E.** Em `tests/responsive.spec.ts` e `playwright.config.ts`, comparar as quatro telas em Chromium desktop/mobile com fixtures e relógio controlados. Aceite: referência versionada e mudança visual intencional reprovando a comparação.
4. **Versionar a auditoria Lighthouse.** Incluir script/presets e instruções no manifesto e README. Aceite: clone limpo reproduz as quatro combinações e gera 12 pares HTML/JSON com medianas.
5. **Corrigir acessibilidade e fechar lacunas de estado.** Em `src/commerce/`, `src/catalog/` e `tests/`, associar erros aos campos, alinhar nomes visíveis e acessíveis, aumentar alvos e exercitar foco/zoom/movimento reduzido. Acrescentar timeout pré-commit, reset completo, terminalidade da recusa e evento atrasado de outra sessão. Aceite: casos verificáveis no browser e nenhuma regressão nas metas.

### Pontuação estimada

| Critério | Estimativa | Base de avaliação |
|---|---:|---|
| Fidelidade visual e responsividade | 14/20 | Responsividade e identidade demonstradas. Frames indisponíveis e diferenças de composição limitam a nota. |
| Fluxos e experiência | 18/20 | Nove telas e compra local verificadas, com lacunas de validação e falhas periféricas. |
| Integração e estado | 14/15 | REST, cancelamento, isolamento, rollback e cotação comprovados. |
| Tempo real | 8/10 | Binding, invalidação e reconexão locais funcionam. Isolamento de eventos atrasados e deploy ainda sem comprovação. |
| Mocking | 8/10 | Estado consistente e cenários principais cobertos. Reset, falha pré-commit e transporte REST incompletos. |
| Testes | 7/10 | 42 testes e os 12 grupos exercitados. Sem baselines e relógio controlado. |
| Acessibilidade | 3/5 | Foco e semântica parciais. Falhas reproduzidas e auditoria manual incompleta. |
| Performance | 2/5 | Desktop supera 90; mobile e SEO falham. |
| Arquitetura e documentação | 3/5 | Contratos e decisões descritos. Setup Lighthouse e revisão pública ausentes. |
| **Total estimado** | **77/100** | Estimativa local e conservadora, sem crédito por publicação ou verificações inconclusivas. |

## H. Veredito final

**NÃO PRONTO PARA ENTREGA.** O preview demonstra que a compra e os mocks funcionam, mas a falta de revisão e deploy entregáveis, a ausência de baselines e os resultados Lighthouse abaixo da meta já bastam para reprovar o aceite final.
