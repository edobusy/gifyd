// Gifyd

/*
  If you save a function as state (example in this code: 'customColour' set as 'callback'), and the function uses data from other state (example in this code: 'rgbaMod'), it will capture that data from the moment setState is called (example in this code: 'setCallback(customColour)'), and the data will be static, so if rgbaMod changes later, the values inside the function will not dynamically update accordingly (example in this code: when rgbaMod changes, the rgbaMod within customColour, which is our callback now, will not change, and will remain the same value as when setCallback(customColour) was called)
*/

import {
  ChangeEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import './App.css'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import times from './assets/times.ttf'
import impact from './assets/impact.ttf'
import comic from './assets/comic.ttf'
import {
  Callback,
  Colour,
  FilterLevels,
  VideoSettings,
} from './interfaces/types'
import { settings, videoMenu } from './interfaces/enums'
import UploadedVideo from './components/UploadedVideo'
import MainSettingsButton from './components/MainSettingsButton'
import EditOptions from './components/EditOptions'
import FilterOptions from './components/FilterOptions'
import ColourFilterOptions from './components/Filter/FilterSubOptions/ColourFilter/ColourFilterOptions'
import RgbSplitOptions from './components/Filter/FilterSubOptions/RGBSplit/RgbSplitOptions'
import GreenScreenOptions from './components/Filter/FilterSubOptions/GreenScreen/GreenScreenOptions'
import {
  customColour,
  greenScreen,
  rgbSplit,
  takeDown,
} from './functions/videoManipulation'
import CaptionOptions from './components/CaptionOptions'
import {
  filters,
  textPositions,
  textSizes,
  textFonts,
  targetContentColourInputs,
} from './interfaces/componentConfigs'
import FileUploader from './components/generic/FileUploader'
import Button from './components/generic/Button'
import GifResult from './components/GifResult'

const ffmpeg = createFFmpeg({ log: false })

function App() {
  const [uploadedFile, setuploadedFile] = useState<File | null>(null)
  const [vidUrl, setvidUrl] = useState('')
  const [gifUrl, setGifUrl] = useState('')
  const vidRef = useRef<HTMLVideoElement>(null)
  const gifRef = useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const [startTime, setStartTime] = useState(0)
  const [framerate, setFramerate] = useState(15)
  const minimumDuration = 1000
  const [duration, setDuration] = useState(minimumDuration)
  const [maxDuration, setMaxDuration] = useState(0)
  const [videoLength, setVideoLength] = useState(0)

  const [showSettings, setShowSettings] = useState('')
  const [colourSettings, setColourSettings] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [showFrame, setShowFrame] = useState<number | null>(null)

  const [disablePlayPause, setDisablePlayPause] = useState(false)
  const [isFocused, setIsFocused] = useState([false, false, false])
  const [isFilterFocused, setIsFilterFocused] = useState([false, false, false])

  const [rgbaMod, setRgbaMod] = useState<Colour>({
    red: 0,
    green: 0,
    blue: 0,
    alpha: 0,
  })
  const colorChanged = useRef<boolean>(false)

  const [callback, setCallback] = useState<Callback>(null)

  const [rgbShift, setRgbShift] = useState<Colour>({
    red: 0,
    green: 0,
    blue: 0,
  })

  const [levels, setLevels] = useState<FilterLevels>({
    rmin: 50,
    rmax: 100,
    gmin: 50,
    gmax: 100,
    bmin: 50,
    bmax: 100,
    background: '#3fff00',
  })

  const [textOptions, setTextOptions] = useState<VideoSettings>({
    content: '',
    textColour: '#ffffff',
    font: 'times',
    fontSize: '(w-text_w)/10',
    boxColour: '#000000',
    boxTransparency: '0.5',
    boxBorderWidth: '5',
    x: '(w-text_w)/2',
    y: '(h-text_h)-(h-text_h)/20',
  })

  const mediaRecorder = useRef<MediaRecorder | null>()

  useLayoutEffect(() => {
    paintCanvas(true)
  }, [ctx])

  useLayoutEffect(() => {
    if (vidRef.current?.paused) {
      //console.log('It triggers the paused version')
      paintCanvas(true)
    }
    if (showFrame) {
      clearInterval(showFrame)
      colorChanged.current = true
      setShowFrame(null)
      //console.log('It triggers the normal version')
    }
  }, [
    callback,
    rgbaMod.red,
    rgbaMod.green,
    rgbaMod.blue,
    rgbShift.red,
    rgbShift.green,
    rgbShift.blue,
    levels.rmin,
    levels.rmax,
    levels.gmin,
    levels.gmax,
    levels.bmin,
    levels.bmax,
    levels.background,
  ])

  useLayoutEffect(() => {
    if (!showFrame && colorChanged.current === true) {
      paintCanvas()
      colorChanged.current = false
    }
    if (
      !showFrame &&
      mediaRecorder.current &&
      mediaRecorder.current.state === 'recording'
    ) {
      mediaRecorder.current.stop()
    }
  }, [showFrame])

  useEffect(() => {
    loadFfmpeg()
  }, [])

  useEffect(() => {
    const fileURL = ''

    if (uploadedFile) {
      // We need to create a URL that we can later reference to display the picture
      const fileURL = URL.createObjectURL(uploadedFile)
      setvidUrl(fileURL)
    }
    return () => {
      if (fileURL) {
        URL.revokeObjectURL(fileURL)
      }
    }
  }, [uploadedFile])

  useEffect(() => {
    if (vidRef.current) {
      setMaxDuration(
        videoLength + minimumDuration - startTime > 4000
          ? 4000
          : videoLength + minimumDuration - startTime
      )
    }
  }, [startTime])

  useEffect(() => {
    if (canvasRef.current) {
      setCtx(canvasRef.current.getContext('2d', { willReadFrequently: true }))
    }
  }, [canvasRef.current])

  const loadFfmpeg = async () => {
    await ffmpeg.load()
    setIsLoaded(true)
  }

  const videoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return
    }

    if (e.target.files.length !== 1) {
      alert('Please upload one file!')
      return
    }
    if (e.target.files[0].type !== 'video/mp4') {
      alert('Please upload an mp4 video')
      return
    }
    if (e.target.files[0].size < 20000) {
      alert('Video is too tiny!')
      return
    }
    if (e.target.files[0].size > 358406553600) {
      alert('Video is too big!')
      return
    }
    setuploadedFile(e.target.files[0])
  }

  const transcode = async (data: Uint8Array) => {
    if (!vidRef.current) return
    //const message = document.getElementById('message')
    const name = 'record.webm'
    //await ffmpeg.load()
    //message.innerHTML = 'Start transcoding'
    ffmpeg.FS('writeFile', name, data)
    //ffmpeg.setProgress(({ ratio }) => {
    //  console.log('Progress is at ' + ratio * 100)
    //})
    const widthHeight = await takeDown(
      vidRef.current.videoWidth,
      vidRef.current.videoHeight
    )
    //console.log('VALUES ARE: ', widthHeight[0], widthHeight[1])

    await ffmpeg.run(
      '-i',
      name,
      '-r',
      `${framerate}`,
      '-s',
      `${widthHeight[0]}x${widthHeight[1]}`, // 720x720 540x960 960x540
      'vid.mp4'
    )
    //message.innerHTML = 'Complete transcoding'
    //const data = ffmpeg.FS('readFile', 'video.mp4')

    //const video = document.getElementById('output-video')
    //video.src = URL.createObjectURL(
    //  new Blob([data.buffer], { type: 'video/mp4' })
    //)
    //dl.href = video.src
    //dl.innerHTML = 'download mp4'
  }

  function fn() {
    const recordedChunks: Blob[] = []

    //let time = 0

    return new Promise<{ url: string; blob: Blob } | null>((res, rej) => {
      //console.log('Blob start')
      if (!canvasRef.current) return rej
      //console.log('Canvas exists!')
      if (!vidRef.current) return rej
      //console.log('Video exists!')

      let stream = canvasRef.current.captureStream()
      //console.log('Stream: ')
      //console.log(stream)

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp9',
      })

      mediaRecorder.current.start(/* time */)
      //console.log('Media recorder started')
      vidRef.current.play()
      //console.log('Video started')

      mediaRecorder.current.ondataavailable = function (e) {
        recordedChunks.push(e.data)
        // for demo, removed stop() call to capture more than one frame
      }

      mediaRecorder.current.onstop = function (event) {
        const blob = new Blob(recordedChunks, {
          type: 'video/webm',
        })
        //console.log('Media recorder stopped, saving blob: ')
        //console.log(blob)
        var url = URL.createObjectURL(blob)
        res({ url, blob }) // resolve both blob and url in an object
      }

      // for demo, draw random lines and then stop recording

      // Fai il recording dello spezzone
      let identifier = window.setInterval(() => {
        // Check if paused
        if (ctx && vidRef.current) {
          ctx.drawImage(
            vidRef.current,
            0,
            0,
            vidRef.current.clientWidth,
            vidRef.current.clientHeight
          )

          const dataBuffer = new Uint8ClampedArray(
            ctx.getImageData(
              0,
              0,
              vidRef.current.clientWidth,
              vidRef.current.clientHeight
            ).data.buffer
          )
          ctx.putImageData(
            new ImageData(
              callback?.(dataBuffer, { rgbaMod, rgbShift, levels }) ||
                dataBuffer,
              vidRef.current.clientWidth,
              vidRef.current.clientHeight
            ),
            0,
            0
          )
        }
      }, 1000 / 30)
      setShowFrame(identifier)
    })
  }

  const createVid = async () => {
    const result = await fn()
    //console.log(result)
    if (!result) return
    const resolvedVid = await result.blob.arrayBuffer()
    await transcode(new Uint8Array(resolvedVid))
  }

  const makeGif = async () => {
    if (!vidRef.current) return
    if (!isLoaded) return

    //setIsFilterFocused([false, false, false])
    setIsFocused([false, false, false])
    setDisablePlayPause(true)
    setShowSettings('')
    vidRef.current.pause()
    vidRef.current.currentTime = startTime / 1000

    await createVid()

    // fetchFile() helps you to fetch to file and return an Uint8Array variable for ffmpeg.wasm to consume.
    // Arguments
    // an URL string, base64 string or File, Blob, Buffer object
    //const data = await fetchFile(uploadedFile)
    //ffmpeg.FS('writeFile', 'vid.mp4', data)
    let fontData = await fetchFile(times)
    ffmpeg.FS('writeFile', 'times.ttf', fontData)
    fontData = await fetchFile(comic)
    ffmpeg.FS('writeFile', 'comic.ttf', fontData)
    fontData = await fetchFile(impact)
    ffmpeg.FS('writeFile', 'impact.ttf', fontData)

    // -i INPUT
    // -s FRAME SIZE
    // -r FRAMERATE PER SECOND
    // -t TIME LENGTH IN SECONDS
    // -ss START OFFSET IN SECONDS
    // -f OUTPUT FORMAT
    await ffmpeg.run(
      '-i',
      'vid.mp4',
      //'-s',
      //'480x320',
      '-vf',
      `drawtext=fontfile=${
        textOptions.font === 'cursive' ? 'comic' : textOptions.font
      }.ttf:text='${textOptions.content}':fontcolor=${
        textOptions.textColour
      }:fontsize=${textOptions.fontSize}:box=1:boxcolor=${
        textOptions.boxColour
      }@${textOptions.boxTransparency}:boxborderw=${
        textOptions.boxBorderWidth
      }:x=${textOptions.x}:y=${textOptions.y}`,
      //'-r',
      //`${framerate}`,
      /*
      '-t',
      `${duration / 1000}`,
      '-ss',
      `${startTime / 1000}`,
      */
      '-f',
      'gif',
      'out.gif'
    )

    // Once the trasfromation is executed, we can get the created out.gif file from FS and create a new URL for the created GIF

    const output = ffmpeg.FS('readFile', 'out.gif')

    // Blob needs an array, so wrap the output buffer with [] to turn it into a standard array, and give it a type of gif
    setGifUrl(
      URL.createObjectURL(new Blob([output.buffer], { type: 'image/gif' }))
    )

    mediaRecorder.current = null
    setDisablePlayPause(false)
  }

  const videoReady = async () => {
    if (vidRef.current) {
      //console.log('Video reference:')
      //console.log(vidRef)
      // Make sure that the GIF is at least of length minimumDuration, by stopping the user to select the GIF start time at the very end of the video
      // Let's turn it into milliseconds

      const dividend = await takeDown(
        vidRef.current.videoWidth,
        vidRef.current.videoHeight
      )
      console.log(dividend)

      setTextOptions({
        ...textOptions,
        fontSize: (dividend[0] / 10).toString(),
      })
      setVideoLength(vidRef.current.duration * 1000 - minimumDuration)
      setMaxDuration(
        vidRef.current.duration * 1000 > 4000
          ? 4000
          : vidRef.current.duration * 1000
      )
      setDuration(minimumDuration)
    }
  }

  const paintCanvas = (oneIteration?: boolean) => {
    if (!vidRef.current) return
    if (!ctx) return
    if (showFrame) return

    if (oneIteration) {
      const single = setInterval(() => {
        if (ctx && vidRef.current) {
          ctx.drawImage(
            vidRef.current,
            0,
            0,
            vidRef.current.clientWidth,
            vidRef.current.clientHeight
          )

          const dataBuffer = new Uint8ClampedArray(
            ctx.getImageData(
              0,
              0,
              vidRef.current.clientWidth,
              vidRef.current.clientHeight
            ).data.buffer
          )

          // If all values are empty (or equal 0), keep going, otherwise, it means that the first frame has been loaded, and we can stop the interval
          if (dataBuffer.some((color) => color !== 0)) {
            clearInterval(single)
          }
          //const func = callback !== null ? callback(dataBuffer) : dataBuffer

          ctx.putImageData(
            new ImageData(
              // Values do not update in rgbaMod ????
              callback?.(dataBuffer, { rgbaMod, rgbShift, levels }) ||
                dataBuffer,
              vidRef.current.clientWidth,
              vidRef.current.clientHeight
            ),
            0,
            0
          )
        }
      }, 1000 / 30)
      return
    }
    const identifier = window.setInterval(() => {
      // Check if paused
      if (ctx && vidRef.current) {
        ctx.drawImage(
          vidRef.current,
          0,
          0,
          vidRef.current.clientWidth,
          vidRef.current.clientHeight
        )

        const dataBuffer = new Uint8ClampedArray(
          ctx.getImageData(
            0,
            0,
            vidRef.current.clientWidth,
            vidRef.current.clientHeight
          ).data.buffer
        )

        ctx.putImageData(
          new ImageData(
            callback?.(dataBuffer, { rgbaMod, rgbShift, levels }) || dataBuffer,
            vidRef.current.clientWidth,
            vidRef.current.clientHeight
          ),
          0,
          0
        )
      }
    }, 1000 / 30)
    setShowFrame(identifier)
  }

  const checkIfOver = () => {
    if (!vidRef.current) return
    if (
      vidRef.current.currentTime * 1000 >= videoLength &&
      vidRef.current.paused
    ) {
      vidRef.current.currentTime = startTime / 1000
      vidRef.current.play()
      return
    }
    if (
      vidRef.current.currentTime * 1000 >= startTime + duration ||
      vidRef.current.currentTime * 1000 < startTime
    ) {
      vidRef.current.pause()
      vidRef.current.currentTime = startTime / 1000
    }
  }

  const handlePlayPause = () => {
    if (!vidRef.current) return
    checkIfOver()
    if (vidRef.current.paused) {
      vidRef.current.play()
    } else {
      vidRef.current.pause()
    }
  }

  const videoMenuOptions = [
    {
      buttonName: 'Colour Filter',
      videoMenuVal: videoMenu.Colour,
      callbackFunction: customColour as Callback,
      CustomisationComponent: ColourFilterOptions as React.ElementType,
      optionProps: {
        colourNames: ['red', 'green', 'blue'],
        rgbaMod,
        setRgbaMod,
      },
    },
    {
      buttonName: 'RGB Split',
      videoMenuVal: videoMenu.RgbSplit,
      callbackFunction: rgbSplit as Callback,
      CustomisationComponent: RgbSplitOptions as React.ElementType,
      optionProps: {
        colourNames: ['red', 'green', 'blue'],
        rgbShift,
        setRgbShift,
      },
    },
    {
      buttonName: 'Green Screen',
      videoMenuVal: videoMenu.GreenScreen,
      callbackFunction: greenScreen as Callback,
      CustomisationComponent: GreenScreenOptions as React.ElementType,
      optionProps: {
        colourNames: ['red', 'green', 'blue'],
        levels,
        setLevels,
      },
    },
  ]

  return (
    <div className='App'>
      <button
        onClick={() => {
          window.location.reload()
        }}
        className='appNameLogo'
      >
        GIFYD
      </button>
      <div className='bandContainer'>
        <div className='band'></div>
      </div>
      {!gifUrl && !vidUrl && (
        <FileUploader
          fileUploaderProps={{
            fileUploadFunc: videoUpload,
            disabled: disablePlayPause,
          }}
        />
      )}

      {!gifUrl && vidUrl && (
        <div className='mainGrid'>
          <div className='leftSide'>
            <UploadedVideo
              videoElements={{
                canvasRef,
                disablePlayPause,
                vidRef,
                vidUrl,
                showSettings,
                showFrame,
                levels,
                setShowFrame,
                videoReady,
                checkIfOver,
                paintCanvas,
                handlePlayPause,
              }}
            />
            <div className='playButtonContainer'>
              <button
                className='playButton buttonText'
                onClick={handlePlayPause}
                disabled={disablePlayPause}
              >
                <p
                  className={
                    vidRef.current?.paused ? 'playSymbol' : 'pauseSymbol'
                  }
                >
                  {vidRef.current?.paused ? '▶' : '| |'}
                </p>
              </button>
            </div>
            <div className='duoButtons'>
              <Button
                buttonProps={{
                  handleClick: () => {
                    window.location.reload()
                  },
                  buttonName: 'Back',
                  disabled: disablePlayPause,
                  tilt: false,
                }}
              />
              <Button
                buttonProps={{
                  handleClick: makeGif,
                  buttonName: 'GIF it!',
                  disabled: disablePlayPause,
                  tilt: false,
                }}
              />
            </div>
          </div>
          {isLoaded && vidUrl && vidRef.current && (
            <div className='rightSide'>
              <div className='mainSettings'>
                {filters.map(({ setting, buttonName }) => (
                  <MainSettingsButton
                    key={buttonName + setting}
                    buttonProps={{
                      showSettings,
                      setShowSettings,
                      disablePlayPause,
                      setting,
                      buttonName,
                      isFocused,
                      setIsFocused,
                    }}
                  />
                ))}
              </div>
              <div className='extraSettings'>
                {showSettings.includes(`${settings.GIF}`) && (
                  <EditOptions
                    editProps={{
                      videoLength,
                      startTime,
                      vidRef,
                      setStartTime,
                      framerate,
                      setFramerate,
                      duration,
                      minimumDuration,
                      maxDuration,
                      setDuration,
                    }}
                  />
                )}
                {showSettings.includes(`${settings.Video}`) && (
                  <FilterOptions
                    filterProps={{
                      videoMenuOptions,
                      colourSettings,
                      rgbaMod,
                      setRgbaMod,
                      setColourSettings,
                      setCallback,
                      isFilterFocused,
                      setIsFilterFocused,
                    }}
                  />
                )}
                {showSettings.includes(`${settings.Text}`) && (
                  <CaptionOptions
                    captionOptions={{
                      textPositions,
                      textSizes,
                      textFonts,
                      targetContentColourInputs,
                      textOptions,
                      setTextOptions,
                      vidRef,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {gifUrl && (
        <GifResult gifProps={{ gifRef, gifUrl, disablePlayPause, setGifUrl }} />
      )}
    </div>
  )
}

export default App
