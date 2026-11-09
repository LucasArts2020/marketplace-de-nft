import { Link } from '@tanstack/react-router'
import { Button } from '../components/ui/button'

const articles = [
  {
    title: 'Como funciona a propriedade de NFTs', art: '9add2', date: '12 de setembro', minutes: 6,
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    body: 'Confira o endereço do contrato, o identificador do token e o histórico de transferências. O token registra a titularidade do NFT. Os direitos de uso da obra dependem da licença da coleção.',
  },
  {
    title: 'Artistas digitais para acompanhar', art: '8f387', date: '13 de setembro', minutes: 2,
    description: 'Conheça criadores que moldam a cultura digital.',
    body: 'Explore portfólios, exposições e comunidades de arte digital. Acompanhe as coleções pelo trabalho dos artistas, pelos processos de criação e pelas obras que mais despertam seu interesse.',
  },
  {
    title: 'Raridade, atributos e procedência', art: '83794', date: '15 de setembro', minutes: 3,
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    body: 'Compare atributos dentro da mesma coleção e verifique a origem do token. A raridade descreve a frequência de um atributo e pode ser avaliada junto com a autenticidade e as condições de uso.',
  },
  {
    title: 'Como proteger sua carteira', art: 'b7cfc', date: '15 de setembro', minutes: 2,
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
    body: 'Guarde sua frase de recuperação offline e em local seguro. Verifique o endereço do site e leia as permissões de cada transação antes de assinar.',
  },
]

export function HomeEditorial() {
  return (
    <div className="space-y-12 pt-8 md:space-y-24 md:pt-16">
      <section aria-label="Destaques do mercado" className="grid gap-5 md:grid-cols-2 md:gap-8">
        <article className="grid min-w-0 grid-cols-2 items-stretch overflow-hidden rounded-xl bg-card">
          <img src="/art/8f387-480.webp" alt="" width="480" height="480" loading="lazy" className="h-full min-h-44 w-full rounded-xl object-cover md:min-h-60" />
          <div className="flex flex-col items-start justify-center gap-3 p-3 sm:p-5">
            <h2 className="text-sm font-bold sm:text-base">Lançamentos gênesis de edição limitada</h2>
            <p className="text-xs leading-relaxed text-secondary">Colecione edições escassas diretamente dos criadores antes da revelação pública.</p>
            <Button asChild className="mt-1 min-h-9 px-3 text-xs">
              <Link to="/" hash="catalog-title" search={{ tab: 'new' }} aria-label="Explorar lançamentos">Explorar <span aria-hidden="true">→</span></Link>
            </Button>
          </div>
        </article>
        <article className="grid min-w-0 grid-cols-2 items-stretch overflow-hidden rounded-xl bg-card">
          <img src="/art/9add2-480.webp" alt="" width="480" height="480" loading="lazy" className="h-full min-h-44 w-full rounded-xl object-cover md:min-h-60" />
          <div className="flex flex-col items-start justify-center gap-3 p-3 sm:p-5">
            <h2 className="text-sm font-bold sm:text-base">Arte digital selecionada e muito mais</h2>
            <p className="text-xs leading-relaxed text-secondary">Explore novos artistas, coleções e obras digitais que definem a cultura.</p>
            <Button asChild className="mt-1 min-h-9 px-3 text-xs">
              <Link to="/" hash="catalog-title" search={{ category: ['Arte digital'] }} aria-label="Explorar arte">Explorar <span aria-hidden="true">→</span></Link>
            </Button>
          </div>
        </article>
      </section>

      <section id="diario-da-cunhagem" tabIndex={-1} aria-labelledby="diario-titulo" className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 id="diario-titulo" className="text-xl font-bold md:text-2xl">Diário da Cunhagem</h2>
          <p className="text-xs text-secondary md:text-sm">Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
        </div>
        <div className="grid grid-cols-2 items-start gap-3 lg:grid-cols-4 lg:gap-6">
          {articles.map((article) => (
            <article key={article.title} className="min-w-0 overflow-hidden rounded-t-xl bg-card">
              <img src={`/art/${article.art}-480.webp`} alt="" width="480" height="360" loading="lazy" className="aspect-4/3 w-full object-cover" />
              <div className="space-y-2 p-3 sm:p-4">
                <p className="text-xs text-secondary">{article.date} · Leitura de {article.minutes} min</p>
                <h3 className="text-sm font-bold">{article.title}</h3>
                <p className="text-xs leading-relaxed text-secondary">{article.description}</p>
                <details className="text-xs leading-relaxed">
                  <summary className="min-h-8 cursor-pointer py-1 text-accent">Ler mais<span className="sr-only"> sobre {article.title}</span></summary>
                  <p className="pt-1">{article.body}</p>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

const footerTopics = [
  ['W', 'Segurança da carteira', 'Proteja sua carteira e colecione arte digital verificada com confiança.'],
  ['C', 'Criadores em destaque', 'Conheça artistas, estúdios e comunidades que moldam a cultura digital.'],
  ['D', 'Alertas de lançamentos', 'Acompanhe novos projetos, edições limitadas e coleções em alta.'],
]

export function HomeFooter() {
  return (
    <footer className="market-footer mt-5 bg-card md:mt-12">
      <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
        {footerTopics.map(([letter, title, description]) => (
          <section key={title} className="space-y-2 lg:border-r lg:border-edge lg:pr-4">
            <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-primary text-base font-bold text-ink">{letter}</span>
            <h2 className="font-bold text-foreground">{title}</h2>
            <p>{description}</p>
          </section>
        ))}
        <section className="min-w-0 space-y-2">
          <h2 className="font-bold text-foreground">Antecipe-se ao próximo lançamento</h2>
          <div className="flex min-w-0 gap-1">
            <input type="email" aria-label="E-mail para novidades" placeholder="digite seu e-mail..." disabled
              className="min-h-9 min-w-0 flex-1 rounded bg-surface px-2 text-xs" />
            <Button disabled className="min-h-9 px-2 text-xs">Enviar</Button>
          </div>
          <p>Inscrição em novidades indisponível na demonstração.</p>
        </section>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface px-5 py-4 lg:px-8">
        <Link to="/" className="font-bold tracking-widest text-foreground">KURIO</Link>
        <p>Feito para colecionadores, criadores e cultura.</p>
      </div>
      <div className="grid grid-cols-2 gap-5 px-5 py-6 lg:grid-cols-4 lg:px-8">
        <section className="space-y-2">
          <h2 className="font-bold text-foreground">Meu perfil</h2>
          <ul className="space-y-1">
            <li><Link to="/profile" className="hover:underline">Minha conta</Link></li>
            <li><Link to="/favorites" className="hover:underline">NFTs salvos</Link></li>
            <li><Link to="/wallets" className="hover:underline">Minhas carteiras</Link></li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="font-bold text-foreground">Aprenda</h2>
          <Link to="/" hash="diario-da-cunhagem" className="hover:underline">Diário da Cunhagem</Link>
        </section>
        <section className="space-y-2">
          <h2 className="font-bold text-foreground">Coleções</h2>
          <ul className="space-y-1">
            {['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'].map((category) => (
              <li key={category}><Link to="/" hash="catalog-title" search={{ category: [category] }} className="hover:underline">{category}</Link></li>
            ))}
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="font-bold text-foreground">Carteiras compatíveis</h2>
          <p>MetaMask · WalletConnect · Coinbase Wallet</p>
        </section>
      </div>
      <p className="bg-ink px-5 py-3 text-center text-xs">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
