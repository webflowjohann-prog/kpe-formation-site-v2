import { useState } from 'react'

interface Props {
  imageSrc: string
  agentName: string
  tagline: string
}

export default function HeroImage({ imageSrc, agentName, tagline }: Props) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <div className="agent-hero mx-4 mb-2 mt-0">
      {/* Image (grayscale, fade-in on load) */}
      {!imgError && (
        <img
          src={imageSrc}
          alt={agentName}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      )}

      {/* Gradient overlay (toujours affiché, via ::after sur .agent-hero) */}

      {/* Texte sur l'overlay */}
      <p
        style={{
          position: 'absolute',
          bottom: 28,
          left: 24,
          color: '#FFFFFF',
          fontFamily: "'Montserrat Variable', 'Montserrat', sans-serif",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          zIndex: 1,
          margin: 0,
          lineHeight: 1.1,
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {agentName}
      </p>
      <p
        style={{
          position: 'absolute',
          bottom: 10,
          left: 24,
          color: 'rgba(255,255,255,0.75)',
          fontFamily: "'Montserrat Variable', 'Montserrat', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          zIndex: 1,
          margin: 0,
        }}
      >
        {tagline}
      </p>
    </div>
  )
}
