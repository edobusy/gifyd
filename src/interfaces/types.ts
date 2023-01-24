export type Colour = {
  red: number
  green: number
  blue: number
  alpha?: number
}

export type Callback =
  | ((pixels: Uint8ClampedArray, options: any) => Uint8ClampedArray)
  | null

export type FilterLevels = {
  rmin: number
  rmax: number
  gmin: number
  gmax: number
  bmin: number
  bmax: number
  background: string
}

export type VideoSettings = {
  content: string
  textColour: string
  font: string
  fontSize: string
  boxColour: string
  boxTransparency: string
  boxBorderWidth: string
  x: string
  y: string
}

export type ColourFilter = {
  colourNames: string[]
  rgbaMod: Colour
  setRgbaMod: React.Dispatch<React.SetStateAction<Colour>>
}
