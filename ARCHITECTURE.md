# Arquitetura da Kurio

## Limites e responsabilidades

SPA React e TypeScript strict com Vite, TanStack Router, TanStack Query, Axios, Tailwind CSS e o [Button do padrão shadcn/ui](https://ui.shadcn.com/docs/components/button) adaptado em `src/components/ui/button.tsx`. Playwright e Lighthouse rodam contra build otimizado. Catálogo, conta, carteira e compra usam os handlers de rede simulados do MSW. Páginas editoriais, suporte, atividade, ofertas e downloads ficam fora do escopo.

| Camada | Responsabilidade |
| --- | --- |
| Rotas e features | Home `/`, detalhe `/nfts/:nftId`, carrinho `/cart`, login, cadastro, checkout, perfil, carteiras e `/orders/:orderId`. A rota do pedido mostra pendência ou recusa e só renderiza recibo após confirmação. Rota 404 explícita. |
| Domínio e contratos | Modelos, validação de fronteiras, transições, aritmética ETH e DTOs versionados em [CONTRATOS](docs/CONTRATOS.md). Compartilhados sem depender de React ou MSW. |
| Transporte e estado | Axios para todo REST de negócio; `socket.io-client` para eventos; Query para dados remotos e Router para URL/guards. Estado local para formulário, seleção, diálogos e conexão da carteira. |
| Simulação | MSW HTTP + WebSocket, com store transacional local compartilhado pelos handlers. UI e hooks desconhecem cenários, fixtures e banco. Configuração de demonstração inicia interceptação antes da primeira chamada. |

## Sessão e cache

- Identidades separadas: carrinho anônimo com credencial opaca; sessão fictícia com token opaco e expiração; cada recurso privado tem proprietário validado pelo handler. Token fica em armazenamento local controlado pelo adaptador de sessão para refresh; o mock persiste apenas hash salgado de senha. Trata-se de isolamento funcional da demonstração: quem controla o navegador pode inspecionar ou alterar seu armazenamento. Dados reais ficam fora do app.
- Guard aguarda `GET /session` antes de renderizar rotas privadas. Retorno após login aceita apenas rotas internas válidas. Em 401 de uma sessão corrente, suspender envio, manter referência da rota e contexto mínimo por proprietário; nunca transferir rascunho, recibo ou tentativa para outra conta. No logout explícito, limpar rascunho da UI e trocar identidade anônima; o carrinho da conta permanece no mock. Registro técnico de tentativa permanece no mock para recuperação pela mesma conta.
- A cada mudança de identidade: incrementar geração da sessão, cancelar consultas privadas, limpar cache privado e contextos transitórios, desconectar e remover listeners. Toda resposta tardia e callback verifica a geração original, inclusive 401 e rollback. Não persistir cache Query.
- Catálogo: chave com busca, filtros normalizados, ordenação e página; URL é fonte da verdade. Alteração de filtros reinicia página; Axios recebe AbortSignal; respostas antigas só podem popular sua chave e não podem sobrescrever versões mais recentes. Chaves privadas incluem escopo de usuário/visitante e geração. Sem reaproveitar dados privados de uma chave anterior.
- Catálogo e detalhe têm janela de 30 s de frescor. As consultas críticas configuram retry explícito e a cotação é revalidada nos pontos de decisão. Mutations de pedido usam recuperação explícita com a mesma chave e corpo. Reconexão revalida os recursos ativos.
- Favoritos usam atualização otimista com cancelamento, snapshot e rollback por conta; serializar alterações do mesmo NFT para impedir rollback sobre clique posterior. Ao concluir, invalidar a chave pertinente. Views distinguem primeiro carregamento, vazio, erro, sucesso e atualização em segundo plano; shimmer mantém geometria e respeita movimento reduzido.

## Persistência, dinheiro e pedido

M04 implementa carrinhos, sessões e merge em uma transação IndexedDB. O armazenamento local guarda credenciais opacas. Web Locks serializa a criação do carrinho visitante entre abas. A troca de sessão incrementa a geração do cache privado e remonta os componentes de rota para descartar mensagens da sessão anterior. M05 persiste cotações autenticadas para revalidação no pedido. A tentativa de envio fica no armazenamento da aba, separada por conta, até o cliente observar um estado terminal. Na recuperação, o cliente consulta a chave primeiro e reaproveita a mesma requisição se o pedido ainda não existir.

O prazo e o resultado do pagamento são persistidos com o pedido. A reserva e a dedução usam a mesma transação do pedido. O mock retoma o agendamento após inscrição autenticada e também materializa transições vencidas em consultas REST. A rota de acompanhamento mantém uma consulta de contingência a cada 500 ms durante a queda e a cada 5 s com o Socket.IO conectado.

M06 armazena contas, perfil, carteiras e favoritos em IndexedDB. As duas contas de demonstração começam com carteira principal e a edição dessa carteira substitui a fixture. O cadastro começa sem carteira. Senhas persistem como hash SHA-256 com salt por conta nesta simulação. O checkout guarda um rascunho por conta no armazenamento da aba para retomar após expiração. A saída explícita remove esse rascunho. A troca de conta invalida a geração do cache privado e a API valida o proprietário do pedido em cada consulta.

M07 publica eventos após o commit no IndexedDB. Um BroadcastChannel distribui notificações entre as instâncias do mock nas abas da mesma origem. Cada aba recebe os dados pelo cliente Socket.IO. Eventos de pedido são encaminhados somente a conexões com sessão válida do proprietário. O cliente descarta versões antigas ou repetidas e invalida as consultas afetadas. Ao reconectar, consulta novamente o REST para recuperar mudanças perdidas durante a queda.

- IndexedDB simulada e versionada por cenário: usuários, sessões, catálogo, carrinhos, cupons, favoritos, carteiras, cotações, pedidos e chaves. Transações abrangem estoque, reserva, ledger e carrinho quando necessário; testes isolam o contexto do navegador. Merge anônimo é atômico, de consumo único e soma por NFT/edição. Quantidade acima do estoque fica sinalizada para correção, sem descartar itens silenciosamente; cotação não é comprável nessa condição.
- Valores ETH canônicos em strings com até 18 casas; converter para wei em BigInt nas operações, validar limites e quantidades inteiras positivas, nunca usar float. Descontos proporcionais truncam em wei, com total = subtotal − desconto + taxa. Exibição parte da string exata; revisão e recibo dão acesso ao valor integral.
- Revisão fixa cotação com versão do carrinho e das edições, cupom, rede, taxas e validade. Handler de criação revalida e reserva estoque em transação antes de aceitar; 409 com nova cotação exige confirmação explícita e nova chave. Pendente pode virar confirmado ou recusado uma vez. Confirmação grava recibo imutável, consome reserva e deduz só as unidades compradas; recusa libera reserva. No carrinho, unidades em pedido pendente ficam bloqueadas para redução/remoção, permitindo somar unidades livres. Em timeout após gravação, consultar a tentativa ou repetir a mesma chave; nunca criar tentativa nova até resolver a anterior.
- Trabalho pendente tem prazo e desfecho determinísticos persistidos. Scheduler do mock produz transições enquanto a página está ativa; handlers de leitura reprocessam transições vencidas após refresh. Não depende de manter uma aba rodando em segundo plano.

## Tempo real e cenários

REST e WebSocket usam o mesmo estado de domínio: mutação confirmada grava versão e depois publica evento. No modo mock, validar em M02 o binding `@mswjs/socket.io-binding` com `ws.link`, transporte exclusivamente WebSocket, namespace padrão e eventos JSON de texto. Não depender de polling do Engine.IO, acknowledgements, binários ou namespaces customizados. Referência: [documentação do binding](https://github.com/mswjs/socket.io-binding#limitations). Se houver incompatibilidade, testar um adaptador de protocolo em MSW; o cliente Socket.IO e o caminho real de rede permanecem obrigatórios.

A prova M02 usa MSW 2.10.5, binding 0.2.0 e socket.io-client 4.8.4. A versão publicada do binding expõe `toSocketIo(connection)`. No MSW fixado, `ws.link` casa com a origem WebSocket, pois o matcher remove `/socket.io/`. O worker inicia antes de importar o cliente, que captura o construtor WebSocket ao carregar o módulo. O diagnóstico mantém uma revisão de catálogo em memória na aba, compartilhada por REST e pelos eventos. O heartbeat Engine.IO mantém conexões abertas. Persistência, eventos privados, reconciliação de recursos ativos e isolamento por sessão pertencem aos ciclos seguintes.

Evento contém ID, tipo, identidade do recurso e versão monotônica. Cliente guarda marca por recurso e geração, descarta duplicados/antigos e invalida chaves relevantes; atualizações REST também passam pelo filtro de versão. Evento de NFT afeta listas (inclusive ordenação), detalhe, carrinho e cotação. Evento de pedido invalida status/carrinho; recibo depende de leitura REST confirmada. A reconexão refaz sessão, recursos ativos e tentativa pendente sem reenviar compra. Estado terminal não regride. Pedidos têm audiência privada e a simulação revalida a sessão antes de assinar e antes de emitir.

| Cenário | Gatilho reproduzível / observação |
| --- | --- |
| baseline / empty | Seed com catálogo que cruza páginas, filtros e edições; duas contas fictícias com dados diferentes; busca sem resultado |
| slow / reordered | Latências por parâmetros; primeira busca mais lenta que a segunda; skeleton e URL correta |
| network / HTTP | Erro de rede, timeout antes de gravação, 4xx e 5xx por operação/ocorrência; recuperação observável |
| session / validation | Relógio controlado expira token durante navegação e revisão; acesso cruzado, e-mail repetido e campos inválidos |
| coupons | Cupom válido, desconhecido e vencido com relógio controlado |
| market | Alterar preço/estoque no store, emitir pela conexão; revisão perde validade; duplicata e versão antiga |
| payment | Confirmar/recusar, interromper socket pendente, avançar relógio, reconectar; timeout após commit recupera mesmo ID |

Os controles de cenário passam pelos handlers REST do MSW. O procedimento de reset do README restaura o estado persistido, limpa chaves Kurio do navegador e recarrega a página, reiniciando conexões, timers e caches dessa aba. Os testes visuais usam contextos isolados e data fixa. O teste de timeout pré-commit atrasa uma resposta sem criar pedido, e o pós-commit atrasa a resposta após gravar a operação.

## Decisões em aberto e riscos

O [inventário visual](docs/FIGMA.md) registra as referências disponíveis e as substituições de arte. A entrega usa versões WebP da arte original, com 480 px para cartões e 960 px para detalhes e zoom. As rotas de conta e compra carregam sob demanda. O HTML reserva descoberta antecipada da arte do hero em mobile, e o layout do detalhe reserva espaço acima do rodapé durante a consulta inicial.

A Vercel serve `dist` e aplica fallback para rotas SPA. O MSW inicia em todos os ambientes e intercepta HTTP na origem da aplicação. O cliente Socket.IO é importado depois do worker, pois Engine.IO captura o construtor WebSocket ao carregar o módulo. A publicação não requer API externa, variáveis de ambiente ou backend privado.
