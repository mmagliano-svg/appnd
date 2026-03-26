import Link from 'next/link'
import { GROUP_TYPES, type GroupSummary } from '@/lib/constants/groups'

function getGroupEmoji(type: string) {
  return GROUP_TYPES.find((t) => t.value === type)?.emoji ?? '◎'
}

interface Props {
  group: GroupSummary
}

export function GroupCard({ group }: Props) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="block rounded-2xl border border-border/60 bg-card hover:border-foreground/20 hover:bg-accent/20 transition-all active:scale-[0.98] overflow-hidden"
    >
      <div className="px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-foreground/5 border border-border/50 flex items-center justify-center text-lg shrink-0">
            {getGroupEmoji(group.type)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{group.name}</p>
            <p className="text-xs text-muted-foreground">
              {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membri'}
            </p>
          </div>
        </div>

        {/* Member initials */}
        <div className="flex items-center gap-1">
          {group.previewMembers.map((m, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0"
              style={{ marginLeft: i > 0 ? '-4px' : 0 }}
              title={m.displayName}
            >
              {m.displayName.slice(0, 2).toUpperCase()}
            </div>
          ))}
          {group.memberCount > 4 && (
            <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground -ml-1">
              +{group.memberCount - 4}
            </div>
          )}
          <span className="ml-2 text-xs text-muted-foreground">
            {group.memoryCount} moment{group.memoryCount === 1 ? 'o' : 'i'}
          </span>
        </div>
      </div>
    </Link>
  )
}
