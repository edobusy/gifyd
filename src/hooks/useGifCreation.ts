import React, { useRef, useState } from "react"
import type { FFmpeg } from "@ffmpeg/ffmpeg"
import { VideoSettings } from "../interfaces/types"
import { takeDown } from "../functions/videoManipulation"
import {
	seekVideoToTime,
	waitForNextFrame,
	waitForVideoFrameReady,
	pauseVideo,
} from "../utils/videoHelpers"
import { readFFmpegFile } from "../utils/ffmpegHelpers"

type GifCreationDeps = {
	ffmpeg: FFmpeg
	isLoaded: boolean
	vidRef: React.RefObject<HTMLVideoElement>
	canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
	ctx: CanvasRenderingContext2D | null
	showFrame: { stop: () => void } | null
	setShowFrame: React.Dispatch<React.SetStateAction<{ stop: () => void } | null>>
	mediaRecorder: React.MutableRefObject<MediaRecorder | null>
	isPlaybackActive: React.MutableRefObject<boolean>
	startTime: number
	framerate: number
	duration: number
	textOptions: VideoSettings
	startDrawingFrames: (
		ctx: CanvasRenderingContext2D | null,
		vidRef: React.RefObject<HTMLVideoElement>,
		callbackFn: (ctx: CanvasRenderingContext2D, data: Uint8ClampedArray, width: number, height: number) => void,
		oneIteration?: boolean,
		onClipEnd?: () => void,
	) => { stop: () => void }
	drawFrame: (ctx: CanvasRenderingContext2D, data: Uint8ClampedArray, width: number, height: number) => void
	paintCanvasAtCurrentTime: () => Promise<void>
}

export function useGifCreation(deps: GifCreationDeps) {
	const {
		ffmpeg, isLoaded, vidRef, canvasRef, ctx,
		showFrame, setShowFrame, mediaRecorder, isPlaybackActive,
		startTime, framerate, duration, textOptions,
		startDrawingFrames, drawFrame, paintCanvasAtCurrentTime,
	} = deps

	const [gifUrl, setGifUrl] = useState("")
	const [gifStatus, setGifStatus] = useState("")
	const [disablePlayPause, setDisablePlayPause] = useState(false)
	const gifRef = useRef<HTMLImageElement>(null)

	const transcode = async (data: Uint8Array) => {
		if (!vidRef.current) return
		const name = "record.webm"
		ffmpeg.FS("writeFile", name, data)
		const widthHeight = takeDown(
			vidRef.current.videoWidth,
			vidRef.current.videoHeight,
		)
		await ffmpeg.run(
			"-i", name,
			"-r", `${framerate}`,
			"-s", `${widthHeight[0]}x${widthHeight[1]}`,
			"vid.mp4",
		)
	}

	function recordCanvasStream() {
		const recordedChunks: Blob[] = []
		return new Promise<{ url: string; blob: Blob } | null>((res, rej) => {
			if (!canvasRef.current) return rej(new Error("Canvas ref not available"))
			if (!vidRef.current) return rej(new Error("Video ref not available"))
			const stream = canvasRef.current.captureStream()
			let mimeType = "video/webm; codecs=vp9"
			if (!MediaRecorder.isTypeSupported(mimeType)) {
				mimeType = "video/webm; codecs=vp8"
				if (!MediaRecorder.isTypeSupported(mimeType)) {
					mimeType = "video/webm"
				}
			}
			mediaRecorder.current = new MediaRecorder(stream, { mimeType })
			mediaRecorder.current.start()
			vidRef.current.play()
			mediaRecorder.current.ondataavailable = function (e) {
				recordedChunks.push(e.data)
			}
			mediaRecorder.current.onstop = function () {
				const blob = new Blob(recordedChunks, { type: "video/webm" })
				const url = URL.createObjectURL(blob)
				res({ url, blob })
			}
			const frameController = startDrawingFrames(ctx, vidRef, drawFrame)
			setShowFrame(frameController)
		})
	}

	const createVid = async () => {
		const result = await recordCanvasStream()
		if (!result) return
		const resolvedVid = await result.blob.arrayBuffer()
		URL.revokeObjectURL(result.url)
		await transcode(new Uint8Array(resolvedVid))
	}

	const escapeForFFmpeg = (text: string): string => {
		return text
			.replace(/\\/g, "\\\\")
			.replace(/'/g, "\\'")
			.replace(/:/g, "\\:")
			.replace(/%/g, "%%")
			.replace(/;/g, "\\;")
	}

	const makeGif = async () => {
		if (!vidRef.current) return
		if (!isLoaded) return
		setDisablePlayPause(true)
		isPlaybackActive.current = false
		// Stop any existing animation
		if (showFrame) {
			showFrame.stop()
			setShowFrame(null)
		}
		// Pause the video and wait for pause event
		try {
			await pauseVideo(vidRef.current)
		} catch (error) {
			console.error("Error pausing video before GIF creation:", error)
		}
		// Seek to start position and wait for it to complete
		await seekVideoToTime(vidRef.current, startTime / 1000)
		// Wait for video to decode the frame at start position
		if (canvasRef.current) {
			await waitForVideoFrameReady(vidRef.current, canvasRef.current)
		}
		// Paint the start frame to canvas to ensure clean state
		await paintCanvasAtCurrentTime()
		// Wait one more frame to ensure everything settled
		await waitForNextFrame()
		// Clear the old GIF URL to ensure fresh creation
		if (gifUrl) {
			URL.revokeObjectURL(gifUrl)
			setGifUrl("")
		}
		const content = escapeForFFmpeg(textOptions.content)
		try {
			setGifStatus("Processing video...")
			await createVid()
			await ffmpeg.run(
				"-i", "vid.mp4",
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
				"-f", "gif", "out.gif",
			)
			setGifStatus("Creating GIF...")
			const output = await readFFmpegFile(ffmpeg, "out.gif")
			const newGifUrl = URL.createObjectURL(
				new Blob([output.buffer], { type: "image/gif" }),
			)
			setGifUrl(newGifUrl)
			setGifStatus("GIF created successfully")
		} catch (error) {
			console.error("GIF creation failed:", error)
			setGifStatus("GIF creation failed. Please try again.")
		} finally {
			mediaRecorder.current = null
			setDisablePlayPause(false)
		}
	}

	const reset = () => {
		if (gifUrl) URL.revokeObjectURL(gifUrl)
		setGifUrl("")
		setGifStatus("")
		setDisablePlayPause(false)
	}

	return {
		gifUrl, setGifUrl,
		gifStatus,
		disablePlayPause, setDisablePlayPause,
		gifRef,
		makeGif,
		reset,
	}
}
