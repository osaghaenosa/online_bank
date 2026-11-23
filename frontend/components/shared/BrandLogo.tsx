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
  const isLight = variant === 'light'
  const textColor = isLight ? '#FFFFFF' : '#002B5B'
  const subColor = isLight ? '#93C5FD' : '#0052CC'

  const dimensions = {
    sm: { box: 'w-9 h-9 rounded-xl', title: 'text-base', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10 rounded-xl', title: 'text-lg', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12 rounded-2xl', title: 'text-xl', sub: 'text-[11px]' },
  }[size]

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className={`${dimensions.box} flex-shrink-0 flex items-center justify-center overflow-hidden p-1 shadow-sm border`}
        style={{
          background: '#FFFFFF',
          borderColor: isLight ? 'rgba(255,255,255,0.25)' : 'rgba(0,43,91,0.12)',
        }}
      >
        <img
          src="/logo.png"
          alt="Blue ridge Bank"
          className="w-full h-full object-contain rounded-lg"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-display font-extrabold tracking-tight ${dimensions.title}`}
          style={{ color: textColor }}
        >
          Blue ridge <span style={{ color: isLight ? '#60A5FA' : '#0052CC' }}>Bank</span>
        </span>
        {showTagline && (
          <span
            className={`font-medium tracking-wide mt-1 ${dimensions.sub}`}
            style={{ color: subColor }}
          >
            Institutional &amp; Personal Banking
          </span>
        )}
      </div>
    </div>
  )
}
