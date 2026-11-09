# Kurio Marketplace

Marketplace de NFTs simulado em React e TypeScript. O catálogo e o detalhe consultam fixtures via MSW. O [backlog](docs/BACKLOG.md) registra os próximos fluxos.

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
