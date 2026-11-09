import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { getWalletSettings, saveWalletSettings } from '../api/account'
import { errorMessage } from '../api/http'
import { Button } from '../components/ui/button'
import { walletProviders, type WalletSettings } from '../contracts/account'
import { useAccountData } from './account-data'
import { accountInput } from './account-layout'

const fields = [
  ['displayName', 'Nome da carteira'], ['nickname', 'Apelido da carteira'],
  ['network', 'Rede'], ['profileName', 'Nome do perfil'],
  ['address', 'Endereço da carteira'], ['alternateWalletReference', 'ENS ou endereço secundário'],
  ['provider', 'Tipo de carteira'], ['referralCode', 'Código de indicação'],
  ['email', 'E-mail'], ['ensName', 'Nome ENS'],
] as const

function WalletForm({ slot, wallet, defaults = wallet }: {
  slot: 'primary' | 'secondary'
  wallet?: WalletSettings
  defaults?: WalletSettings
}) {
  const { request, prefix, isCurrent } = useAccountData()
  const cache = useQueryClient()
  const errorId = useId()
  const [addressInvalid, setAddressInvalid] = useState(false)
  const mutation = useMutation({
    mutationFn: (data: FormData) => request((token) => saveWalletSettings(token, slot, Boolean(wallet), data)),
    onSuccess: () => {
      if (isCurrent()) return cache.invalidateQueries({ queryKey: [...prefix, 'wallets'] })
    },
  })

  return (
    <form className="space-y-5 text-sm" aria-describedby={mutation.isError ? errorId : undefined} onSubmit={(event) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      setAddressInvalid(!/^0x[\da-f]{40}$/i.test(String(data.get('address')).trim()))
      const ens = String(data.get('ensName') ?? '').trim()
      if (ens && !ens.includes('.')) data.set('ensName', ens + '.eth')
      mutation.mutate(data)
    }} aria-label={slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'}>
      <div className="grid gap-x-7 gap-y-5 lg:grid-cols-2">
        {fields.map(([name, label]) => (
          <label key={name} className="grid min-w-0 gap-1">{label}
            {name === 'network' ? (
              <select name={name} className={accountInput} defaultValue={defaults?.networks[0] ?? 'ethereum'}>
                <option value="ethereum">Ethereum</option><option value="polygon">Polygon</option>
              </select>
            ) : name === 'provider' ? (
              <select name={name} className={accountInput} defaultValue={defaults?.provider}>
                {walletProviders.map((provider) => <option key={provider}>{provider}</option>)}
              </select>
            ) : (
              <span className="flex gap-2">
                {name === 'ensName' && <span aria-hidden="true" className="grid shrink-0 place-items-center rounded border border-edge px-2 text-secondary">.eth</span>}
                <input name={name}
                  aria-describedby={mutation.isError ? errorId : undefined}
                  aria-invalid={name === 'address' && mutation.isError && addressInvalid || undefined}
                  onChange={name === 'address' ? () => setAddressInvalid(false) : undefined}
                  defaultValue={name === 'ensName' ? defaults?.ensName?.replace(/\.eth$/, '') : defaults?.[name] ?? (name === 'displayName' ? defaults?.provider : undefined)}
                  placeholder={name === 'address' ? 'Endereço 0x da carteira' : name === 'alternateWalletReference' ? 'Opcional' : undefined}
                  required={name === 'address' || name === 'displayName'} maxLength={name === 'email' ? 250 : 120}
                  type={name === 'email' ? 'email' : 'text'} className={accountInput} />
              </span>
            )}
          </label>
        ))}
      </div>
      {mutation.isError && <p id={errorId} role="alert">{errorMessage(mutation.error, 'Não foi possível salvar a carteira.')}</p>}
      {mutation.isSuccess && <p role="status">Carteira salva.</p>}
      <Button className="min-h-10 text-xs" disabled={mutation.isPending}>Salvar carteira</Button>
    </form>
  )
}

export function WalletsPage() {
  const { request, prefix } = useAccountData()
  const [secondaryMode, setSecondaryMode] = useState<'blank' | 'copy'>()
  const wallets = useQuery({ queryKey: [...prefix, 'wallets'], queryFn: ({ signal }) => request((token) => getWalletSettings(token, signal)), retry: false })
  if (wallets.isPending) return <p role="status">Carregando carteiras…</p>
  if (wallets.isError) return <p role="alert">{errorMessage(wallets.error, 'Não foi possível carregar as carteiras.')}</p>
  const primary = wallets.data.find((wallet) => wallet.id === 'primary')
  const secondary = wallets.data.find((wallet) => wallet.id === 'secondary')

  return (
    <section className="space-y-8">
      <h1 className="sr-only">Gerenciar carteiras</h1>
      <section className="space-y-5" aria-labelledby="wallet-primary">
        <div className="space-y-1">
          <h2 id="wallet-primary" className="text-base font-bold">Carteira principal</h2>
          <p className="text-xs text-secondary">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        </div>
        <WalletForm slot="primary" wallet={primary} />
      </section>
      <section className="space-y-4" aria-labelledby="wallet-secondary">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <h2 id="wallet-secondary" className="text-base font-bold">Carteira secundária</h2>
            {!secondary && !secondaryMode && <p className="text-xs text-secondary">Você ainda não adicionou uma carteira secundária.</p>}
          </div>
          {!secondary && !secondaryMode && (
            <div className="flex flex-wrap gap-4 text-xs">
              {primary && <button type="button" className="min-h-9 text-secondary underline" onClick={() => setSecondaryMode('copy')}>Usar dados da principal</button>}
              <button type="button" className="min-h-9 font-bold text-accent" onClick={() => setSecondaryMode('blank')}>Adicionar</button>
            </div>
          )}
        </div>
        {(secondary || secondaryMode) && (
          <WalletForm slot="secondary" wallet={secondary} defaults={secondary ?? (secondaryMode === 'copy' ? primary : undefined)} />
        )}
      </section>
    </section>
  )
}
