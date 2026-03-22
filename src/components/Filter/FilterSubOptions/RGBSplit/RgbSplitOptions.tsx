import React from 'react'
import { Colour } from '../../../../interfaces/types'
import Button from '../../../generic/Button'
import RgbSplitInput from './RgbSplitInput'

type Props = {
  colourNames: string[]
  rgbShift: Colour
  setRgbShift: React.Dispatch<React.SetStateAction<Colour>>
}

const RgbSplitOptions = ({ colourNames, rgbShift, setRgbShift }: Props) => {

  const handleClick = () => {
    setRgbShift({ red: 0, blue: 0, green: 0 })
  }
  // We need colourNames as red green blue
  return (
    <div className='filterSubOptions secondFilterOption'>
      {colourNames.map((colour) => (
        <RgbSplitInput
          key={'rgbShift' + colour}
          colour={colour} rgbShift={rgbShift} setRgbShift={setRgbShift}
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

export default RgbSplitOptions
