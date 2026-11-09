# Kurio Marketplace

Marketplace de NFTs simulado em React e TypeScript. Catálogo, conta, carrinho e compra usam REST e Socket.IO simulados via MSW. O [backlog](docs/BACKLOG.md) registra a evolução das entregas.

## Executar

Use Node.js 24 e npm. Em um checkout limpo:

```sh
npm ci
npm run dev
```

Para executar o build de demonstração:

```sh
npm run build
npm run preview
```

O MSW inicia automaticamente no desenvolvimento, no preview e na publicação. O projeto dispensa variáveis de ambiente e backend externo. A rota `/` consulta a API de catálogo. Em `/demo/socket`, publique um evento, interrompa a conexão, aguarde a reconexão e publique novamente. A revisão exibida chega pelo cliente Socket.IO.

Em `/`, busca, filtros, ordenação e página são restaurados pela URL. `/nfts/emerald-ape-042` abre um detalhe e `/nfts/inexistente` exercita o 404. Os testes selecionam cenários pelo controle MSW `POST /__demo/catalog`, com uma string JSON `slow`, `fail-next` ou `default`.

Adicione uma edição disponível pelo detalhe e abra `/cart`. Para testar a cotação, aplique `KURIO10` (10% de desconto), `EXPIRADO` ou um código desconhecido. Para testar a transferência do carrinho de visitante e a separação entre contas, use as credenciais fictícias abaixo.

| E-mail | Senha fictícia |
| --- | --- |
| ana@kurio.test | KurioDemo123! |
| bia@kurio.test | KurioDemo456! |

Carrinhos e sessões persistem no navegador. Para reiniciar a demonstração, feche outras abas da aplicação e execute este trecho no console de uma aba da Kurio. Isso apaga somente o estado simulado da origem atual.

```js
const reset = await fetch('/__demo/reset', { method: 'POST' })
if (!reset.ok) throw new Error('Falha ao restaurar as fixtures.')
for (const storage of [localStorage, sessionStorage]) {
  for (const key of Object.keys(storage)) {
    if (key.startsWith('kurio.')) storage.removeItem(key)
  }
}
location.assign('/')
```

Crie uma conta em `/register` ou use uma conta de demonstração. O perfil aceita avatar PNG, JPEG ou WebP de até 256 KB. Em **Carteiras**, cadastre a principal e a secundária para selecionar cada uma no pagamento. Os favoritos são gerenciados pelo detalhe do NFT e ficam disponíveis no menu da conta.

Para reproduzir falhas de conta, `POST /__demo/favorites/fail-next` faz a próxima alteração de favorito retornar 503. `POST /__demo/session/expire` expira a sessão indicada pelo cabeçalho Bearer. A próxima requisição autenticada retorna 401 e permite testar a retomada do checkout.

Para concluir uma compra simulada, adicione um NFT, abra o carrinho e selecione **Finalizar compra**. Entre, conecte a carteira de demonstração, preencha os dados fictícios e revise a cotação antes de confirmar. A página do pedido consulta o estado pela API e mostra o recibo quando o pagamento é confirmado.

Para reproduzir falhas, envie `POST /__demo/payment` com um objeto JSON contendo `scenario` igual a `connection-refused`, `reject`, `timeout-before-commit` ou `timeout-after-commit`. No primeiro timeout o pedido ainda não foi criado, e no segundo ele já está gravado. Use **Recuperar tentativa** no checkout em ambos. O cenário `confirm` restaura a confirmação padrão.

O controle `POST /__demo/socket` aceita as strings JSON `offline`, `online`, `replay` e `older`. Também aceita um objeto de atualização com `nftId`, `editionId` e pelo menos um de `priceEth` ou `available`. Por exemplo, `{"nftId":"emerald-ape-042","editionId":"limited","priceEth":"2.34"}` altera a edição limitada, invalida a revisão correspondente e atualiza a cotação do carrinho.

## Verificar

```sh
npm run typecheck
npm run lint
npx playwright install chromium
npm run test:e2e
npm run audit:lighthouse
```

O Playwright gera o relatório HTML em `playwright-report/` e preserva traces de falhas em `test-results/`. A configuração sobe o preview do build na porta 4173 e usa contextos separados para desktop e mobile.

`tests/visual.spec.ts` compara início, detalhe, carrinho e pagamento com as baselines versionadas em Chromium desktop/mobile. A geração inicial usa `npm run test:e2e -- tests/visual.spec.ts --update-snapshots=missing`. Em alterações futuras, inspecione o diff visual antes de atualizar referências. O raster de fonte pode variar entre sistemas operacionais, então reproduza com Chromium no mesmo ambiente das baselines (Windows).

A auditoria Lighthouse faz build, sobe preview na porta 4183 e executa três rodadas por página e perfil. Os 12 relatórios HTML/JSON e as medianas de categorias, LCP, CLS e TBT ficam em `audit/lighthouse/latest/`. Configure `CHROME_PATH` se quiser escolher o navegador. O comando retorna erro caso alguma mediana não atinja as metas.

## Publicação

A [aplicação publicada](https://marketplace-de-nft.vercel.app) está na Vercel. O [repositório de entrega](https://github.com/LucasArts2020/marketplace-de-nft) usa `vercel.json` para build Vite, fallback SPA e revalidação do service worker. Para rodar a suíte contra uma URL publicada, defina `KURIO_E2E_URL` com a origem HTTPS e execute `npm run test:e2e`.

Consulte o [enunciado original](docs/DESAFIO_ORIGINAL.md), a [arquitetura](ARCHITECTURE.md), os [contratos](docs/CONTRATOS.md) a [referência visual](docs/FIGMA.md) e o [relatório de entrega](FINAL_DELIVERY_REPORT.md).

## Ambiente e reprodução dos cenários

Nenhuma variável é obrigatória para a aplicação. `KURIO_E2E_URL` é opcional e usado apenas pelo Playwright para testar uma origem publicada. `CHROME_PATH` é opcional e seleciona o executável Chromium/Chrome/Edge para Lighthouse. Não há chaves de API, conta Vercel ou arquivo `.env` necessários para executar localmente.

| Comando | Finalidade |
| --- | --- |
| `npm ci` | Instalar exatamente o lockfile |
| `npm run dev` | Desenvolvimento com mocks ativos |
| `npm run build` | Gerar dist com mocks incluídos |
| `npm run preview` | Servir o build local |
| `npm run typecheck` | Verificar TypeScript |
| `npm run lint` | Verificar ESLint |
| `npx playwright install chromium` | Instalar navegador de testes |
| `npm run test:e2e` | Build, preview e testes desktop/mobile |
| `npm run audit:lighthouse` | Build, preview e 12 auditorias com metas |

Em Linux, a instalação do navegador pode exigir `npx playwright install --with-deps chromium`. As baselines visuais fornecidas são Windows. Para comparar em outro sistema, gere e revise as referências desse sistema explicitamente, sem tratar diferenças de rasterização como aprovação automática.

Execute os comandos abaixo no console do navegador com a aplicação já carregada. O MSW intercepta chamadas nessa aba. Chamadas via curl, terminal ou cliente HTTP externo não selecionam cenários do navegador. Recarregar restaura controles em memória, portanto selecione a falha e execute a ação na mesma aba, sem refresh intermediário.

```js
async function demo(path, body, authenticated = false) {
  const response = await fetch('/__demo/' + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authenticated ? { Authorization: 'Bearer ' + localStorage.getItem('kurio.session') } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  if (!response.ok) throw new Error(await response.text())
  return response.status
}
```

| Cenário e comando | Ação e resultado esperado |
| --- | --- |
| `await demo('catalog', 'fail-next')` | Trocar uma aba/filtro do catálogo, observar erro 503 e tentar novamente |
| `await demo('catalog', 'slow')` | Buscar Emerald e depois outro termo rapidamente, sem exibir a resposta antiga sobre a nova |
| `await demo('catalog', 'default')` | Restaurar latência padrão |
| `await demo('favorites/fail-next')` | Autenticado, favoritar um NFT, observar erro e rollback |
| `await demo('session/expire', undefined, true)` | Autenticado, realizar próxima consulta privada, observar 401 e entrar novamente |
| `await demo('payment', { scenario: 'connection-refused' })` | Tentar conectar carteira e observar recusa |
| `await demo('payment', { scenario: 'reject' })` | Revisar e confirmar compra, observar pedido recusado e reserva liberada |
| `await demo('payment', { scenario: 'timeout-before-commit' })` | Confirmar, aguardar timeout e usar Recuperar tentativa, com a mesma chave |
| `await demo('payment', { scenario: 'timeout-after-commit' })` | Confirmar, aguardar timeout e recuperar o pedido já criado, sem duplicar |
| `await demo('payment', { scenario: 'confirm' })` | Restaurar confirmação padrão para novas tentativas |
| `await demo('socket', 'offline')` | Interromper conexão e observar estado/polling de contingência |
| `await demo('socket', 'online')` | Reconectar e revalidar recursos ativos pelo REST |
| `await demo('socket', { nftId: 'emerald-ape-042', editionId: 'limited', priceEth: '2.34' })` | Atualizar detalhe/carrinho, invalidar revisão anterior |
| `await demo('socket', 'replay')` ou `await demo('socket', 'older')` | Após publicar uma mudança, ignorar duplicata/versão antiga |

Para estoque, substitua priceEth por `available: 0` na atualização. Para catálogo vazio, busque um termo inexistente. Para cupom, use KURIO10, EXPIRADO e INVALIDO no carrinho. Para isolamento, conclua um pedido como Ana e abra sua URL como Bia, que não deve conseguir consultá-lo. O reset completo está na seção Executar e deve ser usado entre experimentos que alterem estoque, contas ou pedidos.

No PowerShell, teste o deploy com:

```powershell
$env:KURIO_E2E_URL = 'https://marketplace-de-nft.vercel.app'
npm.cmd run test:e2e
Remove-Item Env:KURIO_E2E_URL
```

Código-fonte, `package-lock.json`, `public/art`, `public/mockServiceWorker.js`, fixtures em `src/mocks`, testes, baselines, `playwright.config.ts`, `scripts/lighthouse.mjs` e `vercel.json` compõem a entrega. A publicação não requer credenciais privadas para uso. Mantenha o projeto Vercel e o domínio ativos durante a avaliação.
