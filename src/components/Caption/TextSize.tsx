import React, { SetStateAction, useEffect, useState } from 'react'
import { takeDown } from '../../functions/videoManipulation'
import { VideoSettings } from '../../interfaces/types'

type Props = {
  size: string
  divisor: number
  textOptions: VideoSettings
  setTextOptions: React.Dispatch<SetStateAction<VideoSettings>>
  vidRef: React.RefObject<HTMLVideoElement>
}
// divisor is 20 for small, 15 for medium, 10 for large
const TextSize = (props: { inputProps: Props }) => {
  const { size, divisor, textOptions, setTextOptions, vidRef } =
    props.inputProps

  const [dividend, setDividend] = useState(0)

  // console.log(dividend)

  useEffect(() => {
    ;(async () => {
      if (!vidRef.current) return
      const divSize = await takeDown(
        vidRef.current.videoWidth,
        vidRef.current.videoHeight
      )
      setDividend(divSize[0])
    })()
  }, [])

  return (
    <div className='radioContainer'>
      <input
        type='radio'
        id={size + 'Size'}
        name='fontSize'
        value={textOptions.fontSize}
        onChange={(e) => {
          setTextOptions({
            ...textOptions,
            fontSize:
              e.target.checked && vidRef.current
                ? (dividend / divisor).toString()
                : textOptions.fontSize,
          })
        }}
        checked={
          vidRef.current &&
          textOptions.fontSize === (dividend / divisor).toString()
            ? true
            : false
        }
      />
      <label
        htmlFor={size + 'Size'}
        className={`simpleLabel tiny ${
          vidRef.current &&
          textOptions.fontSize === (dividend / divisor).toString()
            ? 'greened'
            : ''
        }`}
      >
        {size[0].toUpperCase() + size.substring(1)}
      </label>
    </div>
  )
}

export default TextSize
