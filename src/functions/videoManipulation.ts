import { Callback, Colour, FilterLevels } from '../interfaces/types'

export const rgbSplit: Callback = (
  pixels,
  options: {
    rgbShift: Colour
  }
) => {
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i + options.rgbShift.red] = pixels[i] //r
    pixels[i + options.rgbShift.blue] = pixels[i + 1] //g
    pixels[i + options.rgbShift.green] = pixels[i + 2] //b
    //pixels[i+3] //a
  }
  return pixels
}

export const customColour: Callback = (
  pixels,
  options: {
    rgbaMod: Colour
  }
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
  options: {
    levels: FilterLevels
  }
) => {
  for (let i = 0; i < pixels.length; i = i + 4) {
    const red = pixels[i + 0]
    const green = pixels[i + 1]
    const blue = pixels[i + 2]
    //const alpha = pixels[i + 3]

    if (
      red >= options.levels.rmin &&
      green >= options.levels.gmin &&
      blue >= options.levels.bmin &&
      red <= options.levels.rmax &&
      green <= options.levels.gmax &&
      blue <= options.levels.bmax
    ) {
      // take it out!
      // pixels[i + 3] = 0
      const newColour = hexToRgb(options.levels.background)
      pixels[i + 0] = newColour.r
      pixels[i + 1] = newColour.g
      pixels[i + 2] = newColour.b
    }
  }

  return pixels
}

export const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  return { r, g, b }
}

export const takeDown = async (
  width: number,
  height: number
): Promise<number[]> => {
  if (width > 600 || height > 600) {
    return await takeDown(width / 2, height / 2)
  }
  return new Promise<number[]>((res, rej) => {
    if (!width) return rej('ERROR!!')
    return res([width, height])
  })
}
