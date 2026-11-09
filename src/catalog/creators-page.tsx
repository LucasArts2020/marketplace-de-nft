import { useQuery } from '@tanstack/react-query'
import { http } from '../api/http'
import type { CreatorProfile } from '../contracts/catalog'
import { Button } from '../components/ui/button'
import { NftCardView } from './catalog-page'

export function CreatorsPage() {
  const profiles = useQuery({
    queryKey: ['catalog', 'creators'],
    queryFn: async ({ signal }) => (await http.get<CreatorProfile[]>('/api/v1/creators', { signal })).data,
    retry: false,
  })

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">Criadores</h1>
      <p className="text-sm text-secondary">Conheça os perfis e os NFTs que fazem parte de suas coleções.</p>
      {profiles.isPending && <p role="status">Carregando perfis…</p>}
      {profiles.isError && <div className="space-y-3">
        <p role="alert">Não foi possível carregar os criadores.</p>
        <Button onClick={() => void profiles.refetch()}>Tentar novamente</Button>
      </div>}
      {profiles.data?.length === 0 && <p>Nenhum perfil disponível.</p>}
      <div className="grid gap-5 lg:grid-cols-3">
        {profiles.data?.map((profile) => (
          <article key={profile.id} className="min-w-0 space-y-4 rounded-xl border border-edge bg-card p-4" aria-labelledby={`creator-${profile.id}`}>
            <div className="flex items-center gap-3">
              <img src={profile.avatar.src} alt={profile.avatar.alt} width="64" height="64" className="size-16 rounded-full object-cover" />
              <div>
                <h2 id={`creator-${profile.id}`} className="font-bold">{profile.name}</h2>
                <p className="text-sm text-secondary">{profile.handle}</p>
              </div>
            </div>
            <h3 className="border-t border-edge pt-4 text-sm font-bold text-accent">NFTs da coleção ({profile.ownedNfts.length})</h3>
            {profile.ownedNfts.length ? <ul className="grid grid-cols-2 gap-3">
              {profile.ownedNfts.map((item) => <NftCardView key={item.id} item={item} />)}
            </ul> : <p className="text-sm text-secondary">Este perfil ainda não possui NFTs.</p>}
          </article>
        ))}
      </div>
    </section>
  )
}
