import { useState, useEffect } from 'react'
import { Pipette, Palette } from 'lucide-react'
import { useEyeDropper } from './hooks/useEyeDropper'
import { ColorCard } from './components/ColorCard'
import { generatePalette, copyToClipboard } from './utils/colorUtils'

interface ColorData {
  hex: string
  rgb: string
  hsl: string
  shades: string[]
  complementary: string
}

function App() {
  const { isSupported, isPickingColor, pickColor } = useEyeDropper()
  const [currentColor, setCurrentColor] = useState<ColorData | null>(null)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['colorHistory'], (result: any) => {
        if (result.colorHistory) setHistory(result.colorHistory)
      })
    }
  }, [])

  const handlePickColor = async () => {
    const color = await pickColor()
    if (color) {
      const palette = generatePalette(color)
      setCurrentColor(palette)
      
      const newHistory = [color, ...history.filter(h => h !== color)].slice(0, 10)
      setHistory(newHistory)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ colorHistory: newHistory })
      }
    }
  }

  const copyColorValue = async (value: string) => {
    await copyToClipboard(value)
  }

  if (!isSupported) {
    return (
      <div className="w-80 p-6 text-center">
        <p className="text-red-500">EyeDropper API not supported</p>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600">
        <button
          onClick={handlePickColor}
          disabled={isPickingColor}
          className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Pipette className="w-5 h-5" />
          {isPickingColor ? 'Picking...' : 'Pick Color'}
        </button>
      </div>

      {/* Color Details */}
      {currentColor && (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl shadow-lg border border-gray-200"
              style={{ backgroundColor: currentColor.hex }}
            />
            <div className="space-y-1">
              <button
                onClick={() => copyColorValue(currentColor.hex)}
                className="block text-sm font-mono hover:bg-gray-100 px-2 py-1 rounded"
              >
                {currentColor.hex}
              </button>
              <button
                onClick={() => copyColorValue(currentColor.rgb)}
                className="block text-sm font-mono hover:bg-gray-100 px-2 py-1 rounded text-gray-600"
              >
                {currentColor.rgb}
              </button>
              <button
                onClick={() => copyColorValue(currentColor.hsl)}
                className="block text-sm font-mono hover:bg-gray-100 px-2 py-1 rounded text-gray-600"
              >
                {currentColor.hsl}
              </button>
            </div>
          </div>

          {/* Palette */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Shades & Tints</span>
            </div>
            <div className="flex gap-2 justify-between">
              {currentColor.shades.map((shade, i) => (
                <ColorCard key={i} color={shade} size="sm" />
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Complementary</span>
              <ColorCard color={currentColor.complementary} label={currentColor.complementary} />
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="p-6 pt-0">
          <div className="text-sm font-medium text-gray-700 mb-3">Recent Colors</div>
          <div className="flex gap-2 flex-wrap">
            {history.map((color, i) => (
              <ColorCard
                key={i}
                color={color}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App