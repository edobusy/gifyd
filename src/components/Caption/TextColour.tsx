import React, { SetStateAction } from 'react'
import { VideoSettings } from '../../interfaces/types'

type Props = {
  targetContent: string
  transparency: boolean
  textOptions: VideoSettings
  setTextOptions: React.Dispatch<SetStateAction<VideoSettings>>
}

const TextColour = (props: { colourProps: Props }) => {
  const { targetContent, transparency, textOptions, setTextOptions } =
    props.colourProps

  const property = targetContent + 'Colour'
  const transparencyProperty = targetContent + 'Transparency'

  return (
    <>
      <div className='dualColCaption'>
        <div className='container'>
          <label htmlFor={property} className='simpleLabel tilt'>
            {targetContent[0].toUpperCase() + targetContent.substring(1)}{' '}
            Colour:
          </label>
        </div>
        <div className='container'>
          <input
            type='color'
            id={property}
            name={property}
            aria-label={property}
            value={textOptions[property as keyof VideoSettings]}
            onChange={(e) => {
              setTextOptions({
                ...textOptions,
                [property]: e.target.value,
              })
            }}
          />
        </div>
      </div>
      {transparency && (
        <div className='dualColCaption'>
          <div className='container'>
            <label htmlFor={transparencyProperty} className='simpleLabel tilt'>
              {targetContent[0].toUpperCase() + targetContent.substring(1)}{' '}
              Alpha:
            </label>
          </div>
          <div className='container'>
            <input
              type='range'
              id={transparencyProperty}
              name={transparencyProperty}
              aria-label={transparencyProperty}
              step='0.1'
              min='0'
              max='1'
              value={textOptions[transparencyProperty as keyof VideoSettings]}
              onChange={(e) => {
                setTextOptions({
                  ...textOptions,
                  [transparencyProperty]: e.target.value,
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
