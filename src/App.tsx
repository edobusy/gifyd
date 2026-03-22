import React, {
	ChangeEvent,
	useEffect,
	useRef,
	useState,
} from "react"
import "./App.css"
import { VideoSettings } from "./interfaces/types"
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
import {
	seekVideoToTime,
	waitForVideoData,
	waitForNextFrame,
	waitForVideoFrameReady,
	pauseVideo,
} from "./utils/videoHelpers"
import { useFFmpeg } from "./hooks/useFFmpeg"
import { useTimeline } from "./hooks/useTimeline"
import { useFilters } from "./hooks/useFilters"
import { useCanvasRenderer } from "./hooks/useCanvasRenderer"
import { useGifCreation } from "./hooks/useGifCreation"

const INITIAL_TEXT_OPTIONS: VideoSettings = {
	content: "",
	textColour: "#ffffff",
	font: "times",
	fontSize: "(w-text_w)/10",
	boxColour: "#000000",
	boxTransparency: "0.5",
	boxBorderWidth: "5",
	x: "(w-text_w)/2",
	y: "(h-text_h)/2",
}

function App() {
	// --- Core hooks ---
	const { ffmpeg, isLoaded, ffmpegError } = useFFmpeg()
	const timeline = useTimeline()
	const { vidRef, startTime, framerate, duration, minimumDuration } = timeline
	const filterState = useFilters()
	const {
		rgbaMod, setRgbaMod, rgbShift, setRgbShift,
		levels, setLevels, callback, setCallback,
		colourSettings, setColourSettings, colorChanged,
	} = filterState

	// --- Local UI state (declared before hooks that depend on them) ---
	const [uploadedFile, setUploadedFile] = useState<File | null>(null)
	const [vidUrl, setVidUrl] = useState("")
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [showSettings, setShowSettings] = useState<settings | null>(null)
	const [isFocused, setIsFocused] = useState([false, false, false])
	const [isFilterFocused, setIsFilterFocused] = useState([false, false, false])
	const [textOptions, setTextOptions] = useState<VideoSettings>(INITIAL_TEXT_OPTIONS)
	const [gifTargetWidth, setGifTargetWidth] = useState<number | null>(null)
	const [gifTargetHeight, setGifTargetHeight] = useState<number | null>(null)
	const fontSizeRef = useRef<string | null>(null)
	const [videoIsReady, setVideoIsReady] = useState(false)

	const canvas = useCanvasRenderer({
		vidRef,
		startTime,
		framerate,
		duration,
		callback,
		rgbaMod,
		rgbShift,
		levels,
		colorChanged,
	})

	const gif = useGifCreation({
		ffmpeg,
		isLoaded,
		vidRef,
		canvasRef: canvas.canvasRef,
		ctx: canvas.ctx,
		showFrame: canvas.showFrame,
		setShowFrame: canvas.setShowFrame,
		mediaRecorder: canvas.mediaRecorder,
		isPlaybackActive: canvas.isPlaybackActive,
		startTime,
		framerate,
		duration,
		textOptions,
		startDrawingFrames: canvas.startDrawingFrames,
		drawFrame: canvas.drawFrame,
		paintCanvasAtCurrentTime: canvas.paintCanvasAtCurrentTime,
	})

	const { gifUrl, setGifUrl, gifStatus, disablePlayPause, setDisablePlayPause, gifRef, makeGif } = gif
	const { isPlaybackActive } = canvas

	// --- Effects ---

	// Create/revoke video object URL
	useEffect(() => {
		if (!uploadedFile) return
		const fileURL = URL.createObjectURL(uploadedFile)
		setVidUrl(fileURL)
		return () => {
			if (fileURL) URL.revokeObjectURL(fileURL)
		}
	}, [uploadedFile])

	// Revoke GIF URL on change
	useEffect(() => {
		return () => {
			if (gifUrl) URL.revokeObjectURL(gifUrl)
		}
	}, [gifUrl])

	// When startTime changes, repaint the canvas at the new position
	useEffect(() => {
		if (!videoIsReady || !canvas.ctx || !vidRef.current) return
		if (gifUrl) return
		let cancelled = false
		const repaintAtNewStartTime = async () => {
			try {
				const video = vidRef.current
				const canvasEl = canvas.canvasRef.current
				if (!video || !canvasEl) return
				await seekVideoToTime(video, startTime / 1000)
				if (cancelled) return
				await waitForVideoFrameReady(video, canvasEl)
				if (cancelled) return
				const width = video.clientWidth
				const height = video.clientHeight
				if (width === 0 || height === 0) return
				canvas.ctx!.clearRect(0, 0, width, height)
				canvas.ctx!.drawImage(video, 0, 0, width, height)
				const imageData = canvas.ctx!.getImageData(0, 0, width, height)
				const dataBuffer = new Uint8ClampedArray(imageData.data.buffer)
				if (!dataBuffer.some((val, idx) => idx % 4 !== 3 && val !== 0)) return
				if (cancelled) return
				canvas.drawFrame(canvas.ctx!, dataBuffer, width, height)
			} catch (error) {
				if (!cancelled) {
					console.error("Error repainting at new startTime:", error)
				}
			}
		}
		repaintAtNewStartTime()
		return () => { cancelled = true }
	}, [startTime, videoIsReady, canvas.ctx, gifUrl])

	// Paint initial frame when both video and canvas are ready
	useEffect(() => {
		if (!videoIsReady || !canvas.ctx || !vidRef.current) return
		if (gifUrl) return
		const paintInitialFrame = async () => {
			try {
				const video = vidRef.current
				const canvasEl = canvas.canvasRef.current
				if (!video || !canvas.ctx || !canvasEl) return
				if (canvasEl.width === 0 || canvasEl.height === 0) {
					console.warn("Canvas has 0 dimensions, waiting for resize...")
					await waitForNextFrame()
					if (canvasEl.width === 0 || canvasEl.height === 0) {
						console.error("Canvas still has 0 dimensions after waiting")
						return
					}
				}
				await seekVideoToTime(video, startTime / 1000)
				await waitForVideoFrameReady(video, canvas.canvasRef.current || undefined)
				if (video.clientWidth > 0 && video.clientHeight > 0) {
					await canvas.paintCanvasAtCurrentTime()
				} else {
					console.warn("Video has invalid dimensions:", video.clientWidth, "x", video.clientHeight)
				}
			} catch (error) {
				console.error("Initial paint error:", error)
			}
		}
		paintInitialFrame()
	}, [videoIsReady, canvas.ctx, gifUrl])

	// Handle returning from GIF result
	useEffect(() => {
		if (gifUrl) {
			setVideoIsReady(false)
			return
		}
		if (!vidUrl || !canvas.ctx || !vidRef.current) return
		if (!videoIsReady) return
		const reinitializeVideo = async () => {
			try {
				if (!vidRef.current || !canvas.ctx) return
				const video = vidRef.current
				await pauseVideo(video)
				if (canvas.showFrame) {
					canvas.showFrame.stop()
					canvas.setShowFrame(null)
				}
				await seekVideoToTime(video, startTime / 1000)
				await waitForVideoFrameReady(video, canvas.canvasRef.current || undefined)
				if (video.clientWidth > 0 && video.clientHeight > 0) {
					await canvas.paintCanvasAtCurrentTime()
				}
			} catch (error) {
				console.error("Reinitialization error:", error)
				try {
					await canvas.paintCanvasAtCurrentTime()
				} catch (e) {
					console.error("Paint fallback failed:", e)
				}
			}
		}
		reinitializeVideo()
	}, [gifUrl, vidUrl, canvas.ctx, videoIsReady])

	// When framerate changes, restart the preview animation
	useEffect(() => {
		if (!vidRef.current || vidRef.current.paused || !canvas.showFrame) return
		canvas.showFrame.stop()
		canvas.setShowFrame(null)
		if (canvas.ctx) {
			const frameController = canvas.startDrawingFrames(
				canvas.ctx, vidRef, canvas.drawFrame, false, canvas.checkIfOver,
			)
			canvas.setShowFrame(frameController)
		}
	}, [framerate])

	// --- Handlers ---

	const videoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return
		if (e.target.files.length !== 1) {
			setUploadError("Please upload one file")
			return
		}
		if (e.target.files[0].type !== "video/mp4") {
			setUploadError("Please upload an mp4 video")
			return
		}
		if (e.target.files[0].size < 20000) {
			setUploadError("Video is too tiny!")
			return
		}
		const MAX_FILE_SIZE = 500 * 1024 * 1024
		if (e.target.files[0].size > MAX_FILE_SIZE) {
			setUploadError("Video is too big! Maximum size is 500 MB.")
			return
		}
		setUploadError(null)
		setUploadedFile(e.target.files[0])
	}

	const videoReady = async () => {
		if (!vidRef.current) return
		try {
			const video = vidRef.current
			if (video.readyState < 2) {
				await waitForVideoData(video)
			}
			const dividend = takeDown(video.videoWidth, video.videoHeight)
			setGifTargetWidth(dividend[0])
			setGifTargetHeight(dividend[1])
			timeline.initFromVideo(video.duration * 1000)
			if (!fontSizeRef.current) {
				const initialFontSize = (dividend[0] / 10).toString()
				fontSizeRef.current = initialFontSize
				setTextOptions((prev) => ({ ...prev, fontSize: initialFontSize }))
			} else {
				setTextOptions((prev) => ({ ...prev, fontSize: fontSizeRef.current! }))
			}
			const width = video.clientWidth
			const height = video.clientHeight
			canvas.setCanvasDimensions({ width, height })
			await seekVideoToTime(video, startTime / 1000)
			await waitForVideoFrameReady(video, canvas.canvasRef.current || undefined)
			setVideoIsReady(true)
		} catch (error) {
			console.error("videoReady error:", error)
			setVideoIsReady(true)
		}
	}

	const handlePlayPause = async () => {
		if (!vidRef.current) return
		await canvas.checkIfOver()
		if (vidRef.current.paused) {
			isPlaybackActive.current = true
			vidRef.current.play()
		} else {
			isPlaybackActive.current = false
			vidRef.current.pause()
		}
	}

	const resetApp = () => {
		canvas.reset()
		gif.reset()
		filterState.reset()
		timeline.reset()
		// Setting uploadedFile to null triggers the useEffect cleanup
		// which revokes the vidUrl object URL — no manual revoke needed.
		setUploadedFile(null)
		setVidUrl("")
		setUploadError(null)
		setVideoIsReady(false)
		setShowSettings(null)
		setIsFocused([false, false, false])
		setIsFilterFocused([false, false, false])
		setTextOptions(INITIAL_TEXT_OPTIONS)
		setGifTargetWidth(null)
		setGifTargetHeight(null)
		fontSizeRef.current = null
	}

	// --- Menu config ---

	const videoMenuOptions = [
		{
			buttonName: "Colour Filter",
			videoMenuVal: videoMenu.Colour,
			callbackFunction: customColour,
			CustomisationComponent: ColourFilterOptions as React.ElementType,
			optionProps: { colourNames: ["red", "green", "blue"], rgbaMod, setRgbaMod },
		},
		{
			buttonName: "RGB Split",
			videoMenuVal: videoMenu.RgbSplit,
			callbackFunction: rgbSplit,
			CustomisationComponent: RgbSplitOptions as React.ElementType,
			optionProps: { colourNames: ["red", "green", "blue"], rgbShift, setRgbShift },
		},
		{
			buttonName: "Green Screen",
			videoMenuVal: videoMenu.GreenScreen,
			callbackFunction: greenScreen,
			CustomisationComponent: GreenScreenOptions as React.ElementType,
			optionProps: { colourNames: ["red", "green", "blue"], levels, setLevels },
		},
	]

	// --- Render ---

	return (
		<div className="App">
			<button
				onClick={resetApp}
				className="appNameLogo"
				aria-label="GIFYD - Return to home"
			>
				GIFYD
			</button>
			<div className="bandContainer">
				<div className="band"></div>
			</div>
			<p className="sr-only" aria-live="polite">{gifStatus}</p>
			{ffmpegError && (
				<p className="errorMessage" role="alert">{ffmpegError}</p>
			)}
			{!gifUrl && !vidUrl && (
				<>
					<FileUploader
						fileUploadFunc={videoUpload}
						disabled={disablePlayPause}
					/>
					{uploadError && (
						<p className="errorMessage" role="alert">{uploadError}</p>
					)}
				</>
			)}
			{!gifUrl && vidUrl && (
				<div className="mainGrid">
					<div className="leftSide">
						<UploadedVideo
							canvasRef={canvas.canvasRef}
							canvasCallbackRef={canvas.canvasCallbackRef}
							vidRef={vidRef}
							vidUrl={vidUrl}
							showFrame={canvas.showFrame}
							setShowFrame={canvas.setShowFrame}
							videoReady={videoReady}
							checkIfOver={canvas.checkIfOver}
							paintCanvas={canvas.paintCanvas}
							textOptions={textOptions}
							textPositions={textPositions}
							gifTargetWidth={gifTargetWidth}
							gifTargetHeight={gifTargetHeight}
							canvasDimensions={canvas.canvasDimensions}
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
								handleClick={resetApp}
								buttonName="Back"
								disabled={disablePlayPause}
								tilt={false}
							/>
							<Button
								handleClick={() => {
									setIsFocused([false, false, false])
									setShowSettings(null)
									makeGif()
								}}
								buttonName="GIF it!"
								disabled={disablePlayPause}
								tilt={false}
							/>
						</div>
					</div>
					{isLoaded && vidUrl && vidRef.current && (
						<div className="rightSide">
							<div className="mainSettings">
								{filters.map(({ setting, buttonName }) => (
									<MainSettingsButton
										key={buttonName + setting}
										showSettings={showSettings}
										setShowSettings={setShowSettings}
										disablePlayPause={disablePlayPause}
										setting={setting}
										buttonName={buttonName}
										isFocused={isFocused}
										setIsFocused={setIsFocused}
									/>
								))}
							</div>
							<div className="extraSettings">
								{showSettings === settings.GIF && (
									<EditOptions
										maxStartTime={timeline.maxStartTime}
										startTime={startTime}
										setStartTime={timeline.setStartTime}
										framerate={framerate}
										setFramerate={timeline.setFramerate}
										duration={timeline.duration}
										minimumDuration={minimumDuration}
										maxDuration={timeline.maxDuration}
										setDuration={timeline.setDuration}
									/>
								)}
								{showSettings === settings.Video && (
									<FilterOptions
										videoMenuOptions={videoMenuOptions}
										colourSettings={colourSettings}
										rgbaMod={rgbaMod}
										setRgbaMod={setRgbaMod}
										setColourSettings={setColourSettings}
										setCallback={setCallback}
										isFilterFocused={isFilterFocused}
										setIsFilterFocused={setIsFilterFocused}
									/>
								)}
								{showSettings === settings.Text && (
									<CaptionOptions
										textPositions={textPositions}
										textSizes={textSizes}
										textFonts={textFonts}
										targetContentColourInputs={targetContentColourInputs}
										textOptions={textOptions}
										setTextOptions={setTextOptions}
										vidRef={vidRef}
										fontSizeRef={fontSizeRef}
									/>
								)}
							</div>
						</div>
					)}
				</div>
			)}
			{gifUrl && (
				<GifResult gifRef={gifRef} gifUrl={gifUrl} disablePlayPause={disablePlayPause} setGifUrl={setGifUrl} />
			)}
		</div>
	)
}
export default App
