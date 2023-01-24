import React from 'react'
import { Colour } from '../../../../interfaces/types'

type Props = {
  colour: string
  rgbShift: Colour
  setRgbShift: React.Dispatch<React.SetStateAction<Colour>>
}

const RgbSplitInput = (props: { optionProps: Props }) => {
  const { colour, rgbShift, setRgbShift } = props.optionProps

  return (
    <div className='dualCol'>
      <label htmlFor={colour + 'Shift'} className='simpleLabel tilt'>
        {colour[0].toUpperCase().concat(colour.substring(1))}:
      </label>
      <input
        type='range'
        id={colour + 'Shift'}
        name={colour + 'Shift'}
        // Might want to change this later, as it can get quite weird
        step='1'
        min='-1000'
        max='1000'
        value={rgbShift[colour as keyof Colour]}
        onChange={(e) => {
          setRgbShift({
            ...rgbShift,
            [colour]: parseInt(e.target.value),
          })
        }}
      />
    </div>
  )
}

export default RgbSplitInput
