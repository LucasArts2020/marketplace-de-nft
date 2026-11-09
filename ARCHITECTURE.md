# Arquitetura da Kurio

Este documento descreve a implementação entregue. Os contratos HTTP e eventos estão em [docs/CONTRATOS.md](docs/CONTRATOS.md), os procedimentos de execução e falhas em [README.md](README.md) e a referência visual em [docs/FIGMA.md](docs/FIGMA.md).

## Escopo e organização

SPA React + TypeScript strict, Vite, TanStack Router, TanStack Query, Axios, Tailwind CSS e Button baseado no padrão shadcn/ui. A aplicação publicada executa a mesma simulação local do desenvolvimento, sem backend privado, RPC blockchain ou serviços de autenticação externos.

| Diretório | Responsabilidade |
| --- | --- |
| `src/catalog` | Catálogo, filtros, detalhe, criadores e conteúdo editorial |
| `src/commerce` | Sessão, conta, favoritos, carrinho, carteiras, checkout e recibo |
| `src/api` | Transporte REST por Axios, timeout de 10 segundos e cancelamento por AbortSignal |
| `src/contracts` | DTOs, validação, eventos e conversões exatas ETH/wei |
| `src/socket` | Cliente Socket.IO, assinaturas, deduplicação e reconciliação |
| `src/mocks` | Handlers MSW, fixtures de catálogo/contas, transações IndexedDB e publicação de eventos |
| `public/art` | Assets locais, incluindo WebP em 480 e 960 px |
| `tests` e `scripts` | Playwright, baselines visuais e auditoria Lighthouse |

A UI consulta os adapters REST. Fixtures e cenários ficam na camada de mocks. Componentes não recebem respostas fictícias diretamente. O bootstrap aguarda `worker.start()` antes de renderizar e de importar o cliente Socket.IO, pois Engine.IO captura o construtor WebSocket ao carregar.

## Estado, persistência e isolamento

| Estado | Fonte da verdade | Persistência |
| --- | --- | --- |
| Busca, abas, filtros, ordem e página | URL validada pelo Router | URL compartilhável, com defaults omitidos |
| Recursos remotos | REST e store dos handlers | IndexedDB `kurio-demo-commerce`, versão 1, store `commerce` |
| Cache da UI | TanStack Query | Memória da aba, sem persistência |
| Credenciais opacas de sessão e visitante | Adaptadores de sessão/carrinho | `localStorage`, chaves `kurio.*` |
| Rascunho e tentativa de compra | Checkout, separados por usuário | `sessionStorage` |
| Formulários, diálogos e seleções | Componente responsável | Estado local |

As operações do mock usam uma transação readwrite sobre o estado do comércio. Isso serializa alterações entre abas da mesma origem. Eventos só são publicados após o commit. O BroadcastChannel distribui notificações entre mocks das abas e cada UI recebe o evento pelo cliente Socket.IO. Navegadores, perfis e origens distintos têm bancos independentes. O ambiente publicado não é um marketplace compartilhado entre máquinas.

## Política de sessão

Login e cadastro emitem token opaco com validade absoluta de uma hora. Não existe refresh token ou renovação automática. `GET /session` valida a sessão antes de exibir conteúdo privado. Retornos após autenticação aceitam somente destinos internos da lista permitida.

Mudanças de identidade incrementam uma geração, cancelam e removem consultas privadas, remontam o conteúdo da rota e recriam a conexão Socket.IO. Respostas e rollbacks privados verificam a geração antes de alterar o cache. O evento `storage` sincroniza a identidade entre abas. Recursos privados resolvem o proprietário pelo Bearer e não por IDs informados pelo usuário. Pedidos alheios retornam 404.

Em 401, a sessão corrente expira e o checkout pode ser retomado pela mesma conta. O logout explícito revoga a sessão e as conexões de carteira correspondentes e remove o rascunho daquela conta. O carrinho autenticado continua persistido. A tentativa pendente fica separada por proprietário para recuperação, sem permitir duplicação ao trocar de conta.

Tokens em localStorage e senhas com SHA-256 e salt são escolhas exclusivas da simulação. O usuário do navegador pode inspecionar e alterar seu banco. Uma implementação real exigiria backend confiável, política de cookies/tokens e hash de senha apropriado. Nenhum dado ou segredo real é necessário para avaliar esta entrega.

## Carrinho e precisão monetária

Visitantes recebem uma credencial opaca em `X-Guest-Cart`. Web Locks coordena sua criação entre abas. Login/cadastro consomem o carrinho visitante uma única vez e somam itens por NFT/edição na mesma transação. Excesso de estoque gera alerta e impede a compra até correção, sem descartar itens silenciosamente.

Cada carrinho tem versão. Mutações enviam a versão conhecida e conflitos 409 provocam revalidação. Totais vêm de `POST /quotes`, incluindo cupom, subtotal, desconto, taxa e total. A cotação vale cinco minutos e captura versões, rede e linhas. `KURIO10` aplica desconto, `EXPIRADO` e códigos desconhecidos exercitam validação.

ETH usa strings decimais com até 18 casas e operações em wei com BigInt. Desconto é truncado em wei. Total = subtotal − desconto + taxa. Quantidades são inteiros positivos. Valores de fixtures do Figma não substituem o orçamento da API.

## Compra, idempotência e recuperação

O fluxo é carteira cadastrada → seleção de rede → conexão simulada → dados do coletor → revisão → confirmação. A criação revalida cotação, estoque e conexão e reserva unidades na transação do pedido. Uma cotação obsoleta exige nova revisão explícita.

Cada tentativa conserva chave aleatória e corpo normalizado, separados por conta no sessionStorage. O ledger usa proprietário e chave, com fingerprint do corpo. Repetir a mesma chave/corpo devolve o mesmo pedido. Reutilizá-la com outro corpo retorna 409. Não há retry automático de criação com chave nova.

Após timeout, a UI consulta `GET /order-attempts/:key`. Se ausente, reenvia o mesmo corpo e chave. Isso atende tanto timeout antes do commit quanto depois da gravação. A tentativa é removida quando o cliente observa estado terminal.

O pedido muda de pending para confirmed ou rejected uma única vez. Confirmação grava recibo imutável e deduz somente as unidades compradas. Recusa libera a reserva. Linhas reservadas não podem ser removidas ou reduzidas abaixo da reserva. Prazo e resultado são persistidos. Timers retomam pedidos pendentes na assinatura autenticada e leituras REST materializam transições vencidas após refresh.

## Cache e reconciliação REST/Socket.IO

| Recurso | Política |
| --- | --- |
| Catálogo e detalhe | Chaves por parâmetros/ID, staleTime de 30 s, retry desativado |
| Carrinho | Chave privada por geração, staleTime de 10 s, aceita versões não inferiores |
| Sessão e demais consultas privadas | Revalidação conforme montagem/invalidação, sem retry automático nos fluxos críticos |
| Favoritos | Atualização otimista, snapshot/rollback da mesma identidade e mutações serializadas |
| Pedido pendente | Polling de contingência de 500 ms desconectado e 5 s conectado |

O cliente usa namespace padrão, path `/socket.io` e transporte exclusivamente WebSocket. MSW 2.10.5 e `@mswjs/socket.io-binding` 0.2.0 interceptam o protocolo utilizado pelo cliente. O mock implementa heartbeat Engine.IO. Não depende de polling Engine.IO, binários ou acknowledgements.

A conexão envia `session.subscribe` com token ou null e recebe `session.ready` ou `session.invalid`. `nft.updated` é público. `order.updated` é emitido apenas para sessões válidas do proprietário. O token não é colocado na URL.

Eventos possuem eventId, resourceId, version, occurredAt, type e payload. A UI mantém a maior versão por tipo/recurso na geração corrente e ignora versões antigas ou repetidas. Uma mudança de NFT cancela consultas em andamento e invalida catálogo, detalhe, carrinho e cotação. Uma mudança de pedido invalida pedido, carrinho e cotação. O recibo completo sempre vem do REST. Na reconexão, recursos ativos e sessão são revalidados. Eventos avisam que houve alteração, não substituem a consulta autoritativa nem chamam setters da UI diretamente a partir de controles de cenário.

## UX, responsividade e desvios do Figma

A referência e a origem das artes estão em [FIGMA.md](docs/FIGMA.md). As seis imagens mobile fornecidas orientam telas abaixo de 768 px. A grade mobile tem duas colunas, filtros em painel e navegação inferior. O botão central leva a Criadores e tem rótulo acessível correspondente. Trocas de filtro/aba mantêm a rolagem. Painéis de ações consideram a área segura.

O cabeçalho desktop abre autenticação em modal e o mobile usa `/login` e `/register`. Por solicitação posterior, finalizar compra como visitante abre o modal sobre o carrinho em ambas as larguras e segue ao checkout após autenticação. Fechar o modal preserva o carrinho. Acesso direto a uma rota privada continua protegido e oferece entrada com retorno.

O checkout mobile preserva os dados obrigatórios do coletor e uma revisão explícita, mesmo que a imagem de referência omita essas etapas. Recibo, quantidades, preços e contadores refletem o estado da API. O popup de confirmação aparece somente para pedido confirmado. Perfil e carteiras são adaptados a uma coluna onde não havia frame mobile. Criadores usa perfis e posses de demonstração, sem um índice blockchain.

Login social, newsletter, recuperação de senha e seções editoriais sem integração permanecem indisponíveis ou informativas. Carteiras e transações são simuladas, sem transferência real ou comprovante Etherscan real. Essas limitações são explícitas na interface. Não se afirma equivalência pixel a pixel com todos os frames. Baselines Playwright detectam regressões do layout implementado, não comprovam fidelidade ao Figma.

## Publicação e operação

Vercel publica `dist` com fallback SPA em `vercel.json`. O acesso direto e refresh de rotas retornam index.html e o Router resolve a tela. O service worker é revalidado com `Cache-Control: no-cache`. O MSW está habilitado no desenvolvimento, preview e deploy. Assets e fonte são locais. Não são necessárias variáveis de ambiente da aplicação.

A instalação usa Node 24 e `npm ci` com o lockfile versionado. Não depende de `.env.local`, `.vercel`, banco pré-populado ou node_modules existente. HTTPS ou localhost é necessário para service worker, Web Locks e APIs de armazenamento. Bloquear service workers ou IndexedDB impede a simulação. Os controles `/__demo/*` existem no navegador interceptado e não são endpoints de servidor acessíveis por curl.

O reset completo exige restaurar o banco pelo endpoint, limpar chaves Kurio e recarregar conforme README, com outras abas fechadas. A recarga restaura cenários/timers em memória. Não há painel administrativo público ou serviço remoto para manter.

## Verificação e limites das evidências

Playwright cobre fluxos de negócio, isolamento, recuperação, tempo real, responsividade e snapshots em Chromium desktop/mobile. Baselines versionadas são Windows, com possível diferença de fontes em outros sistemas. Lighthouse executa três rodadas para início/detalhe em mobile/desktop e verifica medianas. Comandos e resultados ficam no README e nos relatórios de entrega.

A disponibilidade contínua depende da hospedagem e de o projeto/domínio permanecerem ativos. Verificações do deploy atestam a versão e o funcionamento no momento registrado, sem garantir uptime futuro. A simulação não oferece segurança de servidor, liquidação blockchain, OAuth, sincronização entre máquinas nem testes em todos os navegadores reais.
