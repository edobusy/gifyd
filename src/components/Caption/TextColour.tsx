import React, { SetStateAction } from 'react'
import { VideoSettings } from '../../interfaces/types'

const propertyMap = {
  text: { colour: 'textColour' as const, transparency: null },
  box: { colour: 'boxColour' as const, transparency: 'boxTransparency' as const },
}

type Props = {
  targetContent: keyof typeof propertyMap
  transparency: boolean
  textOptions: VideoSettings
  setTextOptions: React.Dispatch<SetStateAction<VideoSettings>>
}

const TextColour = ({ targetContent, transparency, textOptions, setTextOptions }: Props) => {

  const colourKey = propertyMap[targetContent].colour
  const transparencyKey = propertyMap[targetContent].transparency
  const label = targetContent[0].toUpperCase() + targetContent.substring(1)

  return (
    <>
      <div className='dualColCaption'>
        <div className='container'>
          <label htmlFor={colourKey} className='simpleLabel tilt'>
            {label}{' '}
            Colour:
          </label>
        </div>
        <div className='container'>
          <input
            type='color'
            id={colourKey}
            name={colourKey}
            aria-label={colourKey}
            value={textOptions[colourKey]}
            onChange={(e) => {
              setTextOptions({
                ...textOptions,
                [colourKey]: e.target.value,
              })
            }}
          />
        </div>
      </div>
      {transparency && transparencyKey && (
        <div className='dualColCaption'>
          <div className='container'>
            <label htmlFor={transparencyKey} className='simpleLabel tilt'>
              {label}{' '}
              Alpha:
            </label>
          </div>
          <div className='container'>
            <input
              type='range'
              id={transparencyKey}
              name={transparencyKey}
              aria-label={transparencyKey}
              step='0.1'
              min='0'
              max='1'
              value={textOptions[transparencyKey]}
              onChange={(e) => {
                setTextOptions({
                  ...textOptions,
                  [transparencyKey]: e.target.value,
                })
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default TextColour
