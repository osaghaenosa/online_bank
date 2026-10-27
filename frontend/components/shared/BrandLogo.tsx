'use client'
import React from 'react'

interface BrandLogoProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
}

export function BrandLogo({
  variant = 'light',
  size = 'md',
  showTagline = false,
  className = '',
}: BrandLogoProps) {
  const isLight = variant === 'light' // light text for dark/blue backgrounds
  const textColor = isLight ? '#FFFFFF' : '#002B5B'
  const subColor = isLight ? '#93C5FD' : '#0052CC'
  const iconBg = isLight ? '#FFFFFF' : '#002B5B'

  const dimensions = {
    sm: { box: 'w-8 h-8', title: 'text-base', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', title: 'text-lg', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', title: 'text-xl', sub: 'text-[11px]' },
  }[size]

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Sharp architectural emblem with building + sky/cloud */}
      <div
        className={`${dimensions.box} flex-shrink-0 flex items-center justify-center border overflow-hidden`}
        style={{
          background: '#FFFFFF',
          borderColor: isLight ? '#60A5FA' : '#002B5B',
          borderWidth: '2px',
        }}
      >
        <img
          src="/logo.png"
          alt="Blue ridge Bank"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to inline SVG if image fails
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-display font-extrabold tracking-tight uppercase ${dimensions.title}`}
          style={{ color: textColor, letterSpacing: '0.04em' }}
        >
          Blue ridge <span style={{ color: isLight ? '#60A5FA' : '#0052CC' }}>Bank</span>
        </span>
        {showTagline && (
          <span
            className={`font-mono uppercase tracking-widest mt-1 font-semibold ${dimensions.sub}`}
            style={{ color: subColor }}
          >
            Institutional &amp; Personal Banking
          </span>
        )}
      </div>
    </div>
  )
}
