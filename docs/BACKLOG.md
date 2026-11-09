# Backlog priorizado e plano de entrega

P0 cobre o caminho crítico e requisitos eliminatórios. P1 amplia cobertura e fidelidade. P2 fecha a entrega. A precedência é definida pelas dependências. Consulte a [matriz](RASTREABILIDADE.md) e os [contratos](CONTRATOS.md).

| ID | Ciclo / prioridade | Trabalho | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| M01 | 1 / P0 | Fundação executável: Git, Vite, TS, Router/Query/Axios, Tailwind/shadcn, MSW HTTP, cenário padrão e Playwright | Planejamento | Instalação com lockfile; dev/build/preview/typecheck/lint; uma rota e GET tipado via MSW; smoke Playwright no preview |
| M02 | 1 / P0 | Prova do binding MSW + Socket.IO | M01 | Handshake pelo cliente real; evento textual entregue pelo MSW no preview; teste observa desconexão/reconexão; documentar versões e limites |
| M08a | 1 / P1 | Inventário do Figma: IDs de frames, layouts, filtros, campos, fontes e assets | Acesso de leitura funcional | Planilha ou tabela por tela/tamanho com referência do nó e fonte dos assets; checkout, perfil e demais formulários mapeados |
| M03 | 2 / P0 | Catálogo/detalhe, URL canônica, galeria e seleção | M01; M08a para campos definitivos | E01/E02 e parte de E12; busca concorrente não regrede resultados; links e 404 funcionam |
| M04 | 2 / P0 | Carrinho visitante, login mínimo, merge, cotação, cupom e regras ETH | M03 | E05; carrinho persiste; merge não duplica; erro de quantidade/cupom é visível; totais exatos |
| M05 | 2 / P0 | Primeira fatia completa: revisão, conexão simulada, pedido e recibo | M04; M08a para aceite final dos campos | E06/E07; pelo menos uma carteira fictícia cadastrada na fixture; pendência recuperável por REST; recibo só após confirmação; falhas não consomem carrinho |
| M06 | 3 / P0 | Cadastro, perfil, avatar, senha, carteiras, favoritos e fronteira de sessão | M04; M08a para campos finais | E03/E04/E08; expiração durante checkout; mesmo usuário retoma; outro usuário não vê carrinho, favoritos, pedido ou rascunho alheio |
| M07 | 3 / P0 | Eventos de mercado/pedido e reconciliação | M02, M05, M06 | E09/E10; eventos cruzam o socket; duplicata/versão antiga não regride UI; stale quote bloqueia envio; queda com pedido pendente não duplica compra |
| M08 | 4 / P1 | Fidelidade Figma, UI responsiva e acessibilidade de todas as telas | M03–M07, M08a | Comparar frames; 390/768/1440, zoom, movimento reduzido; E11/E12; assets locais e desvios documentados |
| M09 | 4 / P0 | Fechar regressão e empacotar evidências | M03–M08 | E01–E12 verdes em matriz Chromium desktop/mobile; início/detalhe/carrinho/pagamento com baselines versionadas; relatório HTML e traces de falhas |
| M10 | 5 / P1 | Lighthouse reproduzível em build real | M08, M09 | 12 medições, 4 grupos de medianas, LCP/CLS/TBT; relatórios, configuração, versões e causas de resultados abaixo da meta |
| M11 | 5 / P0 | Preparar repositório, documentação e publicação | M09, M10; destinos de publicação | Checkout limpo executa todos os comandos; URL pública na revisão entregue; refresh/deep links, MSW, compra e tempo real funcionam publicados |

O ciclo 2 termina com a primeira compra de ponta a ponta, usando a carteira da fixture e acompanhamento REST. O ciclo 3 completa o tempo real e os fluxos de conta; o ciclo 4 consolida o visual e as evidências. Testes de cada fatia entram com ela. A ausência de acesso ao Figma não bloqueia M01/M02, mas bloqueia o aceite de fidelidade e de campos do layout.

## Registro do ciclo 0

- **Concluído:** leitura integral do enunciado (§1–12), inspeção do workspace, matriz R01–R19, proposta de arquitetura, contratos e backlog. Não havia repositório Git nem aplicação na pasta.
- **Pendente:** M01–M11; inventário visual e compatibilidade do binding em preview ainda sem evidência.
- **Problemas:** o conector do Figma recusou acesso; o link embed não pôde ser lido pela consulta web. Nenhuma inferência visual foi registrada como fato.
- **Verificação:** cobertura documental das 12 seções do enunciado e dos 12 grupos E2E. Sem testes de aplicação neste ciclo: ainda não há código executável.
- **Próxima tarefa:** M01, seguida de M02 no mesmo ciclo de fundação. Fazer M08a assim que os frames estiverem acessíveis.

## Atualização do inventário

M08a concluída no nível de planejamento. A cópia abriu e a árvore confirmou 15 frames. O [inventário](FIGMA.md) registra os nós, campos, tokens e origens dos assets. Os contextos de login desktop e carrinho mobile devem ser recuperados em M08 após o limite do conector. A implementação permanece pendente. M01 e M02 continuam na sequência do ciclo de fundação.

## Registro do ciclo 1

- **M01 concluída.** Git inicializado e lockfile disponível. O preview renderiza o catálogo por Router, Query e Axios. O Playwright comprova que o GET é respondido pelo service worker em desktop e mobile.
- **M02 concluída.** O cliente Socket.IO recebeu a revisão 2, reconectou depois do encerramento do WebSocket e recebeu a revisão 3. A leitura REST refletiu a revisão 3. A prova roda em `/demo/socket`.
- **Problema resolvido.** MSW 3 é incompatível com o peer do binding publicado. A combinação verificada usa MSW 2.10.5 e binding 0.2.0. A inicialização do worker e o formato do matcher estão documentados na arquitetura.
- **Testes.** Typecheck, lint e build do preview executados. Quatro testes Playwright passaram em Chromium nas larguras de 1440 e 390 px. O relatório HTML é gerado localmente.
- **Pendências e próxima tarefa.** M03 depende da fundação concluída e começa pelo catálogo com parâmetros na URL e pelo detalhe com acesso direto. M04 e M05 completam a primeira compra. O acabamento visual e Lighthouse ficam nos ciclos previstos.

## Registro do ciclo 2 — catálogo e detalhe

- **M03 concluída.** Catálogo com destaques, busca, filtros, ordenação e paginação. Refresh e histórico restauram a URL. Detalhe acessível diretamente com galeria, edição, quantidade limitada pelo estoque e tratamento de 404. Fixtures MSW cobrem 16 itens, vazio, lentidão e HTTP 503.
- **Testes.** Typecheck, lint e build de demonstração passaram. Dez testes Playwright cobrem E01, E02, a parte de catálogo de E12 e a fundação em Chromium a 390 e 1440 px.
- **Decisões e pendências.** Busca é aplicada ao enviar o formulário. Galeria e cards usam duas artes vetoriais provisórias e a UI é funcional. A troca pelos assets do Figma e o acabamento pertencem a M08. Adicionar ao carrinho depende de M04 e favoritos de M06.
- **Próxima tarefa.** M04, com carrinho persistente de visitante, login e merge, cupom e cotação exata em ETH.

## Registro do ciclo 2 — carrinho e login

- **M04 concluída.** Adição pelo detalhe, alteração e remoção de itens, persistência do carrinho de visitante, login com duas contas fictícias, restauração de sessão, merge único e logout. Cupom válido, inválido, expirado e removível. O handler calcula valores em wei e retorna strings em ETH.
- **Conflito de estoque.** Quando o merge excede a disponibilidade, as quantidades permanecem no carrinho e a API recusa a cotação até a correção.
- **Verificação.** Typecheck, lint e build passaram. Os 16 testes Playwright passaram em Chromium desktop e mobile, incluindo persistência, merge, isolamento entre contas, totais e recuperação de conflito.
- **Próxima tarefa.** M05, checkout com carteira simulada, cotação vinculada ao pedido, idempotência e recibo confirmado. A atualização do carrinho por eventos fica em M07 e a fidelidade visual em M08.

## Registro do ciclo 2 — checkout e pedido

- **M05 concluída.** O checkout exige sessão, permite conectar a carteira de demonstração, escolher a rede, preencher dados do colecionador e revisar a cotação. O pedido reserva estoque, sobrevive a refresh e gera recibo imutável apenas quando confirmado.
- **Problemas tratados.** Alterar o carrinho após a revisão exige nova cotação e confirmação. Recusa libera a reserva e mantém os itens. Se a resposta expira após a gravação, o checkout recupera o mesmo pedido pela chave. Repetir a mesma chave com dados diferentes retorna HTTP 409.
- **Verificação.** Typecheck, lint e build passaram. Os 24 testes Playwright passaram em Chromium desktop e mobile, incluindo revisão desatualizada, recusa, timeout, retomada após refresh e replay idempotente.
- **Próxima tarefa.** M06, com cadastro, perfil, avatar, senha, favoritos e gerenciamento de carteiras. A entrega atual usa uma carteira de demonstração por conta e consulta o estado do pedido via REST. A atualização por Socket.IO fica em M07 e a fidelidade visual em M08.

## Registro do ciclo 3 — conta do colecionador

- **M06 concluída.** Cadastro com validação de duplicidade, edição de perfil e avatar, alteração de senha, carteiras principal e secundária editáveis e favoritos com reversão após falha da API.
- **Sessão.** O checkout retoma o rascunho após expiração para o mesmo usuário. Carrinho, favoritos, pedidos e rascunhos permanecem separados por conta.
- **Verificação.** Typecheck, lint e build passaram. Os 30 testes Playwright passaram em Chromium desktop e mobile. A suíte confirmou seleção da carteira secundária no checkout e resposta 404 para recibo de outra conta.
- **Próxima tarefa.** M07 integra os eventos Socket.IO de mercado e pedidos. A adaptação visual continua em M08.

## Registro do ciclo 3 — mercado e pedidos em tempo real

- **M07 concluída.** Eventos Socket.IO atualizam as consultas de mercado e de pedidos. Alterações de preço ou estoque atualizam o carrinho e invalidam a revisão afetada. Eventos de pedido exigem a sessão do proprietário.
- **Recuperação.** O cliente descarta versões repetidas ou antigas e consulta o REST após reconectar. A simulação restaura o agendamento de pedidos pendentes após recarregar a página. O acompanhamento usa REST como contingência sem reenviar a compra.
- **Verificação.** Typecheck, lint e build passaram. Os 34 testes Playwright passaram em Chromium desktop e mobile, incluindo mudança durante a queda, estoque zerado, pedido confirmado via evento e recuperação sem duplicação.
- **Próxima tarefa.** M08, adaptar as telas ao Figma e verificar os layouts em 390, 768 e 1440 px.

## Registro do ciclo 4 — primeira entrega visual

- **M08 em andamento.** Catálogo, detalhe, carrinho e checkout receberam composição responsiva, artes exportadas e tipografia local. Perfil, carteiras e recibo usam os mesmos tokens visuais.
- **Verificação.** A suíte responsiva gerou capturas a 390, 768 e 1440 px e conferiu largura, imagens, fonte e o salto de teclado para o conteúdo.
- **Pendências.** Recuperar os contextos de login desktop e carrinho mobile, resolver as artes provisórias restantes e ajustar navegação, rodapé e composições simplificadas antes do aceite de fidelidade. M09 ainda deve estabelecer as baselines de regressão visual.

## Registro do ciclo 4 — navegação, conta e recibo

- **Entregue.** Barra inferior no mobile, indicação de rota ativa, rodapé com links do marketplace e da conta, controle de visibilidade da senha e hierarquia para os dados do recibo.
- **Verificação.** As capturas responsivas incluem a compra confirmada a 390, 768 e 1440 px. Os testes conferem também a posição da navegação e o controle de senha.
- **M08 em andamento.** Restam a comparação dos dois frames limitados pelo plano Starter, a substituição das artes provisórias e a revisão de fidelidade das composições adaptadas.

## Registro do ciclo 4 — seis telas mobile

- **Entregue.** Início e detalhes, carrinho e pagamento, login e cadastro abaixo de 768 px. As três entregas reaproveitam os contratos, as fixtures e o estado da aplicação. As diferenças em relação às capturas estão registradas no [inventário visual](FIGMA.md).
- **Evidência.** O relatório Playwright reúne as capturas das seis telas mobile e da regressão desktop. A cobertura inclui scroll e URL do catálogo, favoritos, valores em ETH, conexão, revisão, recuperação da compra e retorno após autenticação.
- **Próxima tarefa.** Encerrar a revisão visual de M08 em aparelho real e concluir a conferência das artes provisórias. Em seguida, M09 versiona as baselines e empacota as evidências.
