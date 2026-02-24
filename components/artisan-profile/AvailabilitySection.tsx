import { FaCalendarAlt, FaClock } from 'react-icons/fa'

type Props = {
  workingDays: string | null
  timeSlots: string | null
  nextAvailable: string | null
}

export default function AvailabilitySection({ workingDays, timeSlots, nextAvailable }: Props) {
  const hasData = workingDays || timeSlots || nextAvailable

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
        <FaCalendarAlt className="text-[var(--orange)]" /> Availability
      </h2>

      {hasData ? (
        <div className="space-y-6">
          {workingDays && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Working Days</h3>
              <div className="flex flex-wrap gap-2">
                {workingDays.split(',').map(day => (
                  <span
                    key={day}
                    className="px-4 py-1.5 bg-blue-50 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {day.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {timeSlots && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Available Hours</h3>
              <p className="text-gray-700">{timeSlots}</p>
            </div>
          )}

          {nextAvailable && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Next Available Date</h3>
              <p className="text-gray-700 font-medium">
                {new Date(nextAvailable).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic text-center py-8">
          No availability information added yet
        </p>
      )}
    </div>
  )
}