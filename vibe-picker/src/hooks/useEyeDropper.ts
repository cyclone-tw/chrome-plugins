import { useState } from 'react'

interface EyeDropperResult {
  sRGBHex: string
}

export const useEyeDropper = () => {
  const [isSupported] = useState(() => 'EyeDropper' in window)
  const [isPickingColor, setIsPickingColor] = useState(false)

  const pickColor = async (): Promise<string | null> => {
    if (!isSupported) return null
    
    try {
      setIsPickingColor(true)
      const eyeDropper = new (window as any).EyeDropper()
      const result: EyeDropperResult = await eyeDropper.open()
      return result.sRGBHex
    } catch (error) {
      return null
    } finally {
      setIsPickingColor(false)
    }
  }

  return { isSupported, isPickingColor, pickColor }
}