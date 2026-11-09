import { useState, type CSSProperties } from 'react'
import { Button } from '../components/ui/button'

const format = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function PriceRange({ minPrice, maxPrice, onApply }: {
  minPrice: string
  maxPrice: string
  onApply: (prices: { minPrice: string; maxPrice: string }) => void
}) {
  const [min, setMin] = useState(Number(minPrice || '0.02'))
  const [max, setMax] = useState(Math.max(min, Number(maxPrice || '12.30')))
  const ceiling = Math.max(16, Math.ceil(Number(minPrice || 0)), Math.ceil(Number(maxPrice || 0)))
  const track = { '--range-start': `${min / ceiling * 100}%`, '--range-end': `${max / ceiling * 100}%` } as CSSProperties
  const minimumOnTop = max === ceiling && max - min < ceiling / 50

  return (
    <form onSubmit={(event) => {
      event.preventDefault()
      onApply({
        minPrice: minPrice && min === Number(minPrice) ? minPrice : String(min),
        maxPrice: maxPrice && max === Number(maxPrice) ? maxPrice : String(max),
      })
    }}>
      <fieldset className="min-w-0">
        <legend className="text-sm font-bold">Faixa de preço</legend>
        <div className="px-3">
          <div className="catalog-price-track" style={track}>
            <input type="range" aria-label="Mínimo ETH" aria-valuetext={format.format(min) + ' ETH'}
              className={minimumOnTop ? 'z-10' : undefined}
              min={0} max={ceiling} step="0.01" value={min} onChange={(event) => setMin(Math.min(event.target.valueAsNumber, max))} />
            <input type="range" aria-label="Máximo ETH" aria-valuetext={format.format(max) + ' ETH'}
              min={0} max={ceiling} step="0.01" value={max} onChange={(event) => setMax(Math.max(event.target.valueAsNumber, min))} />
          </div>
          <p className="mb-2 text-xs">Preço: {format.format(min)} – {format.format(max)} ETH</p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="min-h-9 rounded px-3 text-xs">Aplicar</Button>
            {(minPrice || maxPrice) && (
              <Button type="button" variant="outline" className="min-h-9 rounded px-3 text-xs"
                onClick={() => onApply({ minPrice: '', maxPrice: '' })}>Limpar preço</Button>
            )}
          </div>
        </div>
      </fieldset>
    </form>
  )
}
