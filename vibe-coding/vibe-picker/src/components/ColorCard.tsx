import { useState } from 'react'
import { Check } from 'lucide-react'
import { copyToClipboard } from '../utils/colorUtils'

interface ColorCardProps {
  color: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export const ColorCard = ({ color, label, size = 'md' }: ColorCardProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(color)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleCopy}
        className={`${sizeClasses[size]} rounded-lg shadow-sm border border-gray-200 hover:scale-105 transition-transform relative overflow-hidden`}
        style={{ backgroundColor: color }}
      >
        {copied && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </button>
      {label && (
        <span className="text-xs text-gray-600 font-mono">{label}</span>
      )}
    </div>
  )
}