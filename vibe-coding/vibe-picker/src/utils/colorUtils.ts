import { colord } from 'colord'

export const generatePalette = (hex: string) => {
  const color = colord(hex)
  
  return {
    main: hex,
    hex: hex.toUpperCase(),
    rgb: color.toRgbString(),
    hsl: color.toHslString(),
    shades: [
      color.lighten(0.3).toHex(),
      color.lighten(0.2).toHex(),
      color.lighten(0.1).toHex(),
      color.darken(0.1).toHex(),
      color.darken(0.2).toHex(),
      color.darken(0.3).toHex()
    ],
    complementary: color.rotate(180).toHex()
  }
}

export const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text)
}