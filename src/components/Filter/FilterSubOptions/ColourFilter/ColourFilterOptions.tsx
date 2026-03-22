import React from 'react'
import { Colour } from '../../../../interfaces/types'
import Button from '../../../generic/Button'
import ColourModifierInput from './ColourModifierInput'

type Props = {
  colourNames: string[]
  rgbaMod: Colour
  setRgbaMod: React.Dispatch<React.SetStateAction<Colour>>
}

const ColourFilterOptions = ({ colourNames, rgbaMod, setRgbaMod }: Props) => {

  const handleClick = () => {
    setRgbaMod({ red: 0, blue: 0, green: 0, alpha: 255 })
  }

  return (
    <div className='filterSubOptions firstFilterOption'>
      {colourNames.map((colour) => (
        // Give red, green, blue for colour
        <ColourModifierInput
          key={'colourFilter' + colour}
          colour={colour} rgbaMod={rgbaMod} setRgbaMod={setRgbaMod}
        />
      ))}
      <div className='centerReset'>
        <Button
          handleClick={handleClick}
          buttonName="Reset"
          tilt={false}
          disabled={false}
        />
      </div>
    </div>
  )
}

export default ColourFilterOptions
