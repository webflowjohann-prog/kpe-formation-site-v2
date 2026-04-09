import type { ReactNode } from 'react'

interface ChatBubbleProps {
  role: 'user' | 'agent'
  agent?: string
  children: ReactNode
  timestamp?: string
  isStreaming?: boolean
}

export function ChatBubble({ role, agent, children, timestamp, isStreaming }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={['flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row'].join(' ')}>
      {/* Avatar agent */}
      {!isUser && (
        <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mt-0.5">
          <span className="font-sans font-medium uppercase tracking-wider text-[7px] text-gold">
            {(agent ?? 'AI').slice(0, 2)}
          </span>
        </div>
      )}

      <div
        className={[
          'max-w-[82%] flex flex-col gap-1',
          isUser ? 'items-end' : 'items-start',
        ].join(' ')}
      >
        {/* Bulle */}
        <div
          className={[
            'px-4 py-3 font-sans text-sm leading-relaxed',
            isUser
              ? 'bg-gold/[0.12] border border-gold/20 text-t1 rounded-[16px] rounded-tr-[4px]'
              : 'bg-card border border-white/[0.06] text-t2 rounded-[16px] rounded-tl-[4px]',
          ].join(' ')}
        >
          {children}
          {isStreaming && (
            <span className="inline-flex items-center gap-0.5 ml-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1 h-1 rounded-full bg-gold/60 animate-pulse"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="font-sans text-[9px] text-t4 px-1">{timestamp}</span>
        )}
      </div>
    </div>
  )
}
