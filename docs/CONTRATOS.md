# Contratos propostos — API simulada v1

Prefixo `/api/v1`. JSON UTF-8, IDs opacos, datas UTC ISO 8601. `Authorization: Bearer <token>` para conta; `X-Guest-Cart` para carrinho visitante (emitido pelo bootstrap). Recurso privado resolve identidade da credencial, nunca de um ID enviado no corpo. Revisões de entidades são inteiros monotônicos; listas recebem revisão do catálogo. IDs e enums devem ser validados em runtime.

| Método e rota | Entrada | Resposta de sucesso |
| --- | --- | --- |
| POST /guest-carts | — | 201 credencial anônima e carrinho vazio |
| POST /auth/register | username, email, password | 201 conta pública e sessão. Pode consumir credencial anônima |
| POST /auth/login | e-mail, senha; credencial anônima opcional | 200 sessão; merge atômico do carrinho e alertas |
| GET /session | credencial | 200 usuário, expiresAt |
| POST /auth/logout | credencial | 204; revoga sessão. Expiração também resulta em 401 |
| GET /nfts | q, tab (all/new/trending), category[], collection[], network[], minPrice, maxPrice, sort, page, pageSize | 200 items, total, page, pageSize, catalogVersion, facetas e destaques quando aplicável |
| GET /nfts/:id | ID | 200 NFT com galeria e edições |
| GET /favorites | sessão | 200 IDs e versão |
| PUT /favorites/:nftId | sessão | 204 adiciona de modo idempotente |
| DELETE /favorites/:nftId | sessão | 204 remove de modo idempotente |
| GET /cart | sessão ou credencial anônima | 200 Cart |
| POST /cart/items | nftId, editionId, quantity, cartVersion | 200 Cart; soma à linha existente |
| PATCH /cart/items/:lineId | quantity absoluta, cartVersion | 200 Cart |
| DELETE /cart/items/:lineId | cartVersion em If-Match | 200 Cart |
| PUT /cart/coupon | code, cartVersion | 200 Cart; rejeita código inválido/expirado |
| DELETE /cart/coupon | cartVersion em If-Match | 200 Cart |
| POST /quotes | cartVersion, networkId (rede padrão quando no carrinho) | 200 Quote; 409/422 quando versão ou restrição inviabiliza compra |
| POST /wallet-connections | walletId, networkId | 201 conexão simulada, ou recusa tipada; expiração por sessão |
| DELETE /wallet-connections/:id | sessão | 204 desconexão |
| POST /orders | quoteId, connectionId, collector e cabeçalho Idempotency-Key | 202 pendente ou 200 com o pedido já gravado |
| GET /orders/:id | sessão do proprietário | 200 Order; recibo somente quando confirmado |
| GET /order-attempts/:key | sessão do proprietário | 200 Order; 404 se sem registro |
| GET /profile | sessão | 200 Profile |
| PATCH /profile | campos editáveis e avatar normalizado; limite de MIME/tamanho | 200 Profile |
| PUT /profile/password | senha atual e nova senha | 204; valida regras e armazena hash salgado |
| GET /wallets | sessão | 200 Wallet[] |
| POST /wallets | slot, endereço, redes suportadas, rótulo | 201 Wallet; slot único por conta |
| PATCH /wallets/:id | campos editáveis | 200 Wallet |

Sucesso sem corpo usa 204. Erro JSON: `{ code, message, fields?, requestId, details? }`. 400 parâmetro/formato inválido; 401 token ausente/inválido/expirado; 403 escopo insuficiente; 404 inexistente ou recurso privado alheio; 409 estoque/versão/cotação, cadastro duplicado ou chave reutilizada com outro corpo; 422 validação, cupom ou conexão recusada; 503 indisponibilidade. Timeout e falha de rede não têm envelope HTTP. Erros de carrinho/cotação podem incluir versão corrente, linhas afetadas e valores atualizados quando calculáveis.

| Modelo | Campos e invariantes |
| --- | --- |
| Nft / Edition | id, nome, coleção/categoria, mídia com alt, informações, versões; edição com id, priceEth e available inteiro ≥ 0 |
| Cart | id, version, couponCode?, pendingOrderId?, lines. Cada linha contém lineId, nftId, editionId, quantity, reservedQuantity e disponibilidade atual. Os totais vêm da cotação |
| Quote | id, owner/cartId, cartVersion, networkId, expiresAt, linhas e versões, couponCode?, subtotalEth, discountEth, networkFeeEth, totalEth |
| Session / Profile | usuário, expiresAt. Perfil com displayName, username, email, ensName, walletNickname e avatar. Senha e hash ficam fora dos DTOs |
| Wallet / Connection | walletId, slot principal/secundária, endereço fictício, redes e rótulo; conexão vinculada a sessão, carteira, rede e validade |
| Order / Receipt | id, status, version, timestamps e motivo em recusa; recibo confirmado contém transação simulada, rede, linhas com nome, edição, quantidade e preço da compra, desconto, taxas e total imutáveis |

A busca aceita OR entre valores da mesma faceta e AND entre facetas. A aba combina com as facetas. Os limites de preço são inclusivos e usam strings decimais em ETH. A página começa em 1, com nove itens por padrão e máximo de 48. A ordenação inclui recência com desempate por ID. O [inventário do Figma](FIGMA.md) registra as opções da interface.

O objeto collector reúne displayName, username, profileName, email, referralCode, ensName, alternateWalletReference opcional e note opcional. Rede e provedor vêm da conexão selecionada. O endereço é resolvido pela carteira cadastrada e validado no mock. O modelo de carteira também prevê profileName, ensName, email, referralCode, alternateWalletReference opcional e tipo de provedor. As duas larguras usam a mesma validação de checkout.

Idempotência: chave aleatória por tentativa, escopo proprietário + operação, corpo validado e normalizado com digest estável. O ledger é consultado antes de revalidar cotação ou carteira para um replay; mesma chave e digest devolvem o mesmo ID e estado corrente, mesmo com cotação agora expirada. Digest divergente dá 409; rejeição por cotação obsoleta exige revisão e nova chave. O ledger e o pedido são gravados juntos antes do retorno. Após timeout, consultar por chave; se ainda ausente, reenviar o mesmo corpo com a mesma chave. A tentativa fica recuperável por conta após refresh, sem persistir dados de pagamento reais.

## Eventos e controle da simulação

Evento `{ eventId, type, resourceId, version, occurredAt, payload }`. `nft.updated` é público: versão do catálogo, edições afetadas, preço e disponibilidade. `order.updated` é privado: ID e status do pedido, versão e motivo opcional. Evento é aviso de mudança; GET fornece estado completo. Mesmo recurso/versão não deve gerar efeitos repetidos.

Socket.IO no namespace padrão, path `/socket.io`, WS de texto. Conexão recebe catálogo; assinatura privada via evento textual autenticado com resposta textual (sem acknowledgement do protocolo), com vínculo validado pelo mock. Na troca de sessão, abrir conexão nova. Produção simulada não expõe sessão em query string nem compartilha canal privado por conta fornecida pelo cliente.

Somente demo/teste: controle MSW fora do prefixo de negócio, com operações de selecionar/resetar seed, avançar relógio, aplicar mudança de mercado e cortar/restaurar conexão. Teste dispara pelo simulador e verifica pela UI e pelas operações; não usa interceptação paralela para substituir os handlers.
