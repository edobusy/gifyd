import React, { SetStateAction } from 'react'
import { VideoSettings } from '../../interfaces/types'

type Props = {
  fontName: string
  fontId: string
  textOptions: VideoSettings
  setTextOptions: React.Dispatch<SetStateAction<VideoSettings>>
}

const TextFont = ({ fontName, fontId, textOptions, setTextOptions }: Props) => {

  return (
    <div className='radioContainer'>
      <input
        type='radio'
        id={fontId}
        name="textFont"
        value={textOptions.font}
        onChange={(e) => {
          setTextOptions({
            ...textOptions,
            font: e.target.checked ? fontId : textOptions.font,
          })
        }}
        checked={textOptions.font === fontId}
      />
      <label
        htmlFor={fontId}
        className={`simpleLabel tiny ${
          textOptions.font === fontId ? 'greened' : ''
        }`}
      >
        {fontName}
      </label>
    </div>
  )
}

export default TextFont
