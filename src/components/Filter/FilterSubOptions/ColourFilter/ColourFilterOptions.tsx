import React from 'react'
import { Colour } from '../../../../interfaces/types'
import Button from '../../../generic/Button'
import ColourModifierInput from './ColourModifierInput'

type Props = {
  colourNames: string[]
  rgbaMod: Colour
  setRgbaMod: React.Dispatch<React.SetStateAction<Colour>>
}

const ColourFilterOptions = (props: { optionProps: Props }) => {
  const { colourNames, rgbaMod, setRgbaMod } = props.optionProps

  const handleClick = () => {
    setRgbaMod({ red: 0, blue: 0, green: 0, alpha: 255 })
  }

  return (
    <div className='filterSubOptions firstFilterOption'>
      {colourNames.map((colour) => (
        // Give red, green, blue for colour
        <ColourModifierInput
          key={'colourFilter' + colour}
          colourModifierInputProps={{ colour, rgbaMod, setRgbaMod }}
        />
      ))}
      <div className='centerReset'>
        <Button
          buttonProps={{
            handleClick,
            buttonName: 'Reset',
            tilt: false,
            disabled: false,
          }}
        />
      </div>
    </div>
  )
}

export default ColourFilterOptions
