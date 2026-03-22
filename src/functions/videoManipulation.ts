import { Callback, FilterOptions } from '../interfaces/types'

export const rgbSplit: Callback = (
  pixels,
  options: FilterOptions
) => {
  const source = new Uint8ClampedArray(pixels)
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i + options.rgbShift.red] = source[i]     //r
    pixels[i + options.rgbShift.green] = source[i + 1] //g
    pixels[i + options.rgbShift.blue] = source[i + 2]  //b
  }
  return pixels
}

export const customColour: Callback = (
  pixels,
  options: FilterOptions
) => {
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = pixels[i] + options.rgbaMod.red //r
    pixels[i + 1] = pixels[i + 1] + options.rgbaMod.green //g
    pixels[i + 2] = pixels[i + 2] + options.rgbaMod.blue //b
    //pixels[i+3] //a
  }
  return pixels
}

export const greenScreen: Callback = (
  pixels,
  options: FilterOptions
) => {
  const bgColour = hexToRgb(options.levels.background)
  for (let i = 0; i < pixels.length; i = i + 4) {
    const red = pixels[i + 0]
    const green = pixels[i + 1]
    const blue = pixels[i + 2]

    if (
      red >= options.levels.rmin &&
      green >= options.levels.gmin &&
      blue >= options.levels.bmin &&
      red <= options.levels.rmax &&
      green <= options.levels.gmax &&
      blue <= options.levels.bmax
    ) {
      pixels[i + 0] = bgColour.r
      pixels[i + 1] = bgColour.g
      pixels[i + 2] = bgColour.b
    }
  }

  return pixels
}

export const hexToRgb = (hex: string) => {
  if (!hex || hex.length < 7 || hex[0] !== '#') {
    return { r: 0, g: 0, b: 0 }
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  return { r, g, b }
}

export const takeDown = (width: number, height: number): number[] => {
  while (width > 600 || height > 600) {
    width /= 2
    height /= 2
  }
  // Ensure dimensions are even (required by H.264 encoder)
  const evenWidth = Math.floor(width / 2) * 2
  const evenHeight = Math.floor(height / 2) * 2
  return [evenWidth, evenHeight]
}
