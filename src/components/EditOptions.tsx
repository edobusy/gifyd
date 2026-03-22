import React from 'react'

type Props = {
  minimumDuration: number
  maxDuration: number
  videoLength: number
  duration: number
  framerate: number
  setFramerate: (value: React.SetStateAction<number>) => void
  startTime: number
  setStartTime: (value: React.SetStateAction<number>) => void
  setDuration: (value: React.SetStateAction<number>) => void
}

const EditOptions = React.memo((props: Props) => {
  const {
    minimumDuration,
    maxDuration,
    videoLength,
    duration,
    framerate,
    setFramerate,
    startTime,
    setStartTime,
    setDuration,
  } = props

  return (
    <div className='editOptions'>
      <div className='editSubOptionsContainer'>
        <div className='editSubOptions'>
          <label htmlFor='start' className='simpleLabel tilt'>
            Start Time:
          </label>
          <input
            type='range'
            id='start'
            name='start'
            step='100'
            min='0'
            max={`${videoLength}`}
            value={startTime}
            onChange={(e) => {
              setStartTime(parseFloat(e.target.value))
            }}
          />
          <p className='simpleLabel tilt tiny'>{startTime / 1000}s</p>
        </div>
        <div className='editSubOptions'>
          <label htmlFor='framerate' className='simpleLabel tilt'>
            Framerate:
          </label>
          <input
            type='range'
            id='framerate'
            name='framerate'
            min='1'
            max='30'
            value={framerate}
            onChange={(e) => {
              setFramerate(parseInt(e.target.value))
            }}
          />
          <p className='simpleLabel tilt tiny'>{framerate} fps</p>
        </div>
        <div className='editSubOptions'>
          <label htmlFor='duration' className='simpleLabel tilt'>
            GIF Length:
          </label>
          <input
            type='range'
            id='duration'
            name='duration'
            step='100'
            value={duration}
            min={`${minimumDuration}`}
            max={`${maxDuration}`}
            onChange={(e) => {
              setDuration(parseFloat(e.target.value))
            }}
          />
          <p className='simpleLabel tilt tiny'>{duration / 1000}s</p>
        </div>
      </div>
    </div>
  )
})

export default EditOptions
