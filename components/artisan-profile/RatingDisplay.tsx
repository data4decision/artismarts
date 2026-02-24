import { FaStar } from 'react-icons/fa'

type Props = {
  average?: number | null
  count?: number | null
}

export default function RatingDisplay({ average, count }: Props) {
  const rating = average ?? 0
  const stars = Math.round(rating)

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="flex items-center gap-3">
        <div className="text-5xl font-bold text-[var(--blue)]">{rating.toFixed(1)}</div>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={`text-2xl ${i < stars ? 'text-amber-500' : 'text-gray-300'}`}
            />
          ))}
        </div>
      </div>

      <div className="text-gray-600">
        Based on <span className="font-medium">{count ?? 0}</span> review{count !== 1 ? 's' : ''}
      </div>
    </div>
  )
}