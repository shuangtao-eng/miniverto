import { cn } from '@/lib/utils'

interface StepDotsProps {
  total: number
  current: number
}

export function StepDots({ total, current }: StepDotsProps) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-normal ease-spring',
            i < current ? 'w-1.5 bg-ok' : i === current ? 'w-[18px] bg-primary' : 'w-1.5 bg-border',
          )}
        />
      ))}
    </div>
  )
}
