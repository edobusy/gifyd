import React, { useEffect, useMemo, useState } from "react"
import { hexToRgb } from "../../functions/videoManipulation"
import { VideoSettings } from "../../interfaces/types"

type TextPosition = {
	positionName: string
	positionEquation: string
}

type Props = {
	textOptions: VideoSettings
	vidRef: React.RefObject<HTMLVideoElement>
	canvasRef?: React.RefObject<HTMLCanvasElement>
	textPositions: TextPosition[]
	targetWidth?: number | null
	targetHeight?: number | null
}

// Clamp a value between min (a) and max (b)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// Safely evaluates expressions (e.g. "w / 2 - text_w / 2")
// Variables are substituted from the provided env object
function evalExpr(expr: string, env: { [k: string]: number }): number {
	if (!expr) return NaN
	try {
		let replaced = expr
		Object.keys(env).forEach((k) => {
			replaced = replaced.replace(new RegExp(`\\b${k}\\b`, "g"), `(${env[k]})`)
		})
		// eslint-disable-next-line no-new-func
		const f = new Function(`return (${replaced});`)
		const res = f()
		return typeof res === "number" && Number.isFinite(res) ? res : NaN
	} catch {
		return NaN
	}
}

// Measures text using an offscreen canvas to get accurate width/height
function measureText(text: string, fontSizePx: number, fontFamily: string) {
	const canvas = document.createElement("canvas")
	const ctx = canvas.getContext("2d")
	if (!ctx) return { width: 0, height: 0 }

	ctx.font = `${fontSizePx}px ${fontFamily}`
	const metrics = ctx.measureText(text)

	const width = metrics.width || 0
	const ascent = (metrics as any).actualBoundingBoxAscent ?? fontSizePx * 0.8
	const descent = (metrics as any).actualBoundingBoxDescent ?? fontSizePx * 0.2
	const height = ascent + descent

	return { width, height, ascent, descent }
}

const CaptionPreview = ({
	textOptions,
	vidRef,
	canvasRef,
	textPositions,
	targetWidth,
	targetHeight,
}: Props) => {
	// Normalised caption content
	const content = String(textOptions.content ?? "").trim()

	// Used to force re-measure when fonts load or canvas resizes
	const [tick, setTick] = useState(0)

	// Wait for fonts to load before measuring text
	useEffect(() => {
		let cancelled = false

		const waitFonts = async () => {
			try {
				if (
					(document as any).fonts &&
					typeof (document as any).fonts.ready?.then === "function"
				) {
					await (document as any).fonts.ready
				}
			} finally {
				if (!cancelled) setTick((t) => t + 1)
			}
		}

		waitFonts()
		return () => {
			cancelled = true
		}
	}, [textOptions.font, content])

	// Observe canvas size changes to keep overlay aligned
	useEffect(() => {
		const el = canvasRef?.current
		if (!el || typeof ResizeObserver === "undefined") return

		const ro = new ResizeObserver(() => setTick((t) => t + 1))
		ro.observe(el)
		return () => ro.disconnect()
	}, [canvasRef?.current])

	const rgbBox = hexToRgb(textOptions.boxColour)
	const rgbText = hexToRgb(textOptions.textColour)

	// Resolve actual target dimensions (GIF export > video metadata > DOM size)
	const inferredTargetWidth =
		targetWidth ??
		vidRef.current?.videoWidth ??
		vidRef.current?.clientWidth ??
		0

	const inferredTargetHeight =
		targetHeight ??
		vidRef.current?.videoHeight ??
		vidRef.current?.clientHeight ??
		0

	// Actual displayed canvas size (CSS pixels)
	const canvasEl = canvasRef?.current
	const canvasRect = canvasEl?.getBoundingClientRect()

	const displayedWidth =
		canvasRect?.width ?? canvasEl?.clientWidth ?? inferredTargetWidth ?? 0
	const displayedHeight =
		canvasRect?.height ?? canvasEl?.clientHeight ?? inferredTargetHeight ?? 0

	// Scale factors between video pixels and displayed pixels
	const scaleX =
		inferredTargetWidth > 0 ? displayedWidth / inferredTargetWidth : 1
	const scaleY =
		inferredTargetHeight > 0 ? displayedHeight / inferredTargetHeight : 1

	const fontSizeExpr = String(textOptions.fontSize ?? "")
	const xExpr = String(textOptions.x ?? "")
	const yExpr = String(textOptions.y ?? "")
	const fontFamily = String(textOptions.font ?? "sans-serif")
	const boxBorderWidth = Number(textOptions.boxBorderWidth ?? 0)
	const boxTransparency = Number(textOptions.boxTransparency ?? 1)

	// Measure text in *target pixel space*
	// This hook must always run (even when content is empty)
	const { fontSizePx, textW, textH } = useMemo(() => {
		let fontSize =
			Number(fontSizeExpr) || Math.max(20, inferredTargetWidth / 10 || 20)

		let measured = measureText(content, fontSize, fontFamily)
		let last = fontSize

		// Iteratively solve expression-based font sizing
		for (let i = 0; i < 8; i++) {
			const env = {
				w: inferredTargetWidth || 0,
				h: inferredTargetHeight || 0,
				text_w: measured.width,
				text_h: measured.height,
			}

			const candidate = evalExpr(fontSizeExpr, env)
			if (!Number.isFinite(candidate) || candidate <= 0) break

			fontSize = candidate
			measured = measureText(content, fontSize, fontFamily)

			if (Math.abs(fontSize - last) < 0.5) break
			last = fontSize
		}

		return {
			fontSizePx: fontSize,
			textW: measured.width,
			textH: measured.height,
		}
	}, [
		fontSizeExpr,
		content,
		fontFamily,
		inferredTargetWidth,
		inferredTargetHeight,
		tick,
	])

	// Early exit AFTER all hooks (React rules)
	if (!content) return null

	// Environment for evaluating X/Y expressions
	const envForXY = {
		w: inferredTargetWidth || 0,
		h: inferredTargetHeight || 0,
		text_w: textW,
		text_h: textH,
	}

	const xPx = evalExpr(xExpr, envForXY)
	const yPx = evalExpr(yExpr, envForXY)

	// Default to centered positioning
	let finalLeftPx = Number.isFinite(xPx)
		? xPx
		: (inferredTargetWidth - textW) / 2

	let finalTopPx = Number.isFinite(yPx)
		? yPx
		: (inferredTargetHeight - textH) / 2

	// Named positions fallback (top / center / bottom)
	if (!Number.isFinite(yPx)) {
		const matched = textPositions.find(
			(p) => p.positionEquation === yExpr || p.positionName === yExpr
		)

		const posName = (matched && matched.positionName) || "center"

		if (posName.toLowerCase() === "top")
			finalTopPx = (inferredTargetHeight - textH) / 20
		else if (posName.toLowerCase() === "bottom")
			finalTopPx =
				inferredTargetHeight - textH - (inferredTargetHeight - textH) / 20
		else finalTopPx = (inferredTargetHeight - textH) / 2
	}

	if (!Number.isFinite(xPx)) finalLeftPx = (inferredTargetWidth - textW) / 2

	// Convert to displayed (CSS) pixels
	const displayTextW = textW * scaleX
	const displayTextH = textH * scaleY
	const displayBorderX = boxBorderWidth * scaleX
	const displayBorderY = boxBorderWidth * scaleY

	let boxWidth = displayTextW + 2 * displayBorderX
	let boxHeight = displayTextH + 2 * displayBorderY

	const displayLeftInCanvas = finalLeftPx * scaleX
	const displayTopInCanvas = finalTopPx * scaleY

	let boxLeftInCanvas = displayLeftInCanvas - displayBorderX
	let boxTopInCanvas = displayTopInCanvas - displayBorderY

	// Prevent the caption box from escaping the visible canvas
	if (boxWidth > displayedWidth) {
		boxWidth = displayedWidth
		boxLeftInCanvas = 0
	} else {
		boxLeftInCanvas = clamp(
			boxLeftInCanvas,
			0,
			Math.max(0, displayedWidth - boxWidth)
		)
	}

	if (boxHeight > displayedHeight) {
		boxHeight = displayedHeight
		boxTopInCanvas = 0
	} else {
		boxTopInCanvas = clamp(
			boxTopInCanvas,
			0,
			Math.max(0, displayedHeight - boxHeight)
		)
	}

	const displayFontSize = fontSizePx * Math.min(scaleX, scaleY)

	const bg = rgbBox
		? `rgba(${rgbBox.r}, ${rgbBox.g}, ${rgbBox.b}, ${
				Number.isFinite(boxTransparency) ? boxTransparency : 1
		  })`
		: textOptions.boxColour

	const color = rgbText
		? `rgb(${rgbText.r}, ${rgbText.g}, ${rgbText.b})`
		: textOptions.textColour

	return (
		<div
			style={{
				position: "absolute",
				width: displayedWidth,
				height: displayedHeight,
				pointerEvents: "none",
				overflow: "hidden",
				transform: "none",
			}}
		>
			<div
				style={{
					position: "absolute",
					left: boxLeftInCanvas,
					top: boxTopInCanvas,
					width: boxWidth,
					height: boxHeight,
					backgroundColor: bg,
					boxSizing: "border-box",
					pointerEvents: "none",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: `${Math.max(0, displayBorderY)}px ${Math.max(
						0,
						displayBorderX
					)}px`,
				}}
			>
				<p
					style={{
						margin: 0,
						padding: 0,
						fontSize: `${displayFontSize}px`,
						color,
						lineHeight: 1,
						fontFamily,
						whiteSpace: "nowrap",
						pointerEvents: "none",
					}}
				>
					{content}
				</p>
			</div>
		</div>
	)
}

export default CaptionPreview
