import React from "react"
import { VideoSettings } from "../interfaces/types"
import CaptionPreview from "./Caption/CaptionPreview"
import { waitForNextFrame } from "../utils/videoHelpers"

type TextPosition = {
	positionName: string
	positionEquation: string
}

type Props = {
	canvasRef: React.RefObject<HTMLCanvasElement>
	canvasCallbackRef?: (node: HTMLCanvasElement | null) => void
	vidRef: React.RefObject<HTMLVideoElement>
	vidUrl: string
	showFrame: {
		stop: () => void
	} | null
	setShowFrame: React.Dispatch<
		React.SetStateAction<{
			stop: () => void
		} | null>
	>
	videoReady: () => void
	checkIfOver: () => void
	paintCanvas: (oneIteration?: boolean) => void
	textOptions: VideoSettings
	textPositions: TextPosition[]
	gifTargetWidth?: number | null
	gifTargetHeight?: number | null
	canvasDimensions: { width: number; height: number }
}

// Wrapper component responsible for:
// - Hosting the hidden <video> element (source of truth for frames)
// - Rendering the visible <canvas>
// - Overlaying CaptionPreview on top of the canvas
const UploadedVideo = (props: { videoElements: Props }) => {
	const {
		canvasRef,
		canvasCallbackRef,
		vidRef,
		vidUrl,
		showFrame,
		setShowFrame,
		videoReady,
		checkIfOver,
		paintCanvas,
		textOptions,
		textPositions,
		gifTargetWidth,
		gifTargetHeight,
		canvasDimensions,
	} = props.videoElements

	return (
		<div>
			{/* 
				Hidden video element:
				- Used only as a frame source for canvas rendering
				- Never shown directly to the user
			*/}
			<div className="hiddenVideoContainer">
				<video
					ref={vidRef}
					muted
					aria-hidden="true"
					width="auto"
					height="500px"
					onLoadedData={videoReady}
					onTimeUpdate={() => {
						// Keep canvas in sync with playback
						checkIfOver()
					}}
					onPlay={() => {
						paintCanvas()
					}}
					onPause={async () => {
						// Stop the continuous drawing loop
						if (showFrame) {
							showFrame.stop()
							setShowFrame(null)
						}

						// Event-driven: wait for frame decode, then paint with filters
						try {
							await waitForNextFrame()
							paintCanvas(true)
						} catch (error) {
							console.error("onPause paint error:", error)
						}
					}}
				>
					<source src={vidUrl} />
				</video>
			</div>

			{/* Canvas ref may not exist on first render */}
			{!canvasRef.current && <p>Loading...</p>}

			<div className="vidContainer">
				{/* 
					Canvas dimensions are tied to the video element.
					This ensures coordinate parity between:
					- actual video pixels
					- caption layout math
				*/}
				<canvas
					title="Video frame preview with applied filters"
					aria-label="Video frame preview"
					ref={canvasCallbackRef ?? canvasRef}
					width={canvasDimensions.width || vidRef.current?.clientWidth || 0}
					height={canvasDimensions.height || vidRef.current?.clientHeight || 0}
					className={"canvasVid"}
				/>

				{/* 
					CaptionPreview is a pure visual overlay:
					- pointerEvents disabled
					- positioned absolutely over the canvas
				*/}
				<CaptionPreview
					textOptions={textOptions}
					vidRef={vidRef}
					canvasRef={canvasRef}
					textPositions={textPositions}
					targetWidth={gifTargetWidth ?? undefined}
					targetHeight={gifTargetHeight ?? undefined}
				/>
			</div>
		</div>
	)
}

export default UploadedVideo
