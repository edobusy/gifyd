import React from 'react'
import { FilterLevels } from '../../../../interfaces/types'
import Button from '../../../generic/Button'
import GreenScreenInput from './GreenScreenInput'

type Props = {
  colourNames: string[]
  levels: FilterLevels
  setLevels: React.Dispatch<React.SetStateAction<FilterLevels>>
}

const GreenScreenOptions = ({ colourNames, levels, setLevels }: Props) => {

  const handleClick = () => {
    setLevels({
      rmin: 50,
      rmax: 100,
      gmin: 50,
      gmax: 100,
      bmin: 50,
      bmax: 100,
      background: '#3fff00',
    })
  }

  return (
    <div className='filterSubOptions greenScreenOption'>
      {colourNames.map((colour) => (
        <div key={'greenScreen' + colour}>
          <GreenScreenInput colour={colour} levels={levels} setLevels={setLevels} />
          <br />
        </div>
      ))}
      <div className='dualColGif'>
        <div className='container greenScreenColour'>
          <label htmlFor='gifBackground' className='simpleLabel tilt'>
            Background:
          </label>
        </div>
        <div className='container greenScreenColour'>
          <input
            type='color'
            id='gifBackground'
            name='gifBackground'
            value={levels.background}
            onChange={(e) => {
              setLevels({
                ...levels,
                background: e.target.value,
              })
            }}
          />
        </div>
      </div>
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

export default GreenScreenOptions
