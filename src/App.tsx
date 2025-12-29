// Gifyd

/*
  IMPORTANT NOTE ABOUT CALLBACKS & REACT STATE:

  If a function is stored in React state (e.g. `customColour` stored via `setCallback`)
  and that function reads values from other state variables (e.g. `rgbaMod`),
  the function will "capture" those values at the moment `setCallback` is called.

  This means:
  - The function does NOT automatically see future updates to that state
  - If `rgbaMod` changes later, the version of `rgbaMod` inside the stored callback
    remains frozen at the old values

  In this app:
  - `customColour` is stored as a callback
  - It depends on `rgbaMod`
  - If `rgbaMod` changes after `setCallback(customColour)` is called,
    the callback will continue using stale colour values

  To avoid this, dynamic values are explicitly passed into the callback
  at execution time instead of relying on closures.
*/

import React, {
	ChangeEvent,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react"
import "./App.css"
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg"
import times from "./assets/times.ttf"
import impact from "./assets/impact.ttf"
import comic from "./assets/comic.ttf"
import {
	Callback,
	Colour,
	FilterLevels,
	VideoSettings,
} from "./interfaces/types"
import { settings, videoMenu } from "./interfaces/enums"
import UploadedVideo from "./components/UploadedVideo"
import MainSettingsButton from "./components/MainSettingsButton"
import EditOptions from "./components/EditOptions"
import FilterOptions from "./components/FilterOptions"
import ColourFilterOptions from "./components/Filter/FilterSubOptions/ColourFilter/ColourFilterOptions"
import RgbSplitOptions from "./components/Filter/FilterSubOptions/RGBSplit/RgbSplitOptions"
import GreenScreenOptions from "./components/Filter/FilterSubOptions/GreenScreen/GreenScreenOptions"
import {
	customColour,
	greenScreen,
	rgbSplit,
	takeDown,
} from "./functions/videoManipulation"
import CaptionOptions from "./components/CaptionOptions"
import {
	filters,
	textPositions,
	textSizes,
	textFonts,
	targetContentColourInputs,
} from "./interfaces/componentConfigs"
import FileUploader from "./components/generic/FileUploader"
import Button from "./components/generic/Button"
import GifResult from "./components/GifResult"

const ffmpeg = createFFmpeg({ log: false })

function App() {
	const [uploadedFile, setuploadedFile] = useState<File | null>(null)
	const [vidUrl, setvidUrl] = useState("")
	const [gifUrl, setGifUrl] = useState("")
	const vidRef = useRef<HTMLVideoElement>(null)
	const gifRef = useRef<HTMLImageElement>(null)
	const [isLoaded, setIsLoaded] = useState(false)

	const [startTime, setStartTime] = useState(0)
	const [framerate, setFramerate] = useState(15)
	const minimumDuration = 1000
	const [duration, setDuration] = useState(minimumDuration)
	const [maxDuration, setMaxDuration] = useState(0)
	const [videoLength, setVideoLength] = useState(0)

	const [showSettings, setShowSettings] = useState("")
	const [colourSettings, setColourSettings] = useState("")

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
		background: "#3fff00",
	})

	const [textOptions, setTextOptions] = useState<VideoSettings>({
		content: "",
		textColour: "#ffffff",
		font: "times",
		fontSize: "(w-text_w)/10",
		boxColour: "#000000",
		boxTransparency: "0.5",
		boxBorderWidth: "5",
		x: "(w-text_w)/2",
		y: "(h-text_h)-(h-text_h)/20",
	})

	const mediaRecorder = useRef<MediaRecorder | null>()

	// Initial paint when canvas context is ready
	useLayoutEffect(() => {
		paintCanvas(true)
	}, [ctx])

	// Whenever filter settings change, we need to update the canvas painting
	useLayoutEffect(() => {
		// If the video is paused, we need to paint the current frame again
		if (vidRef.current?.paused) {
			paintCanvas(true)
		}
		// If video is running, reset canvas painting to use new filter values
		if (showFrame) {
			clearInterval(showFrame)
			colorChanged.current = true
			setShowFrame(null)
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
		// Paint canvas fresh because colors have changed
		if (!showFrame && colorChanged.current === true) {
			paintCanvas()
			colorChanged.current = false
		}

		// If the video stopped running, stop the media recorder as well
		if (
			!showFrame &&
			mediaRecorder.current &&
			mediaRecorder.current.state === "recording"
		) {
			mediaRecorder.current.stop()
		}
	}, [showFrame])

	// Load ffmpeg.wasm on initial app load
	useEffect(() => {
		loadFfmpeg()
	}, [])

	// Create video URL when a file is uploaded
	useEffect(() => {
		const fileURL = ""

		if (uploadedFile) {
			const fileURL = URL.createObjectURL(uploadedFile)
			setvidUrl(fileURL)
		}
		return () => {
			if (fileURL) {
				URL.revokeObjectURL(fileURL)
			}
		}
	}, [uploadedFile])

	// Update max duration when start time changes
	useEffect(() => {
		if (vidRef.current) {
			setMaxDuration(
				videoLength + minimumDuration - startTime > 4000
					? 4000
					: videoLength + minimumDuration - startTime
			)
		}
	}, [startTime])

	// Set up canvas context
	useEffect(() => {
		if (canvasRef.current) {
			setCtx(canvasRef.current.getContext("2d", { willReadFrequently: true }))
		}
	}, [canvasRef.current])

	const loadFfmpeg = async () => {
		await ffmpeg.load()
		setIsLoaded(true)
	}

	// Video upload validation
	const videoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) {
			return
		}

		if (e.target.files.length !== 1) {
			alert("Please upload one file!")
			return
		}
		if (e.target.files[0].type !== "video/mp4") {
			alert("Please upload an mp4 video")
			return
		}
		if (e.target.files[0].size < 20000) {
			alert("Video is too tiny!")
			return
		}
		if (e.target.files[0].size > 358406553600) {
			alert("Video is too big!")
			return
		}
		setuploadedFile(e.target.files[0])
	}

	function startDrawingFrames(
		ctx: CanvasRenderingContext2D | null,
		vidRef: React.RefObject<HTMLVideoElement>,
		callbackFn: (
			ctx: CanvasRenderingContext2D,
			data: Uint8ClampedArray,
			width: number,
			height: number
		) => void,
		oneIteration: boolean = false
	): number {
		const interval = window.setInterval(() => {
			if (!ctx || !vidRef.current) return

			const width = vidRef.current.clientWidth
			const height = vidRef.current.clientHeight

			// Draw the current video frame onto the canvas
			ctx.drawImage(vidRef.current, 0, 0, width, height)

			// Extract pixel data
			const dataBuffer = new Uint8ClampedArray(
				ctx.getImageData(0, 0, width, height).data.buffer
			)

			// If running in single-frame mode, stop when first non-empty frame is found
			if (oneIteration && dataBuffer.some((color) => color !== 0)) {
				clearInterval(interval)
			}

			// Apply your pixel processing / filters
			callbackFn(ctx, dataBuffer, width, height)
		}, 1000 / 30)

		return interval
	}

	// Take recorded video data, feed to ffmpeg, and produce mp4 output
	const transcode = async (data: Uint8Array) => {
		if (!vidRef.current) return

		const name = "record.webm"

		// Write the file to ffmpeg memory
		ffmpeg.FS("writeFile", name, data)

		const widthHeight = await takeDown(
			vidRef.current.videoWidth,
			vidRef.current.videoHeight
		)

		// Run ffmpeg command to transcode the video
		await ffmpeg.run(
			"-i",
			name,
			"-r",
			`${framerate}`,
			"-s",
			`${widthHeight[0]}x${widthHeight[1]}`, // 720x720 540x960 960x540
			"vid.mp4"
		)
	}

	// Records the canvas stream instead of the original video element.
	// This allows filters to be baked directly into the recorded output.
	function fn() {
		const recordedChunks: Blob[] = []

		return new Promise<{ url: string; blob: Blob } | null>((res, rej) => {
			if (!canvasRef.current) return rej

			if (!vidRef.current) return rej

			// Capture the canvas stream so recorded video includes all visual effects
			let stream = canvasRef.current.captureStream()

			mediaRecorder.current = new MediaRecorder(stream, {
				mimeType: "video/webm; codecs=vp9",
			})

			mediaRecorder.current.start()
			vidRef.current.play()

			// Fired each time MediaRecorder has a new chunk of video data
			mediaRecorder.current.ondataavailable = function (e) {
				recordedChunks.push(e.data)
			}

			mediaRecorder.current.onstop = function (event) {
				const blob = new Blob(recordedChunks, {
					type: "video/webm",
				})
				var url = URL.createObjectURL(blob)
				res({ url, blob }) // resolve both blob and url in an object
			}

			// Set up a repeating interval to continuously draw video frames onto the canvas
			// This ensures any applied filters or transformations are rendered in real-time
			let identifier = startDrawingFrames(ctx, vidRef, drawFrame)

			// Store the interval ID in state to allow later clearing
			setShowFrame(identifier)
		})
	}

	const createVid = async () => {
		// Record the canvas stream which includes all applied filters
		const result = await fn()

		if (!result) return

		const resolvedVid = await result.blob.arrayBuffer()

		// Create mp4 video from canvas recording, which makeGif will use to create gif
		await transcode(new Uint8Array(resolvedVid))
	}

	const makeGif = async () => {
		if (!vidRef.current) return
		if (!isLoaded) return

		setIsFocused([false, false, false])
		setDisablePlayPause(true)
		setShowSettings("")
		vidRef.current.pause()
		vidRef.current.currentTime = startTime / 1000

		await createVid()

		let fontData = await fetchFile(times)
		ffmpeg.FS("writeFile", "times.ttf", fontData)
		fontData = await fetchFile(comic)
		ffmpeg.FS("writeFile", "comic.ttf", fontData)
		fontData = await fetchFile(impact)
		ffmpeg.FS("writeFile", "impact.ttf", fontData)

		// -i INPUT
		// -s FRAME SIZE
		// -r FRAMERATE PER SECOND
		// -t TIME LENGTH IN SECONDS
		// -ss START OFFSET IN SECONDS
		// -f OUTPUT FORMAT
		await ffmpeg.run(
			"-i",
			"vid.mp4",
			//'-s',
			//'480x320',
			"-vf",
			`drawtext=fontfile=${
				textOptions.font === "cursive" ? "comic" : textOptions.font
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
			"-f",
			"gif",
			"out.gif"
		)

		// Once the transformation is executed, we can get the created out.gif file from FS and create a new URL for the created GIF
		const output = ffmpeg.FS("readFile", "out.gif")

		// Blob needs an array, so wrap the output buffer with [] to turn it into a standard array, and give it a type of gif
		// Because we now have a GIF URL, we can show the GifResult component
		setGifUrl(
			URL.createObjectURL(
				new Blob([output.buffer as BlobPart], { type: "image/gif" })
			)
		)

		mediaRecorder.current = null
		setDisablePlayPause(false)
	}

	const videoReady = async () => {
		if (vidRef.current) {
			const dividend = await takeDown(
				vidRef.current.videoWidth,
				vidRef.current.videoHeight
			)

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

			// Make sure that the GIF is at least of length minimumDuration, by stopping the user from selecting the GIF start time at the very end of the video
			setDuration(minimumDuration)
		}
	}

	// Draws a single frame onto the canvas, applying the selected filter callback
	const drawFrame = (
		ctx: CanvasRenderingContext2D,
		dataBuffer: Uint8ClampedArray,
		width: number,
		height: number
	) => {
		// The callback receives current values explicitly to avoid stale state caused by closure capture
		// If no filter is selected, just return the original dataBuffer
		const processed =
			callback?.(dataBuffer, { rgbaMod, rgbShift, levels }) ?? dataBuffer

		ctx.putImageData(
			new ImageData(new Uint8ClampedArray(processed), width, height),
			0,
			0
		)
	}

	// Draws video frames onto the canvas and applies filters in real time.
	// Uses intervals instead of requestAnimationFrame to control frame rate
	// and avoid unnecessary renders when paused.
	const paintCanvas = (oneIteration?: boolean) => {
		if (!vidRef.current) return
		if (!ctx) return
		if (showFrame) return

		// oneIteration is used to draw a single frame (e.g. when paused)
		// We keep polling until the first real frame loads (non-zero pixels)
		if (oneIteration) {
			startDrawingFrames(ctx, vidRef, drawFrame, true)
			return
		}

		// Set up a repeating interval to continuously draw video frames onto the canvas
		// This ensures any applied filters or transformations are rendered in real-time
		let identifier = startDrawingFrames(ctx, vidRef, drawFrame)

		setShowFrame(identifier)
	}

	// Ensures playback stays within the selected GIF time range.
	// Automatically loops or resets when boundaries are exceeded.
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
			buttonName: "Colour Filter",
			videoMenuVal: videoMenu.Colour,
			callbackFunction: customColour as Callback,
			CustomisationComponent: ColourFilterOptions as React.ElementType,
			optionProps: {
				colourNames: ["red", "green", "blue"],
				rgbaMod,
				setRgbaMod,
			},
		},
		{
			buttonName: "RGB Split",
			videoMenuVal: videoMenu.RgbSplit,
			callbackFunction: rgbSplit as Callback,
			CustomisationComponent: RgbSplitOptions as React.ElementType,
			optionProps: {
				colourNames: ["red", "green", "blue"],
				rgbShift,
				setRgbShift,
			},
		},
		{
			buttonName: "Green Screen",
			videoMenuVal: videoMenu.GreenScreen,
			callbackFunction: greenScreen as Callback,
			CustomisationComponent: GreenScreenOptions as React.ElementType,
			optionProps: {
				colourNames: ["red", "green", "blue"],
				levels,
				setLevels,
			},
		},
	]

	return (
		<div className="App">
			<button
				onClick={() => {
					window.location.reload()
				}}
				className="appNameLogo"
			>
				GIFYD
			</button>
			<div className="bandContainer">
				<div className="band"></div>
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
				<div className="mainGrid">
					<div className="leftSide">
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
						<div className="playButtonContainer">
							<button
								className="playButton buttonText"
								onClick={handlePlayPause}
								disabled={disablePlayPause}
							>
								<p
									className={
										vidRef.current?.paused ? "playSymbol" : "pauseSymbol"
									}
								>
									{vidRef.current?.paused ? "▶" : "| |"}
								</p>
							</button>
						</div>
						<div className="duoButtons">
							<Button
								buttonProps={{
									handleClick: () => {
										window.location.reload()
									},
									buttonName: "Back",
									disabled: disablePlayPause,
									tilt: false,
								}}
							/>
							<Button
								buttonProps={{
									handleClick: makeGif,
									buttonName: "GIF it!",
									disabled: disablePlayPause,
									tilt: false,
								}}
							/>
						</div>
					</div>
					{isLoaded && vidUrl && vidRef.current && (
						<div className="rightSide">
							<div className="mainSettings">
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
							<div className="extraSettings">
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
