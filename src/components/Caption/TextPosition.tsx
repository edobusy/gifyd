import React, { SetStateAction } from 'react'
import { VideoSettings } from '../../interfaces/types'

type Props = {
  positionName: string
  positionEquation: string
  textOptions: VideoSettings
  setTextOptions: React.Dispatch<SetStateAction<VideoSettings>>
}

// positionEquation would be (h-text_h)/20 for top and (h-text_h)-(h-text_h)/20 for bottom
const TextPosition = (props: { buttonProps: Props }) => {
  const { positionName, positionEquation, textOptions, setTextOptions } =
    props.buttonProps
  return (
    <div className='radioContainer'>
      <input
        type='radio'
        id={positionName}
        name='textPosition'
        value={textOptions.y}
        onChange={(e) => {
          setTextOptions({
            ...textOptions,
            y: e.target.checked ? positionEquation : textOptions.y,
          })
        }}
        checked={textOptions.y === positionEquation}
      />
      <label
        htmlFor={positionName}
        className={`simpleLabel tiny ${
          textOptions.y === positionEquation ? 'greened' : ''
        }`}
      >
        {positionName[0].toUpperCase() + positionName.substring(1)}
      </label>
    </div>
  )
}

export default TextPosition
