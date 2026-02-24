type Props = {
  bio?: string | null
}

export default function BioSection({ bio }: Props) {
  return (
    <div className="prose prose-gray max-w-none">
      {bio ? (
        <p className="text-[var(--blue)] leading-relaxed whitespace-pre-wrap">{bio}</p>
      ) : (
        <p className="text-[var(--blue)] italic">No professional bio added yet.</p>
      )}
    </div>
  )
}