import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { getFavorites, updateFavorite } from '../api/account'
import { getNft } from '../api/catalog'
import { errorMessage } from '../api/http'
import { Button } from '../components/ui/button'
import { useAccountData } from './account-data'
import { useSession } from './session'

function useFavorites() {
  const { request, prefix, isCurrent } = useAccountData()
  const { session } = useSession()
  const cache = useQueryClient()
  const key = [...prefix, 'favorites']
  const busy = useIsMutating({ mutationKey: key }) > 0
  const query = useQuery({
    queryKey: key, queryFn: ({ signal }) => request((token) => getFavorites(token, signal)),
    enabled: Boolean(session), retry: false,
  })
  const mutation = useMutation({
    mutationKey: key,
    scope: { id: 'favorites-' + prefix[1] },
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      request((token) => updateFavorite(token, id, favorite)),
    async onMutate({ id, favorite }) {
      await cache.cancelQueries({ queryKey: key })
      if (!isCurrent()) return
      const previous = cache.getQueryData<string[]>(key)
      cache.setQueryData(key, (ids: string[] = []) => favorite ? [...new Set([...ids, id])] : ids.filter((value) => value !== id))
      return { previous }
    },
    onError(_error, _input, context) {
      if (isCurrent() && context?.previous) cache.setQueryData(key, context.previous)
    },
    onSettled() {
      if (isCurrent()) return cache.invalidateQueries({ queryKey: key })
    },
  })
  return { query, mutation, session, busy }
}

export function FavoriteButton({ id }: { id: string }) {
  const { query, mutation, session, busy } = useFavorites()
  if (!session) return (
    <Button asChild variant="outline" className="gap-2">
      <Link to="/login" search={{ returnTo: '/nfts/' + id }} aria-label="Entre para favoritar"><span aria-hidden="true">♡</span><span className="sr-only md:not-sr-only">Favoritar</span></Link>
    </Button>
  )
  const favorite = query.data?.includes(id) ?? false
  return (
    <div className="space-y-2">
      <Button variant="outline" className="gap-2" aria-pressed={favorite}
        disabled={query.isPending || query.isError || busy}
        onClick={() => mutation.mutate({ id, favorite: !favorite })}>
        <span aria-hidden="true">{favorite ? '♥' : '♡'}</span><span className="sr-only md:not-sr-only">{favorite ? 'Remover dos favoritos' : 'Favoritar NFT'}</span>
      </Button>
      {query.isError && <p role="alert">Não foi possível carregar os favoritos.</p>}
      {mutation.isError && <p role="alert">{errorMessage(mutation.error, 'Não foi possível atualizar os favoritos.')}</p>}
    </div>
  )
}

function FavoriteItem({ id }: { id: string }) {
  const nft = useQuery({ queryKey: ['nft', id], queryFn: ({ signal }) => getNft(id, signal), retry: false })
  return <li><Link className="text-primary underline" to="/nfts/$id" params={{ id }}>{nft.data?.name ?? id}</Link></li>
}

export function FavoritesPage() {
  const { query } = useFavorites()
  return (
    <section className="space-y-3">
      <h2 className="text-3xl font-semibold">Favoritos</h2>
      {query.isPending && <p role="status">Carregando favoritos…</p>}
      {query.isError && <p role="alert">Não foi possível carregar os favoritos.</p>}
      {query.data?.length === 0 && <p>Você ainda não tem favoritos.</p>}
      {Boolean(query.data?.length) && <ul className="space-y-2">{query.data?.map((id) => <FavoriteItem key={id} id={id} />)}</ul>}
    </section>
  )
}
