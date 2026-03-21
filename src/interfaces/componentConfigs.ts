import { settings } from './enums'

export const filters = [
  {
    setting: settings.GIF,
    buttonName: 'Edit',
  },
  {
    setting: settings.Video,
    buttonName: 'Filter',
  },
  {
    setting: settings.Text,
    buttonName: 'Caption',
  },
]

export const textPositions = [
  {
    positionName: 'top',
    positionEquation: '(h-text_h)/20',
  },
  {
    positionName: 'center',
    positionEquation: '(h-text_h)/2',
  },
  {
    positionName: 'bottom',
    positionEquation: '(h-text_h)-(h-text_h)/20',
  },
]

export const textSizes = [
  {
    size: 'small',
    divisor: 20,
  },
  {
    size: 'medium',
    divisor: 15,
  },
  {
    size: 'large',
    divisor: 10,
  },
  {
    size: 'chonky',
    divisor: 5,
  },
]

export const textFonts = [
  {
    fontName: 'Times',
    fontId: 'times',
  },
  {
    fontName: 'Impact',
    fontId: 'impact',
  },
  {
    fontName: 'Comic',
    fontId: 'cursive',
  },
]

export const targetContentColourInputs = [
  {
    targetContent: 'text',
    transparency: false,
  },
  {
    targetContent: 'box',
    transparency: true,
  },
]
