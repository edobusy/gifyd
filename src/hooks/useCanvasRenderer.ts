import React, { useCallback, useLayoutEffect, useRef, useState } from "react"
import { Callback, Colour, FilterLevels, FilterOptions } from "../interfaces/types"
import {
	seekVideoToTime,
	waitForVideoFrameReady,
	pauseVideo,
	playVideo,
} from "../utils/videoHelpers"

type FrameController = { stop: () => void }

type CanvasRendererDeps = {
	vidRef: React.RefObject<HTMLVideoElement>
	startTime: number
	framerate: number
	duration: number
	callback: Callback
	rgbaMod: Colour
	rgbShift: Colour
	levels: FilterLevels
	colorChanged: React.MutableRefObject<boolean>
}

export function useCanvasRenderer(deps: CanvasRendererDeps) {
	const {
		vidRef, startTime, framerate, duration,
		callback, rgbaMod, rgbShift, levels, colorChanged,
	} = deps

	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
	const [showFrame, setShowFrame] = useState<FrameController | null>(null)
	const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 })
	const mediaRecorder = useRef<MediaRecorder | null>(null)
	const isPlaybackActive = useRef(false)

	const drawFrame = (
		ctx: CanvasRenderingContext2D,
		dataBuffer: Uint8ClampedArray,
		width: number,
		height: number,
	) => {
		const processed =
			callback?.(dataBuffer, { rgbaMod, rgbShift, levels } as FilterOptions) ?? dataBuffer
		ctx.putImageData(
			new ImageData(new Uint8ClampedArray(processed), width, height),
			0,
			0,
		)
	}

	const checkIfOver = async () => {
		if (!vidRef.current) return
		// Loop playback: if the video reached the end of the media file
		// during active user-initiated playback, seek back and continue.
		if (
			vidRef.current.currentTime >= vidRef.current.duration &&
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
				await waitForVideoFrameReady(video, canvasRef.current || undefined)
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
		onClipEnd?: () => void,
	): FrameController {
		let stopped = false
		let callbackId: number | null = null
		let lastFrameTime = 0
		const frameInterval = 1000 / framerate

		const processFrame = (now?: number) => {
			if (stopped || !ctx || !vidRef.current) return
			if (now !== undefined && !oneIteration) {
				const elapsed = now - lastFrameTime
				if (elapsed < frameInterval) {
					if (vidRef.current && "requestVideoFrameCallback" in vidRef.current) {
						callbackId = vidRef.current.requestVideoFrameCallback(processFrame)
					}
					return
				}
				lastFrameTime = now
			}
			const currentTimeMs = vidRef.current.currentTime * 1000
			const videoDurationMs = (vidRef.current.duration || Infinity) * 1000
			const endTimeMs = Math.min(startTime + duration, videoDurationMs)
			if (currentTimeMs >= endTimeMs && !oneIteration) {
				stopped = true
				onClipEnd?.()
				return
			}
			const width = vidRef.current.clientWidth
			const height = vidRef.current.clientHeight
			if (width === 0 || height === 0) return
			ctx.drawImage(vidRef.current, 0, 0, width, height)
			const dataBuffer = new Uint8ClampedArray(
				ctx.getImageData(0, 0, width, height).data.buffer,
			)
			callbackFn(ctx, dataBuffer, width, height)
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
				callbackId = vidRef.current.requestVideoFrameCallback(processFrame)
			}
		}

		if (oneIteration) {
			if (!vidRef.current || vidRef.current.clientWidth === 0) {
				requestAnimationFrame(() => { if (!stopped) processFrame() })
			} else {
				processFrame()
			}
			return { stop: () => { stopped = true } }
		}

		if (vidRef.current && "requestVideoFrameCallback" in vidRef.current) {
			lastFrameTime = performance.now()
			callbackId = vidRef.current.requestVideoFrameCallback(processFrame)
		} else {
			console.warn("requestVideoFrameCallback not supported, using fallback")
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

	const paintCanvas = (oneIteration?: boolean) => {
		if (!vidRef.current) return
		if (!ctx) return
		if (showFrame) return
		if (oneIteration) {
			startDrawingFrames(ctx, vidRef, drawFrame, true)
			return
		}
		const frameController = startDrawingFrames(ctx, vidRef, drawFrame, false, checkIfOver)
		setShowFrame(frameController)
	}

	const paintCanvasAtCurrentTime = async () => {
		const canvas = canvasRef.current
		const video = vidRef.current
		if (!ctx || !video || !canvas) {
			console.warn("paintCanvasAtCurrentTime: missing ctx or video or canvas")
			return
		}
		try {
			const targetTime = startTime / 1000
			await pauseVideo(video)
			await seekVideoToTime(video, targetTime)
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

	const canvasCallbackRef = useCallback((node: HTMLCanvasElement | null) => {
		if (node) {
			canvasRef.current = node
			setCtx(node.getContext("2d", { willReadFrequently: true }))
		}
	}, [])

	// Whenever filter settings change, update the canvas painting
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
		rgbaMod.red, rgbaMod.green, rgbaMod.blue,
		rgbShift.red, rgbShift.green, rgbShift.blue,
		levels.rmin, levels.rmax, levels.gmin, levels.gmax, levels.bmin, levels.bmax, levels.background,
	])

	// After showFrame is set to null due to color change, repaint
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

	const reset = () => {
		if (showFrame) {
			showFrame.stop()
			setShowFrame(null)
		}
		setCtx(null)
		setCanvasDimensions({ width: 0, height: 0 })
		canvasRef.current = null
		mediaRecorder.current = null
		isPlaybackActive.current = false
	}

	return {
		canvasRef,
		ctx,
		showFrame,
		setShowFrame,
		canvasDimensions,
		setCanvasDimensions,
		mediaRecorder,
		isPlaybackActive,
		drawFrame,
		startDrawingFrames,
		paintCanvas,
		paintCanvasAtCurrentTime,
		checkIfOver,
		canvasCallbackRef,
		reset,
	}
}
