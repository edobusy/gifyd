import React from 'react'
import { Colour } from '../../../../interfaces/types'
import Button from '../../../generic/Button'
import RgbSplitInput from './RgbSplitInput'

type Props = {
  colourNames: string[]
  rgbShift: Colour
  setRgbShift: React.Dispatch<React.SetStateAction<Colour>>
}

const RgbSplitOptions = (props: { optionProps: Props }) => {
  const { colourNames, rgbShift, setRgbShift } = props.optionProps

  const handleClick = () => {
    setRgbShift({ red: 0, blue: 0, green: 0 })
  }
  // We need colourNames as red green blue
  return (
    <div className='filterSubOptions secondFilterOption'>
      {colourNames.map((colour) => (
        <RgbSplitInput
          key={'rgbShift' + colour}
          optionProps={{ colour, rgbShift, setRgbShift }}
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

export default RgbSplitOptions
