# Matriz de rastreabilidade

O README original, seções 1–12, é a fonte funcional. A instrução do solicitante determina a ordem do trabalho, com planejamento seguido por ciclos de código. O [inventário do Figma](FIGMA.md) registra a referência visual. Estados ausentes seguem a identidade do design.

Todas as evidências abaixo são **previstas**, não resultados executados. P0 indica fundação ou requisito eliminatório; P1 e P2 continuam obrigatórios.

| ID | README | Requisito verificável | Tarefa | Evidência para aceite |
| --- | --- | --- | --- | --- |
| R01 | §1–4, 11 | Stack obrigatória efetiva; mocks de autenticação, carteira e pagamento; sem integração real | M01–M10 | Build e revisão de imports/caminhos executados; compra E06 |
| R02 | §3–5 | Início com destaques e catálogo; busca, filtros combinados, ordenação, página, refresh e histórico | M03 | E01: URL, parâmetros REST e resultados concordam; filtro reseta página; histórico restaura |
| R03 | §3–4 | Galeria, informações, seleção de edição/quantidade, acesso direto, inexistente e estoque | M03 | E02: deep link, 404, edição indisponível e limites |
| R04 | §3–4 | Favoritos privados e persistentes, atualização otimista com rollback | M06 | E04: adicionar/remover, falha reverte, refresh e troca de conta |
| R05 | §3, 5 | Carrinho persistente; incluir, alterar, remover e preservar itens do visitante no login | M04 | E05: refresh, merge único, conflito de estoque visível e isolamento |
| R06 | §3, 5 | Cupom válido, inválido, expirado e removível; cotação autoritativa com ETH decimal | M04 | E05 e testes de domínio: subtotal, desconto, taxa, total e precisão até 18 casas |
| R07 | §3, 5 | Checkout autenticado, campos do layout, carteira/rede, conexão/recusa/desconexão e revisão | M05 | E06/E07: formulário, carteira cadastrada, revisão e tentativa recusada |
| R08 | §3, 5, 7 | Revalidar cotação; mudança exige nova confirmação; idempotência inclusive após timeout | M05, M07 | E07/E09: preço/estoque mudam, chave repetida recupera pedido; payload diferente dá conflito |
| R09 | §3, 7 | Pendente, confirmado e recusado; recuperação; recibo imutável; baixa parcial apenas em sucesso | M05, M07 | E06/E07/E10: falha mantém itens; sucesso baixa quantidade uma vez; recibo não muda |
| R10 | §3–5 | Cadastro, login, sessão restaurável, expiração na navegação/checkout, logout e retorno seguro | M04, M06 | E03/E07: 401, retomada autenticada, conflito de cadastro e troca A→B |
| R11 | §3, 5 | Perfil, avatar, senha e carteiras principal/secundária, com validação e persistência | M06 | E08: alterações persistem; senhas sem texto puro; erros junto aos campos |
| R12 | §4–5 | Contratos tipados, rotas inválidas, cache isolado, cancelamento, invalidação e erros | M01, M03–M07 | E01/E03/E12 e revisão de contratos: 400/401/403/404/409/422/5xx |
| R13 | §6 | MSW em desenvolvimento, demonstração e testes; fixtures, reset integral e falhas reproduzíveis | M01–M07 | E01–E12; rodadas independentes com o mesmo resultado, sem fallback na UI |
| R14 | §6–7 | MSW + cliente Socket.IO real; eventos com versão, descarte de duplicatas, reconciliação e limpeza | M02, M07 | E09/E10: evento cruza transporte; REST reconcilia após queda; sessão anterior é descartada |
| R15 | §3, 8 | Frames desktop/mobile; todas as telas a 390/768/1440; assets locais e ações fora do escopo coerentes | M08 | Comparação por frame; checklist de larguras; desvios e substituições registrados |
| R16 | §8 | Skeleton com shimmer, dimensões estáveis, movimento reduzido; teclado, foco, labels, alt, contraste, zoom e feedback | M03–M08 | E11/E12, inspeção manual de contraste/zoom e validação nos três tamanhos |
| R17 | §9, 11 | Doze grupos E2E, Chromium desktop/mobile, snapshots das quatro telas, HTML e traces | M03–M09 | Relatório Playwright; baselines versionadas e dados isolados |
| R18 | §10 | Lighthouse em início e detalhe, desktop/mobile, três rodadas por combinação | M10 | 12 execuções HTML/JSON; medianas P≥90/A≥95/BP≥95/SEO≥90, LCP/CLS/TBT, causas de desvios |
| R19 | §11–12 | Checkout limpo, lockfile, documentação, repo e deploy público da revisão entregue | M11 | Clone e comandos reproduzidos; smoke da URL pública com deep links, MSW e Socket.IO |

E01–E12 correspondem aos itens numerados da seção 9, na mesma ordem. Regressão visual e Lighthouse têm evidências separadas. Ausência de stack efetiva, fluxo principal apenas visual, confirmação sem resposta simulada, vazamento entre contas, Socket.IO contornado ou falta de E2E executável impedem a entrega.
