export type Colour = {
  red: number
  green: number
  blue: number
  alpha?: number
}

export type FilterLevels = {
  rmin: number
  rmax: number
  gmin: number
  gmax: number
  bmin: number
  bmax: number
  background: string
}

export type FilterOptions = {
  rgbaMod: Colour
  rgbShift: Colour
  levels: FilterLevels
}

export type Callback =
  | ((pixels: Uint8ClampedArray, options: FilterOptions) => Uint8ClampedArray)
  | null

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

export type RgbSplitFilter = {
  colourNames: string[]
  rgbShift: Colour
  setRgbShift: React.Dispatch<React.SetStateAction<Colour>>
}

export type GreenScreenFilter = {
  colourNames: string[]
  levels: FilterLevels
  setLevels: React.Dispatch<React.SetStateAction<FilterLevels>>
}

export type FilterOptionProps = ColourFilter | RgbSplitFilter | GreenScreenFilter
