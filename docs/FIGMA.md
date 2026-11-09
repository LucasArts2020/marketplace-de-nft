# Inventário visual do marketplace Kurio

Referência de implementação: [cópia do Frontend Challenge](https://www.figma.com/design/frqcXGFOshgCQIJ0aVVC0E/Frontend-Challenge--Copy-?node-id=0-1). Página `0:1`, intitulada “Marketplace de NFTs GreenMint”. A marca apresentada nas telas é KURIO.

| Tela | Desktop, 1440 px | Mobile, 414 × 896 px | Composição e assets de referência |
| --- | --- | --- | --- |
| Início | `2:2` | `14:5226` | Cabeçalho, busca, hero, destaques e arte dos NFTs. Desktop tem filtros, ordenação e paginação. Mobile tem abas, grade e barra inferior. |
| Detalhe | `10:244` | `15:5536` | Galeria e arte principal, ícones de interação, edição, quantidade, preço e compra. Desktop inclui informações e itens relacionados. Mobile tem painel sobre a imagem e barra de compra. |
| Carrinho | `11:1278` | `16:360` | Miniaturas, edição/quantidade, cupom, subtotal, desconto, taxa e total. Tabela e resumo lateral no desktop, lista e painel de resumo no mobile. |
| Pagamento | `11:2862` | `16:748` | Miniaturas do pedido, ícones e marcas de carteira. Desktop tem formulário e resumo. Mobile prioriza conexão, troca de carteira, provedor, rede e total. |
| Confirmação | `11:4385` | Sem frame | Modal sobre pagamento com miniaturas, ID, data, carteira, linhas, taxa, total e ação de exploração. Adaptar para tela estreita e vincular a pedido confirmado. |
| Login | `9:115` | `16:1022` | Modal sobre marketplace no desktop e tela própria no mobile. E-mail, senha, visibilidade de senha, marca e ícones sociais. |
| Cadastro | `9:1022` | `16:1228` | Modal no desktop e tela própria no mobile. Nome de usuário, e-mail, senha e confirmação. Marca, ícones sociais e arte do marketplace ao fundo no desktop. |
| Perfil | `9:1238` | Sem frame | Navegação da conta, avatar com alteração/remoção, dados e formulário de senha. Adaptar navegação e formulários em coluna no mobile. |
| Carteiras | `9:1670` | Sem frame | Navegação da conta, ícones de seleção e seções de carteira principal e secundária. Adaptar seções em coluna. |

## Campos e decisões de comportamento

- **Catálogo:** desktop mostra Filters, abas Todos os NFTs, Novos lançamentos e Em alta, ordenação com Listados recentemente e paginação. Mobile repete as três abas. O frame aberto não detalha as opções do painel de filtros. Categoria e coleção ficam como facetas iniciais do contrato, e os rótulos de categoria do rodapé são referência visual. Usar `tab=all|new|trending` no estado da URL e transmitir a seleção ao REST.
- **Login e cadastro:** e-mail e senha no login. No cadastro, usar nome de usuário, e-mail, senha e confirmação, com igualdade validada no formulário. Controles sociais e recuperação de senha aparecem no layout. Qualquer ação sem operação no escopo recebe tratamento explícito.
- **Checkout desktop:** nome de exibição, nome de usuário, rede, nome do perfil, endereço, tipo de carteira, código de indicação, e-mail e nome ENS aparecem com asterisco. ENS ou carteira secundária e observação do colecionador estão marcados como opcionais. O seletor “Usar outra carteira?” alterna entre carteiras cadastradas. Pré-preencher do perfil e da carteira sempre que possível. Mobile deve permitir revisar e completar os mesmos campos antes da confirmação, em uma etapa recolhível ou separada. Revalidar os requisitos no mock REST e apresentar os erros junto aos campos.
- **Perfil:** nome de exibição, nome de usuário, e-mail, nome ENS, apelido da carteira e avatar. Mudança de senha inclui senha atual, nova senha e confirmação.
- **Carteiras:** nome de exibição/apelido, rede, nome do perfil, endereço, ENS ou endereço secundário opcional, tipo, código de indicação, e-mail e nome ENS. A seção secundária exibe “Igual à carteira principal” e o estado sem carteira cadastrada. Proposta para o contrato: a opção reutiliza a principal na seleção de pagamento. A seção secundária continua disponível para cadastro independente.
- **Provedores:** WalletConnect, MetaMask e Coinbase Wallet aparecem na interface. Representar como opções fictícias na rede simulada. O recibo usa os valores do pedido, inclusive quando os exemplos estáticos do desktop e do mobile divergem.

## Tokens e origem dos assets

O contexto gerado referencia Roboto Mono regular e bold. Parte dos estilos tipográficos aparece apenas como alias `font/family`. Confirmar a resolução desses aliases por componente no ciclo de implementação. Tokens observados: texto `#F5F1EB`, acento `#E89B55`, primária `#D28A4C`, tinta `#140D0A`, cartão `#241612`, superfície elevada `#2F1D15`, secundária `#B39463` e borda `#3F2319`.

Os contextos dos frames fornecem PNGs para as artes e SVGs para ícones, marcas e detalhes gráficos. Usar os IDs da tabela para recuperar os contextos e exportar os arquivos na implementação. Mapear cada arte ao NFT correspondente nas fixtures e referenciar os arquivos locais. O inventário registra a origem por frame e categoria. Download, licença da fonte e verificação de geometria ficam para a implementação visual. Validar também em 390 e 768 px, conforme o README.

Foram conferidos 15 frames na árvore da página. O plugin retornou contexto com screenshot para 13. Para login desktop e carrinho mobile, o limite do plano Starter interrompeu o contexto de alta fidelidade. A composição e os campos dessas duas telas foram inventariados pela árvore de metadados. Consultar os contextos de `9:115` e `16:360` antes de implementar sua aparência final.

## Aplicação visual no código

A primeira entrega aplica Roboto Mono local, a paleta observada e a largura desktop de 1200 px. O catálogo usa os fundos de banner exportados, painel lateral de filtros no desktop e grade de dois cartões no mobile. O detalhe usa a arte exportada e miniaturas. Carrinho e pagamento mostram miniaturas e resumo lateral no desktop, com empilhamento em telas estreitas. Os formulários e o recibo usam as mesmas superfícies e cores.

Os PNGs `8f387`, `83794`, `9add2` e `b7cfc`, os fundos dos banners e os ícones aplicados estão em `public/art`. As fixtures que ainda carecem de uma arte identificada e a imagem alternativa da galeria mantêm vetores provisórios.

A navegação usa barra inferior abaixo de 768 px, com espaço reservado para o conteúdo e indicação da rota ativa. O rodapé organiza marca, marketplace e conta em colunas, com links das rotas disponíveis. Login e cadastro usam um painel central com ação de fechar e controle de visibilidade da senha. O recibo separa a confirmação, os dados da transação e os itens comprados. O rodapé e os painéis ainda são adaptações da composição original. O limite do plano Starter bloqueou tanto os contextos quanto as capturas de login desktop e carrinho mobile.

O Playwright anexa capturas de catálogo, detalhe, carrinho, pagamento, recibo, perfil e carteiras a 390, 768 e 1440 px, além de login a 390 e 1440 px. O teste verifica largura, imagens, fonte, salto por teclado, posição da navegação e controle de visibilidade da senha. As capturas documentam a implementação atual. As baselines de regressão visual ficam em M09.

## Ajuste da página inicial pela captura fornecida

O desktop usa hero com arte maior à direita, filtros e destaque na coluna esquerda, abas e ordenação acima dos resultados, três colunas de cartões e paginação numerada. A primeira página usa as artes exportadas e a lista traz nove itens por página. Preço e rede filtram a resposta do mock e persistem na URL.

A busca abre pela lupa do cabeçalho, ao passar o mouse no desktop ou ao acionar o botão. O filtro de séries fica acima dos resultados. O painel lateral segue a ordem da captura posterior, com Coleções, Faixa de preço e Rede. A faixa usa dois controles deslizantes com valor em ETH e botão Aplicar. As contagens representam as fixtures do catálogo, por isso diferem dos números do Figma. As capturas servem de referência visual para a interface.

A parte inferior da página inicial inclui dois banners ligados ao catálogo, quatro cartões expansíveis do Diário da Cunhagem e um rodapé com seções de marca, conta, coleções e carteiras. As artes vêm das exportações locais. O Diário abre prévias na mesma página. O formulário de novidades fica desabilitado na demonstração.

As duas capturas adicionais do detalhe orientam a galeria lateral no desktop, os botões de edição, as abas de informações e avaliações, a grade de NFTs da coleção e o rodapé completo. O zoom abre um diálogo acessível. A seção de avaliações mostra o agregado simulado. Os itens relacionados vêm da coleção na API e usam paginação local sobre os resultados carregados. A ação de compartilhar copia o link do NFT.

No desktop, o botão Entrar do cabeçalho abre um diálogo sobre a página atual, com alternância entre login e cadastro. O diálogo fecha pelo botão ×, por Escape ou ao autenticar. As rotas de login e cadastro servem ao mobile, aos acessos diretos e à retomada de fluxos protegidos. As opções de acesso social aparecem desabilitadas na demonstração.

Perfil e Carteiras usam o menu lateral Meu perfil e formulários em duas colunas no desktop. Em telas estreitas, os campos ficam em uma coluna. O perfil mantém ações separadas para salvar os dados e alterar a senha. Em Carteiras, a seção secundária começa recolhida quando ainda não há cadastro. Usar dados da principal preenche o formulário para revisão antes de salvar uma carteira secundária independente.

As referências adicionais de pagamento e confirmação orientam o formulário do colecionador, o resumo com miniaturas e subtotais e o recibo modal. O endereço e o provedor vêm da carteira selecionada. O fluxo mantém a revisão da cotação antes da confirmação. Como a transação é simulada, o recibo oferece cópia do ID.

## Seis referências mobile

| Ciclo | Telas | Adaptação |
| --- | --- | --- |
| 1 | Início e NFT | Busca persistente no topo, filtros recolhíveis, duas colunas e Criadores no centro da barra inferior. O detalhe mantém as miniaturas e o zoom, com favorito acima da arte e subtotal da quantidade no painel de compra. |
| 2 | Carrinho e pagamento | Linhas compactas, cupom e totais da cotação. Os cartões de pagamento vêm das carteiras da conta e a rede pode ser escolhida antes da conexão. Os dados do coletor e a revisão permanecem no fluxo. |
| 3 | Login e cadastro | Rotas em tela inteira abaixo de 768 px, com retorno preservado entre os formulários. O diálogo continua sendo o ponto de entrada no desktop. Recuperação de senha e login social aparecem indisponíveis na demonstração. |

As seis capturas fornecidas serviram de referência para o mobile. Os dados, a disponibilidade e as artes do catálogo vêm da aplicação. O Playwright anexa as telas mobile em 390 px, verifica estouro horizontal também em 320 px e verifica a navegação do formulário de cadastro com a altura da janela reduzida. As capturas desktop são verificadas em 768 e 1440 px. A validação com teclado virtual em aparelho físico e as baselines versionadas ficam pendentes.
