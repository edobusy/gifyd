/* Full App.tsx with event-driven improvements - no hardcoded timeouts */
import React, {
	ChangeEvent,
	useCallback,
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
import {
	seekVideoToTime,
	waitForVideoData,
	waitForNextFrame,
	waitForVideoFrameReady,
	pauseVideo,
	playVideo,
} from "./utils/videoHelpers"
import { readFFmpegFile } from "./utils/ffmpegHelpers"
const ffmpeg = createFFmpeg({ log: false })
function App() {
	const [uploadedFile, setUploadedFile] = useState<File | null>(null)
	const [vidUrl, setVidUrl] = useState("")
	const [gifUrl, setGifUrl] = useState("")
	const vidRef = useRef<HTMLVideoElement>(null)
	const gifRef = useRef<HTMLImageElement>(null)
	const [isLoaded, setIsLoaded] = useState(false)
	const [ffmpegError, setFfmpegError] = useState<string | null>(null)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [startTime, setStartTime] = useState(0)
	const [framerate, setFramerate] = useState(15)
	const minimumDuration = 1000
	const [duration, setDuration] = useState(minimumDuration)
	const [maxDuration, setMaxDuration] = useState(0)
	const [videoLength, setVideoLength] = useState(0)
	const [showSettings, setShowSettings] = useState<settings | null>(null)
	const [colourSettings, setColourSettings] = useState<videoMenu | null>(null)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
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
	const [gifTargetWidth, setGifTargetWidth] = useState<number | null>(null)
	const [gifTargetHeight, setGifTargetHeight] = useState<number | null>(null)
	const mediaRecorder = useRef<MediaRecorder | null>()
	const isPlaybackActive = useRef(false)
	const fontSizeRef = useRef<string | null>(null)
	const [videoIsReady, setVideoIsReady] = useState(false)
	const [gifStatus, setGifStatus] = useState("")
	const [canvasDimensions, setCanvasDimensions] = useState({
		width: 0,
		height: 0,
	})
	// Whenever filter settings change, we need to update the canvas painting
	useLayoutEffect(() => {
		if (vidRef.current?.paused) {
			paintCanvas(true)
		}
		if (showFrame) {
			showFrame.stop()
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
	// Event-driven: when framerate changes, restart the preview animation
	useEffect(() => {
		// Only restart if video is currently playing
		if (!vidRef.current || vidRef.current.paused || !showFrame) return
		// Stop the current animation
		showFrame.stop()
		setShowFrame(null)
		// Restart with new framerate
		if (ctx) {
			const frameController = startDrawingFrames(ctx, vidRef, drawFrame)
			setShowFrame(frameController)
		}
	}, [framerate])
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
	useEffect(() => {
		loadFfmpeg()
	}, [])
	useEffect(() => {
		if (!uploadedFile) return
		const fileURL = URL.createObjectURL(uploadedFile)
		setVidUrl(fileURL)
		return () => {
			if (fileURL) {
				URL.revokeObjectURL(fileURL)
			}
		}
	}, [uploadedFile])
	useEffect(() => {
		return () => {
			if (gifUrl) URL.revokeObjectURL(gifUrl)
		}
	}, [gifUrl])
	useEffect(() => {
		if (vidRef.current) {
			const remaining = videoLength + minimumDuration - startTime
			const newMax = remaining > 4000 ? 4000 : remaining
			setMaxDuration(newMax)
			// Clamp duration so startTime + duration never exceeds the video end.
			// The HTML range input visually clamps to its max attribute, but the
			// React state must be explicitly updated to keep the invariant.
			setDuration((prev) => Math.max(minimumDuration, Math.min(prev, newMax)))
		}
	}, [startTime, videoLength])
	// When startTime changes, repaint the canvas at the new position.
	// Uses a cancelled flag so that stale async chains (from rapid slider
	// drags) never paint over the latest frame.
	useEffect(() => {
		if (!videoIsReady || !ctx || !vidRef.current) return
		if (gifUrl) return // Don't repaint if showing GIF
		let cancelled = false
		const repaintAtNewStartTime = async () => {
			try {
				const video = vidRef.current
				const canvas = canvasRef.current
				if (!video || !canvas) return
				// Seek to new start time
				await seekVideoToTime(video, startTime / 1000)
				if (cancelled) return
				// Wait for frame to be drawable
				await waitForVideoFrameReady(video, canvas)
				if (cancelled) return
				// Draw the frame directly (no redundant seek)
				const width = video.clientWidth
				const height = video.clientHeight
				if (width === 0 || height === 0) return
				ctx.clearRect(0, 0, width, height)
				ctx.drawImage(video, 0, 0, width, height)
				const imageData = ctx.getImageData(0, 0, width, height)
				const dataBuffer = new Uint8ClampedArray(imageData.data.buffer)
				if (!dataBuffer.some((val, idx) => idx % 4 !== 3 && val !== 0)) return
				if (cancelled) return
				drawFrame(ctx, dataBuffer, width, height)
			} catch (error) {
				if (!cancelled) {
					console.error("Error repainting at new startTime:", error)
				}
			}
		}
		repaintAtNewStartTime()
		return () => { cancelled = true }
	}, [startTime, videoIsReady, ctx, gifUrl])
	const canvasCallbackRef = useCallback((node: HTMLCanvasElement | null) => {
		if (node) {
			canvasRef.current = node
			setCtx(node.getContext("2d", { willReadFrequently: true }))
		}
	}, [])
	// Paint initial frame when both video and canvas are ready
	useEffect(() => {
		if (!videoIsReady || !ctx || !vidRef.current) {
			return
		}
		if (gifUrl) return // Don't paint if showing GIF result
		const paintInitialFrame = async () => {
			try {
				const video = vidRef.current
				const canvas = canvasRef.current
				if (!video || !ctx || !canvas) return
				// CRITICAL: Wait for canvas to actually have dimensions
				// The state might be set, but DOM might not be updated yet
				if (canvas.width === 0 || canvas.height === 0) {
					console.warn("Canvas has 0 dimensions, waiting for resize...")
					// Canvas isn't sized yet - the state update hasn't propagated to DOM
					// Wait for next frame and try again
					await waitForNextFrame()
					// Check again
					if (canvas.width === 0 || canvas.height === 0) {
						console.error("Canvas still has 0 dimensions after waiting")
						return
					}
				}
				// Ensure video is at the right position
				await seekVideoToTime(video, startTime / 1000)
				// Wait for VIDEO to have decoded the frame
				await waitForVideoFrameReady(video, canvasRef.current || undefined)
				if (video.clientWidth > 0 && video.clientHeight > 0) {
					await paintCanvasAtCurrentTime()
				} else {
					console.warn(
						"Video has invalid dimensions:",
						video.clientWidth,
						"x",
						video.clientHeight,
					)
				}
			} catch (error) {
				console.error("Initial paint error:", error)
			}
		}
		paintInitialFrame()
	}, [videoIsReady, ctx, gifUrl])
	// Handle returning from GIF result - event-driven, no hardcoded timeouts
	useEffect(() => {
		if (gifUrl) {
			// Reset videoIsReady when showing GIF
			setVideoIsReady(false)
			return
		}
		if (!vidUrl || !ctx || !vidRef.current) return
		if (!videoIsReady) return // Wait for video to be ready first
		const reinitializeVideo = async () => {
			try {
				if (!vidRef.current || !ctx) return
				const video = vidRef.current
				// Pause and wait for pause event
				await pauseVideo(video)
				// Stop any frame drawing
				if (showFrame) {
					showFrame.stop()
					setShowFrame(null)
				}
				// Seek to start and wait for seeked event
				await seekVideoToTime(video, startTime / 1000)
				// Wait for VIDEO to have decoded the frame
				await waitForVideoFrameReady(video, canvasRef.current || undefined)
				// Now paint
				if (video.clientWidth > 0 && video.clientHeight > 0) {
					await paintCanvasAtCurrentTime()
				}
			} catch (error) {
				console.error("Reinitialization error:", error)
				try {
					await paintCanvasAtCurrentTime()
				} catch (e) {
					console.error("Paint fallback failed:", e)
				}
			}
		}
		reinitializeVideo()
	}, [gifUrl, vidUrl, ctx, videoIsReady])
	const loadFfmpeg = async () => {
		try {
			if (ffmpeg.isLoaded()) {
				setIsLoaded(true)
				return
			}
			await ffmpeg.load()
			setIsLoaded(true)
		} catch (error) {
			console.error("Failed to load FFmpeg:", error)
			setFfmpegError(
				"Failed to load video processing engine. " +
				"Please ensure your browser supports SharedArrayBuffer and try again."
			)
		}
	}
	const videoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) {
			return
		}
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
		const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB
		if (e.target.files[0].size > MAX_FILE_SIZE) {
			setUploadError("Video is too big! Maximum size is 500 MB.")
			return
		}
		setUploadError(null)
		setUploadedFile(e.target.files[0])
	}
	// Event-driven: wait for actual events, not arbitrary timeouts
	const paintCanvasAtCurrentTime = async () => {
		// Use the stored context that has willReadFrequently set
		const canvas = canvasRef.current
		const video = vidRef.current
		if (!ctx || !video || !canvas) {
			console.warn("paintCanvasAtCurrentTime: missing ctx or video or canvas")
			return
		}
		try {
			const targetTime = startTime / 1000
			// Pause and wait
			await pauseVideo(video)
			// Seek if needed
			await seekVideoToTime(video, targetTime)
			// Wait for VIDEO to have decoded the frame
			await waitForVideoFrameReady(video, canvas)
			const width = video.clientWidth
			const height = video.clientHeight
			if (width === 0 || height === 0) {
				console.warn("Video has invalid dimensions")
				return
			}
			ctx.clearRect(0, 0, width, height)
			ctx.drawImage(video, 0, 0, width, height)
			const imageData = ctx.getImageData(0, 0, width, height)
			const dataBuffer = new Uint8ClampedArray(imageData.data.buffer)
			// Check if we actually drew something
			const hasNonZeroPixels = dataBuffer.some(
				(val, idx) => idx % 4 !== 3 && val !== 0,
			)
			if (!hasNonZeroPixels) {
				console.warn("Blank frame detected, skipping draw")
				return
			}
			drawFrame(ctx, dataBuffer, width, height)
		} catch (error) {
			console.error("Paint error:", error)
		}
	}
	function startDrawingFrames(
		ctx: CanvasRenderingContext2D | null,
		vidRef: React.RefObject<HTMLVideoElement>,
		callbackFn: (
			ctx: CanvasRenderingContext2D,
			data: Uint8ClampedArray,
			width: number,
			height: number,
		) => void,
		oneIteration: boolean = false,
	): { stop: () => void } {
		let stopped = false
		let callbackId: number | null = null
		let lastFrameTime = 0
		// Calculate frame interval in milliseconds based on user's framerate setting
		const frameInterval = 1000 / framerate
		const processFrame = (now?: number) => {
			if (stopped || !ctx || !vidRef.current) return
			// For throttling based on framerate, check time elapsed
			if (now !== undefined && !oneIteration) {
				const elapsed = now - lastFrameTime
				// Only draw if enough time has passed for the target framerate
				if (elapsed < frameInterval) {
					// Not enough time passed, schedule next check
					if (vidRef.current && "requestVideoFrameCallback" in vidRef.current) {
						callbackId = vidRef.current.requestVideoFrameCallback(
							processFrame,
						)
					}
					return
				}
				lastFrameTime = now
			}
			// Check if we've reached the end BEFORE drawing
			// This prevents drawing frames that are past the duration.
			// Cap to video duration so we never wait for a time the video can't reach.
			const currentTimeMs = vidRef.current.currentTime * 1000
			const videoDurationMs = (vidRef.current.duration || Infinity) * 1000
			const endTimeMs = Math.min(startTime + duration, videoDurationMs)
			if (currentTimeMs >= endTimeMs && !oneIteration) {
				// We've hit the end - stop drawing and trigger checkIfOver
				stopped = true
				checkIfOver()
				return
			}
			const width = vidRef.current.clientWidth
			const height = vidRef.current.clientHeight
			if (width === 0 || height === 0) return
			ctx.drawImage(vidRef.current, 0, 0, width, height)
			const dataBuffer = new Uint8ClampedArray(
				ctx.getImageData(0, 0, width, height).data.buffer,
			)
			// Apply filters FIRST
			callbackFn(ctx, dataBuffer, width, height)
			// THEN check if we should stop
			if (oneIteration && dataBuffer.some((color) => color !== 0)) {
				stopped = true
				return
			}
			if (
				!stopped &&
				!oneIteration &&
				vidRef.current &&
				"requestVideoFrameCallback" in vidRef.current
			) {
				callbackId = vidRef.current.requestVideoFrameCallback(
					processFrame,
				)
			}
		}
		if (oneIteration) {
			if (!vidRef.current || vidRef.current.clientWidth === 0) {
				requestAnimationFrame(() => {
					if (!stopped) processFrame()
				})
			} else {
				processFrame()
			}
			return {
				stop: () => {
					stopped = true
				},
			}
		}
		if (vidRef.current && "requestVideoFrameCallback" in vidRef.current) {
			// Initialize with current timestamp
			lastFrameTime = performance.now()
			callbackId = vidRef.current.requestVideoFrameCallback(
				processFrame,
			)
		} else {
			console.warn("requestVideoFrameCallback not supported, using fallback")
			// Fallback uses the framerate-based interval directly
			const interval = setInterval(() => {
				if (!vidRef.current) return
				processFrame()
			}, frameInterval)
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
					vidRef.current.cancelVideoFrameCallback(callbackId)
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
			vidRef.current.videoHeight,
		)
		await ffmpeg.run(
			"-i",
			name,
			"-r",
			`${framerate}`,
			"-s",
			`${widthHeight[0]}x${widthHeight[1]}`,
			"vid.mp4",
		)
	}
	function recordCanvasStream() {
		const recordedChunks: Blob[] = []
		return new Promise<{ url: string; blob: Blob } | null>((res, rej) => {
			if (!canvasRef.current) return rej(new Error("Canvas ref not available"))
			if (!vidRef.current) return rej(new Error("Video ref not available"))
			let stream = canvasRef.current.captureStream()
			// Detect supported codec - Firefox doesn't support VP9
			let mimeType = "video/webm; codecs=vp9"
			if (!MediaRecorder.isTypeSupported(mimeType)) {
				// Fallback for Firefox - try VP8
				mimeType = "video/webm; codecs=vp8"
				if (!MediaRecorder.isTypeSupported(mimeType)) {
					// Final fallback - let browser choose
					mimeType = "video/webm"
				}
			}
			mediaRecorder.current = new MediaRecorder(stream, {
				mimeType: mimeType,
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
				const url = URL.createObjectURL(blob)
				res({ url, blob })
			}
			let frameController = startDrawingFrames(ctx, vidRef, drawFrame)
			setShowFrame(frameController)
		})
	}
	const createVid = async () => {
		const result = await recordCanvasStream()
		if (!result) return
		const resolvedVid = await result.blob.arrayBuffer()
		await transcode(new Uint8Array(resolvedVid))
	}
	const makeGif = async () => {
		if (!vidRef.current) return
		if (!isLoaded) return
		setIsFocused([false, false, false])
		setDisablePlayPause(true)
		setShowSettings(null)
		isPlaybackActive.current = false
		// Step 1: Stop any existing animation SYNCHRONOUSLY
		if (showFrame) {
			showFrame.stop()
			setShowFrame(null)
		}
		// Step 2: Pause the video and wait for pause event
		try {
			await pauseVideo(vidRef.current)
		} catch (error) {
			console.error("Error pausing video before GIF creation:", error)
		}
		// Step 3: Seek to start position and wait for it to complete
		await seekVideoToTime(vidRef.current, startTime / 1000)
		// Step 4: Wait for video to decode the frame at start position
		if (canvasRef.current) {
			await waitForVideoFrameReady(vidRef.current, canvasRef.current)
		}
		// Step 5: Paint the start frame to canvas to ensure clean state
		await paintCanvasAtCurrentTime()
		// Step 6: Wait one more frame to ensure everything settled
		await waitForNextFrame()
		// Clear the old GIF URL to ensure fresh creation
		if (gifUrl) {
			URL.revokeObjectURL(gifUrl)
			setGifUrl("")
		}
		const escapeForFFmpeg = (text: string): string => {
			return text
				.replace(/\\/g, "\\\\")
				.replace(/'/g, "\\'")
				.replace(/:/g, "\\:")
				.replace(/%/g, "%%")
				.replace(/;/g, "\\;")
		}
		const content = escapeForFFmpeg(textOptions.content)
		// Now it's safe to start recording with clean state
		setGifStatus("Processing video...")
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
			"out.gif",
		)
		setGifStatus("Creating GIF...")
		const output = await readFFmpegFile(ffmpeg, "out.gif")
		const newGifUrl = URL.createObjectURL(
			new Blob([output.buffer], { type: "image/gif" }),
		)
		setGifUrl(newGifUrl)
		setGifStatus("GIF created successfully")
		mediaRecorder.current = null
		setDisablePlayPause(false)
	}
	// Event-driven: wait for actual video ready state
	const videoReady = async () => {
		if (!vidRef.current) return
		try {
			const video = vidRef.current
			// Ensure video has loaded enough data
			if (video.readyState < 2) {
				await waitForVideoData(video)
			}
			const dividend = await takeDown(video.videoWidth, video.videoHeight)
			setGifTargetWidth(dividend[0])
			setGifTargetHeight(dividend[1])
			setVideoLength(video.duration * 1000 - minimumDuration)
			setMaxDuration(
				video.duration * 1000 > 4000 ? 4000 : video.duration * 1000,
			)
			// Only reset duration if it's still at the default minimum
			// This preserves user's duration choice when returning from GIF result
			if (duration === minimumDuration) {
				setDuration(minimumDuration)
			}
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
			// Set canvas dimensions based on video clientWidth/Height
			const width = video.clientWidth
			const height = video.clientHeight
			setCanvasDimensions({ width, height })
			// Seek to start
			await seekVideoToTime(video, startTime / 1000)
			// Wait for VIDEO to have decoded the frame
			await waitForVideoFrameReady(video, canvasRef.current || undefined)
			// Mark video as ready - the useEffect will handle painting when ctx is ready
			setVideoIsReady(true)
		} catch (error) {
			console.error("videoReady error:", error)
			// Still mark as ready even on error so user can interact
			setVideoIsReady(true)
		}
	}
	const drawFrame = (
		ctx: CanvasRenderingContext2D,
		dataBuffer: Uint8ClampedArray,
		width: number,
		height: number,
	) => {
		const processed =
			callback?.(dataBuffer, { rgbaMod, rgbShift, levels }) ?? dataBuffer
		ctx.putImageData(
			new ImageData(new Uint8ClampedArray(processed), width, height),
			0,
			0,
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
		setShowFrame(frameController)
	}
	// Event-driven: wait for seek and frame decode
	const checkIfOver = async () => {
		if (!vidRef.current) return
		// Loop playback: if the video reached the end of the media file
		// during active user-initiated playback, seek back and continue.
		// The isPlaybackActive ref prevents this from triggering during
		// programmatic seeks (e.g. slider drag).
		if (
			vidRef.current.currentTime * 1000 >= videoLength &&
			vidRef.current.paused &&
			isPlaybackActive.current
		) {
			try {
				await seekVideoToTime(vidRef.current, startTime / 1000)
				await playVideo(vidRef.current)
			} catch (error) {
				console.error("checkIfOver play error:", error)
			}
			return
		}
		const clipEndMs = Math.min(
			startTime + duration,
			(vidRef.current.duration || Infinity) * 1000,
		)
		if (
			vidRef.current.currentTime * 1000 >= clipEndMs ||
			vidRef.current.currentTime * 1000 < startTime
		) {
			isPlaybackActive.current = false
			try {
				const video = vidRef.current
				await pauseVideo(video)
				await seekVideoToTime(video, startTime / 1000)
				// Wait for VIDEO to have decoded the frame
				await waitForVideoFrameReady(video, canvasRef.current || undefined)
				// Paint with filters
				if (ctx) {
					const width = video.clientWidth
					const height = video.clientHeight
					if (width > 0 && height > 0) {
						ctx.drawImage(video, 0, 0, width, height)
						const dataBuffer = new Uint8ClampedArray(
							ctx.getImageData(0, 0, width, height).data.buffer,
						)
						drawFrame(ctx, dataBuffer, width, height)
					}
				}
			} catch (error) {
				console.error("checkIfOver error:", error)
			}
		}
	}
	const handlePlayPause = async () => {
		if (!vidRef.current) return
		await checkIfOver()
		if (vidRef.current.paused) {
			isPlaybackActive.current = true
			vidRef.current.play()
		} else {
			isPlaybackActive.current = false
			vidRef.current.pause()
		}
	}
	const videoMenuOptions = [
		{
			buttonName: "Colour Filter",
			videoMenuVal: videoMenu.Colour,
			callbackFunction: customColour,
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
			callbackFunction: rgbSplit,
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
			callbackFunction: greenScreen,
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
							canvasRef={canvasRef}
							canvasCallbackRef={canvasCallbackRef}
							vidRef={vidRef}
							vidUrl={vidUrl}
							showFrame={showFrame}
							setShowFrame={setShowFrame}
							videoReady={videoReady}
							checkIfOver={checkIfOver}
							paintCanvas={paintCanvas}
							textOptions={textOptions}
							textPositions={textPositions}
							gifTargetWidth={gifTargetWidth}
							gifTargetHeight={gifTargetHeight}
							canvasDimensions={canvasDimensions}
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
								handleClick={() => {
									window.location.reload()
								}}
								buttonName="Back"
								disabled={disablePlayPause}
								tilt={false}
							/>
							<Button
								handleClick={makeGif}
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
										videoLength={videoLength}
										startTime={startTime}
										setStartTime={setStartTime}
										framerate={framerate}
										setFramerate={setFramerate}
										duration={duration}
										minimumDuration={minimumDuration}
										maxDuration={maxDuration}
										setDuration={setDuration}
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
