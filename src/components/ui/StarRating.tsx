import { useState } from 'react'
import { Star } from 'lucide-react'

type StarRatingProps = {
  value: number // 0 to 5
  onChange?: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  readOnly?: boolean
  className?: string
  showValue?: boolean
}

export function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  disabled = false,
  readOnly = false,
  className = '',
  showValue = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const isInteractive = Boolean(onChange) && !disabled && !readOnly

  const sizeClass =
    size === 'sm'
      ? 'h-3.5 w-3.5'
      : size === 'lg'
        ? 'h-6 w-6'
        : 'h-4 w-4 sm:h-5 sm:w-5'

  const activeValue = hoverValue !== null ? hoverValue : value

  return (
    <div className={`inline-flex items-center gap-0.5 sm:gap-1 ${className}`}>
      {Array.from({ length: max }, (_, index) => {
        const starNumber = index + 1
        const isFilled = starNumber <= activeValue

        return (
          <button
            key={starNumber}
            type="button"
            disabled={!isInteractive}
            onClick={() =>
              isInteractive && onChange?.(starNumber === value ? 0 : starNumber)
            }
            onMouseEnter={() => isInteractive && setHoverValue(starNumber)}
            onMouseLeave={() => isInteractive && setHoverValue(null)}
            className={`transition-all duration-150 p-0.5 rounded focus:outline-none ${
              isInteractive
                ? 'cursor-pointer hover:scale-125 focus-visible:ring-1 focus-visible:ring-gold'
                : 'cursor-default'
            }`}
            title={`${starNumber} / ${max}`}
          >
            <Star
              className={`${sizeClass} transition-colors ${
                isFilled
                  ? 'fill-gold text-gold drop-shadow-[0_0_4px_rgba(201,162,75,0.4)]'
                  : 'fill-transparent text-chalk/25 hover:text-gold/50'
              }`}
            />
          </button>
        )
      })}
      {showValue ? (
        <span className="ml-1 text-xs font-bold text-gold font-mono">
          {value > 0 ? `${value}/${max}` : '-'}
        </span>
      ) : null}
    </div>
  )
}
