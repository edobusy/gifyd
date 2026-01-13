/* Full App.tsx with minimal edits to add gifTargetWidth/gifTargetHeight and pass them down.
   Most of the file is unchanged from the repo, edits are marked with comments.
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
	const [showFrame, setShowFrame] = useState<{ stop: () => void } | null>(null)

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
		y: "(h-text_h)/2",
	})

	// Store the final GIF (ffmpeg) target dimensions so previews can be pixel-perfect
	const [gifTargetWidth, setGifTargetWidth] = useState<number | null>(null)
	const [gifTargetHeight, setGifTargetHeight] = useState<number | null>(null)

	const mediaRecorder = useRef<MediaRecorder | null>()

	const fontSizeRef = useRef<string | null>(null) // <-- persistent font size

	// Initial paint when canvas context is ready
	// useLayoutEffect(() => {
	//   paintCanvas(true)
	// }, [ctx])

	// Whenever filter settings change, we need to update the canvas painting
	useLayoutEffect(() => {
		if (vidRef.current?.paused) {
			paintCanvas(true)
		}
		if (showFrame) {
			showFrame.stop() // ← CHANGED: Call the stop method
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
		if (!showFrame && colorChanged.current === true) {
			paintCanvas()
			colorChanged.current = false
		}

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
			setCtx(canvasRef.current.getContext("2d", { willReadFrequently: true }))
		}
	}, [canvasRef.current])

	useEffect(() => {
		if (gifUrl || !ctx || !vidRef.current) return

		const repaint = async () => {
			if (!vidRef.current || !ctx) return

			vidRef.current.pause()
			vidRef.current.currentTime = startTime / 1000

			await new Promise<void>((resolve) => {
				const timeout = setTimeout(resolve, 500)
				const onSeeked = () => {
					clearTimeout(timeout)
					vidRef.current?.removeEventListener("seeked", onSeeked)
					resolve()
				}
				vidRef.current?.addEventListener("seeked", onSeeked, { once: true })
			})

			setTimeout(() => {
				paintCanvasAtCurrentTime()
			}, 50)
		}

		repaint()
	}, [gifUrl])

	useEffect(() => {
		// When returning from GIF result, ensure video is painted
		if (!gifUrl && vidUrl && ctx && vidRef.current) {
			const timer = setTimeout(() => {
				paintCanvasAtCurrentTime()
			}, 100)

			return () => clearTimeout(timer)
		}
	}, [gifUrl, vidUrl])

	const loadFfmpeg = async () => {
		await ffmpeg.load()
		setIsLoaded(true)
	}

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

	const paintCanvasAtCurrentTime = async () => {
		if (!ctx || !vidRef.current) return

		vidRef.current.pause()

		const targetTime = startTime / 1000

		// Only seek if we're not already there
		if (Math.abs(vidRef.current.currentTime - targetTime) > 0.01) {
			vidRef.current.currentTime = targetTime

			await new Promise<void>((resolve) => {
				const timeout = setTimeout(() => {
					vidRef.current?.removeEventListener("seeked", onSeeked)
					resolve()
				}, 1000)

				const onSeeked = () => {
					clearTimeout(timeout)
					vidRef.current?.removeEventListener("seeked", onSeeked)
					resolve()
				}
				vidRef.current?.addEventListener("seeked", onSeeked, { once: true })
			})
		}

		// Small delay to ensure frame is decoded
		await new Promise((resolve) => setTimeout(resolve, 50))

		const width = vidRef.current.clientWidth
		const height = vidRef.current.clientHeight

		if (width === 0 || height === 0) {
			console.warn("Video has invalid dimensions")
			return
		}

		ctx.clearRect(0, 0, width, height)
		ctx.drawImage(vidRef.current, 0, 0, width, height)

		drawFrame(
			ctx,
			new Uint8ClampedArray(ctx.getImageData(0, 0, width, height).data.buffer),
			width,
			height
		)
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
	): { stop: () => void } {
		let stopped = false
		let callbackId: number | null = null

		const processFrame = () => {
			if (stopped || !ctx || !vidRef.current) return

			const width = vidRef.current.clientWidth
			const height = vidRef.current.clientHeight

			if (width === 0 || height === 0) return

			ctx.drawImage(vidRef.current, 0, 0, width, height)

			const dataBuffer = new Uint8ClampedArray(
				ctx.getImageData(0, 0, width, height).data.buffer
			)

			// MOVE THIS UP - Apply filters FIRST
			callbackFn(ctx, dataBuffer, width, height)

			// THEN check if we should stop
			if (oneIteration && dataBuffer.some((color) => color !== 0)) {
				stopped = true
				return
			}

			// Schedule next frame (only if not oneIteration and not stopped)
			if (
				!stopped &&
				!oneIteration &&
				vidRef.current &&
				"requestVideoFrameCallback" in vidRef.current
			) {
				callbackId = (vidRef.current as any).requestVideoFrameCallback(
					processFrame
				)
			}
		}

		// Handle oneIteration case - draw immediately for paused video
		if (oneIteration) {
			// Check if video has valid dimensions first
			if (!vidRef.current || vidRef.current.clientWidth === 0) {
				// Video not ready yet, wait for next frame
				requestAnimationFrame(() => {
					if (!stopped) processFrame()
				})
			} else {
				// Video is ready, draw immediately
				processFrame()
			}

			return {
				stop: () => {
					stopped = true
				},
			}
		}

		// For continuous drawing, use video frame callback
		if (vidRef.current && "requestVideoFrameCallback" in vidRef.current) {
			callbackId = (vidRef.current as any).requestVideoFrameCallback(
				processFrame
			)
		} else {
			// Fallback to setInterval with time tracking
			console.warn("requestVideoFrameCallback not supported, using fallback")
			let lastCapturedTime = -1
			const interval = setInterval(() => {
				if (!vidRef.current) return
				const currentTime = vidRef.current.currentTime
				if (Math.abs(currentTime - lastCapturedTime) < 0.001) return
				lastCapturedTime = currentTime
				processFrame()
			}, 1000 / 30)

			return {
				stop: () => {
					stopped = true
					clearInterval(interval)
				},
			}
		}

		return {
			stop: () => {
				stopped = true
				if (
					callbackId !== null &&
					vidRef.current &&
					"cancelVideoFrameCallback" in vidRef.current
				) {
					;(vidRef.current as any).cancelVideoFrameCallback(callbackId)
				}
			},
		}
	}

	const transcode = async (data: Uint8Array) => {
		if (!vidRef.current) return

		const name = "record.webm"
		ffmpeg.FS("writeFile", name, data)

		const widthHeight = await takeDown(
			vidRef.current.videoWidth,
			vidRef.current.videoHeight
		)

		await ffmpeg.run(
			"-i",
			name,
			"-r",
			`${framerate}`,
			"-s",
			`${widthHeight[0]}x${widthHeight[1]}`,
			"vid.mp4"
		)
	}

	function fn() {
		const recordedChunks: Blob[] = []

		return new Promise<{ url: string; blob: Blob } | null>((res, rej) => {
			if (!canvasRef.current) return rej
			if (!vidRef.current) return rej

			let stream = canvasRef.current.captureStream()

			mediaRecorder.current = new MediaRecorder(stream, {
				mimeType: "video/webm; codecs=vp9",
			})

			mediaRecorder.current.start()
			vidRef.current.play()

			mediaRecorder.current.ondataavailable = function (e) {
				recordedChunks.push(e.data)
			}

			mediaRecorder.current.onstop = function (event) {
				const blob = new Blob(recordedChunks, {
					type: "video/webm",
				})
				var url = URL.createObjectURL(blob)
				res({ url, blob })
			}

			let frameController = startDrawingFrames(ctx, vidRef, drawFrame)
			setShowFrame(frameController) // Now storing the object
		})
	}

	const createVid = async () => {
		const result = await fn()
		if (!result) return

		const resolvedVid = await result.blob.arrayBuffer()
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
		const content = textOptions.content.replace(":", "\\:")

		await createVid()

		let fontData = await fetchFile(times)
		ffmpeg.FS("writeFile", "times.ttf", fontData)
		fontData = await fetchFile(comic)
		ffmpeg.FS("writeFile", "comic.ttf", fontData)
		fontData = await fetchFile(impact)
		ffmpeg.FS("writeFile", "impact.ttf", fontData)

		await ffmpeg.run(
			"-i",
			"vid.mp4",
			"-vf",
			`drawtext=fontfile=${
				textOptions.font === "cursive" ? "comic" : textOptions.font
			}.ttf:text='${content}':fontcolor=${textOptions.textColour}:fontsize=${
				textOptions.fontSize
			}:box=1:boxcolor=${textOptions.boxColour}@${
				textOptions.boxTransparency
			}:boxborderw=${textOptions.boxBorderWidth}:x=${textOptions.x}:y=${
				textOptions.y
			}`,
			"-f",
			"gif",
			"out.gif"
		)

		const output = ffmpeg.FS("readFile", "out.gif")
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

			setGifTargetWidth(dividend[0])
			setGifTargetHeight(dividend[1])

			setVideoLength(vidRef.current.duration * 1000 - minimumDuration)
			setMaxDuration(
				vidRef.current.duration * 1000 > 4000
					? 4000
					: vidRef.current.duration * 1000
			)
			setDuration(minimumDuration)

			if (!fontSizeRef.current) {
				const initialFontSize = (dividend[0] / 10).toString()
				fontSizeRef.current = initialFontSize
				setTextOptions((prev) => ({
					...prev,
					fontSize: initialFontSize,
				}))
			} else {
				setTextOptions((prev) => ({
					...prev,
					fontSize: fontSizeRef.current!,
				}))
			}

			// NEW: Paint the initial frame after video is ready
			vidRef.current.currentTime = startTime / 1000

			// Wait for seek to complete
			await new Promise<void>((resolve) => {
				const timeout = setTimeout(resolve, 500)
				const onSeeked = () => {
					clearTimeout(timeout)
					vidRef.current?.removeEventListener("seeked", onSeeked)
					resolve()
				}
				vidRef.current?.addEventListener("seeked", onSeeked, { once: true })
			})

			// Now paint the canvas
			if (ctx) {
				setTimeout(() => {
					paintCanvasAtCurrentTime()
				}, 50)
			}
		}
	}

	const drawFrame = (
		ctx: CanvasRenderingContext2D,
		dataBuffer: Uint8ClampedArray,
		width: number,
		height: number
	) => {
		const processed =
			callback?.(dataBuffer, { rgbaMod, rgbShift, levels }) ?? dataBuffer

		ctx.putImageData(
			new ImageData(new Uint8ClampedArray(processed), width, height),
			0,
			0
		)
	}

	const paintCanvas = (oneIteration?: boolean) => {
		if (!vidRef.current) return
		if (!ctx) return
		if (showFrame) return

		if (oneIteration) {
			startDrawingFrames(ctx, vidRef, drawFrame, true)
			return
		}

		let frameController = startDrawingFrames(ctx, vidRef, drawFrame)
		setShowFrame(frameController) // Now storing the object
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
								textOptions,
								textPositions,
								gifTargetWidth,
								gifTargetHeight,
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
											fontSizeRef,
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
