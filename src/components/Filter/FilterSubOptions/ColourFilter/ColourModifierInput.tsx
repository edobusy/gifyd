import React from 'react'
import { Colour } from '../../../../interfaces/types'

type Props = {
  colour: string
  rgbaMod: Colour
  setRgbaMod: React.Dispatch<React.SetStateAction<Colour>>
}
// This component should be done, now go to ColourFilterOptions, then finish up FilterOptions
const ColourModifierInput = (props: { colourModifierInputProps: Props }) => {
  const { colour, rgbaMod, setRgbaMod } = props.colourModifierInputProps

  return (
    <div className='dualCol'>
      <label htmlFor={colour} className='simpleLabel tilt'>
        {colour[0].toUpperCase().concat(colour.substring(1))}:
      </label>
      <input
        type='range'
        id={colour}
        name={colour}
        step='1'
        min='0'
        max='255'
        value={rgbaMod[colour as keyof Colour]}
        onChange={(e) => {
          setRgbaMod({
            ...rgbaMod,
            [colour as keyof Colour]: parseInt(e.target.value),
          })
        }}
      />
    </div>
  )
}

export default ColourModifierInput
