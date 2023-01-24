import React from 'react'
import { FilterLevels } from '../../../../interfaces/types'

type Props = {
  colour: string
  levels: FilterLevels
  setLevels: React.Dispatch<React.SetStateAction<FilterLevels>>
}

const GreenScreenInput = (props: { optionProps: Props }) => {
  const { colour, levels, setLevels } = props.optionProps
  return (
    <div className='desktopGreenScreen'>
      <div className='noStretch'>
        <p className='simpleLabel tilt'>
          {colour[0].toUpperCase().concat(colour.substring(1))}:
        </p>
      </div>
      <div className='dualColGreenScreen'>
        <div className='dualColMinMax'>
          <div className='noStretch'>
            <label
              htmlFor={colour[0] + 'min'}
              className='simpleLabel tiny tilt'
            >
              Min:
            </label>
          </div>
          <input
            type='range'
            min='0'
            max='255'
            name={colour[0] + 'min'}
            value={levels[(colour[0] + 'min') as keyof FilterLevels]}
            onChange={(e) => {
              setLevels({
                ...levels,
                [e.target.name]: parseInt(e.target.value),
              })
            }}
          />
        </div>
        <div className='dualColMinMax'>
          <div className='noStretch'>
            <label
              htmlFor={colour[0] + 'max'}
              className='simpleLabel tiny tilt'
            >
              Max:
            </label>
          </div>
          <input
            type='range'
            min='0'
            max='255'
            name={colour[0] + 'max'}
            value={levels[(colour[0] + 'max') as keyof FilterLevels]}
            onChange={(e) => {
              setLevels({
                ...levels,
                [e.target.name]: parseInt(e.target.value),
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default GreenScreenInput
