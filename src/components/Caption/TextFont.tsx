import React, { SetStateAction } from 'react'
import { VideoSettings } from '../../interfaces/types'

type Props = {
  fontName: string
  fontId: string
  textOptions: VideoSettings
  setTextOptions: React.Dispatch<SetStateAction<VideoSettings>>
}

const TextFont = (props: { fontProps: Props }) => {
  const { fontName, fontId, textOptions, setTextOptions } = props.fontProps

  return (
    <div className='radioContainer'>
      <input
        type='radio'
        id={fontId}
        name={fontId}
        value={textOptions.font}
        onChange={(e) => {
          setTextOptions({
            ...textOptions,
            font: e.target.checked ? e.target.name : textOptions.font,
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
