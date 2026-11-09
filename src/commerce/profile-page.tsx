import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useRef, useState } from 'react'
import { changePassword, getProfile, saveProfile } from '../api/account'
import { errorMessage } from '../api/http'
import { Button } from '../components/ui/button'
import { profileFields, type Profile } from '../contracts/account'
import { useAccountData } from './account-data'
import { accountInput } from './account-layout'

function PasswordField({ name, label, errorId, invalid }: { name: string; label: string; errorId?: string; invalid?: boolean }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="grid gap-1">
      <label htmlFor={`profile-password-${name}`}>{label}</label>
      <div className="relative">
        <input id={`profile-password-${name}`} name={name} type={visible ? 'text' : 'password'} required minLength={8} maxLength={256}
          aria-describedby={errorId} aria-invalid={invalid || undefined}
          autoComplete={name === 'current' ? 'current-password' : 'new-password'} className={accountInput + ' pr-12'} />
        <button type="button" aria-label={visible ? 'Ocultar caracteres' : 'Mostrar caracteres'} aria-controls={`profile-password-${name}`}
          aria-pressed={visible} onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-accent"><span aria-hidden="true">{visible ? '◉' : '⊘'}</span></button>
      </div>
    </div>
  )
}

async function readAvatar(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 256 * 1024) {
    throw new Error('Use uma imagem PNG, JPEG ou WebP de até 256 KB.')
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

export function ProfilePage() {
  const { prefix, request, isCurrent } = useAccountData()
  const cache = useQueryClient()
  const key = [...prefix, 'profile']
  const profile = useQuery({ queryKey: key, queryFn: ({ signal }) => request((token) => getProfile(token, signal)), retry: false })
  const save = useMutation({
    mutationFn: (data: Profile) => request((token) => saveProfile(token, data)),
    onSuccess: (data) => {
      if (!isCurrent()) return
      cache.setQueryData(key, data)
      void cache.invalidateQueries({ queryKey: [...prefix, 'session'] })
    },
  })
  const password = useMutation({
    gcTime: 0,
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      request((token) => changePassword(token, current, next)),
  })
  const [avatarError, setAvatarError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const avatarErrorId = useId()
  const profileErrorId = useId()
  const passwordErrorId = useId()
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [readingAvatar, setReadingAvatar] = useState(false)
  const [avatarFileName, setAvatarFileName] = useState('')
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const avatarInput = useRef<HTMLInputElement>(null)

  if (profile.isPending) return <p role="status">Carregando perfil…</p>
  if (profile.isError) return <p role="alert">{errorMessage(profile.error, 'Não foi possível carregar o perfil.')}</p>
  const data = profile.data

  return (
    <section className="space-y-6 text-sm">
      <h1 className="text-base font-bold md:text-lg">Perfil do colecionador</h1>
      <form className="space-y-4" aria-describedby={save.isError ? profileErrorId : undefined} onSubmit={async (event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const file = form.get('avatar')
        let avatar = removeAvatar ? null : data.avatar
        setAvatarError('')
        setReadingAvatar(true)
        try {
          if (file instanceof File && file.size && !removeAvatar) avatar = await readAvatar(file)
        } catch (error) {
          setAvatarError((error as Error).message)
          return
        } finally {
          setReadingAvatar(false)
        }
        const values = Object.fromEntries(profileFields.map(([name]) => [name, String(form.get(name) ?? '')]))
        if (values.ensName && !values.ensName.includes('.')) values.ensName += '.eth'
        save.mutate({ ...values, avatar } as Profile, {
          onSuccess: () => {
            if (avatarInput.current) avatarInput.current.value = ''
            setAvatarFileName('')
            setRemoveAvatar(false)
          },
        })
      }}>
        <div className="grid gap-x-7 gap-y-5 lg:grid-cols-2">
        {profileFields.map(([name, label]) => (
          <label key={name} className="grid min-w-0 gap-1">{label}
            <span className="flex gap-2">
            {name === 'ensName' && <span aria-hidden="true" className="grid shrink-0 place-items-center rounded border border-edge px-2 text-secondary">.eth</span>}
            <input name={name} defaultValue={name === 'ensName' ? data[name].replace(/\.eth$/, '') : data[name]} type={name === 'email' ? 'email' : 'text'}
              aria-describedby={save.isError ? profileErrorId : undefined}
              required={name === 'displayName' || name === 'username' || name === 'email'}
              maxLength={name === 'email' ? 250 : name === 'username' ? 32 : 120} className={accountInput} />
            </span>
          </label>
        ))}
        <div className="min-w-0 space-y-1">
          <p>Avatar</p>
          <div className="flex flex-wrap items-center gap-3">
            {data.avatar && !removeAvatar
              ? <img src={data.avatar} width="48" height="48" alt="Avatar do perfil" className="size-12 rounded-full object-cover" />
              : <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-surface text-xl text-accent">♙</span>}
            <input ref={avatarInput} name="avatar" aria-label="Avatar" type="file" accept="image/png,image/jpeg,image/webp" tabIndex={-1}
              aria-describedby={avatarError ? avatarErrorId : undefined} aria-invalid={Boolean(avatarError) || undefined}
              className="sr-only" onChange={(event) => {
                setAvatarFileName(event.target.files?.[0]?.name ?? '')
                setRemoveAvatar(false)
              }} />
            <Button type="button" aria-describedby={avatarError ? avatarErrorId : undefined} className="min-h-9 px-4 text-xs" onClick={() => avatarInput.current?.click()}>Alterar</Button>
            {(data.avatar || avatarFileName) && !removeAvatar && <button type="button" className="min-h-9 text-xs underline" onClick={() => {
              if (avatarInput.current) avatarInput.current.value = ''
              setAvatarFileName('')
              setRemoveAvatar(true)
            }}>Remover avatar</button>}
          </div>
          {avatarFileName && <p className="break-all text-xs text-secondary">{avatarFileName}</p>}
          {removeAvatar && <p className="text-xs text-secondary">O avatar será removido ao salvar.</p>}
        </div>
        </div>
        {avatarError && <p id={avatarErrorId} role="alert">{avatarError}</p>}
        {save.isError && <p id={profileErrorId} role="alert">{errorMessage(save.error, 'Não foi possível salvar o perfil.')}</p>}
        {save.isSuccess && <p role="status">Perfil salvo.</p>}
        <Button className="min-h-10 text-xs" disabled={save.isPending || readingAvatar}>Salvar perfil</Button>
      </form>
      <form className="space-y-4 lg:max-w-[calc((100%-1.75rem)/2)]" aria-describedby={passwordError ? passwordErrorId : undefined}
        onChange={() => { setPasswordError(''); setPasswordMismatch(false) }} onSubmit={async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const fields = new FormData(form)
        const current = String(fields.get('current'))
        const next = String(fields.get('next'))
        setPasswordSaved(false)
        setPasswordError('')
        setPasswordMismatch(false)
        if (next !== fields.get('confirmation')) {
          setPasswordMismatch(true)
          setPasswordError('As senhas devem ser iguais.')
          form.querySelector<HTMLInputElement>('[name="confirmation"]')?.focus()
          return
        }
        try {
          await password.mutateAsync({ current, next })
          form.reset()
          setPasswordSaved(true)
        } catch (error) {
          setPasswordError(errorMessage(error, 'Não foi possível alterar a senha.'))
        } finally {
          password.reset()
        }
      }}>
        <h2 className="font-bold">Alterar senha</h2>
        {[['current', 'Senha atual'], ['next', 'Nova senha'], ['confirmation', 'Confirmar nova senha']].map(([name, label]) => (
          <PasswordField key={name} name={name} label={label}
            errorId={passwordError && (!passwordMismatch || name === 'confirmation') ? passwordErrorId : undefined}
            invalid={passwordMismatch && name === 'confirmation'} />
        ))}
        {passwordError && <p id={passwordErrorId} role="alert">{passwordError}</p>}
        {passwordSaved && <p role="status">Senha alterada.</p>}
        <Button className="min-h-10 text-xs" disabled={password.isPending}>Alterar senha</Button>
      </form>
    </section>
  )
}
