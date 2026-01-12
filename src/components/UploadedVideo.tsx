import React from "react"
import { settings } from "../interfaces/enums"
import { FilterLevels, VideoSettings } from "../interfaces/types"
import CaptionPreview from "./Caption/CaptionPreview"

type TextPosition = {
	positionName: string
	positionEquation: string
}

type Props = {
	canvasRef: React.RefObject<HTMLCanvasElement>
	disablePlayPause: boolean
	vidRef: React.RefObject<HTMLVideoElement>
	vidUrl: string
	showSettings: string
	showFrame: number | null
	levels: FilterLevels
	setShowFrame: React.Dispatch<React.SetStateAction<number | null>>
	videoReady: () => void
	checkIfOver: () => void
	paintCanvas: (oneIteration?: boolean) => void
	handlePlayPause: () => void
	textOptions: VideoSettings
	textPositions: TextPosition[]
	gifTargetWidth?: number | null
	gifTargetHeight?: number | null
}

// Wrapper component responsible for:
// - Hosting the hidden <video> element (source of truth for frames)
// - Rendering the visible <canvas>
// - Overlaying CaptionPreview on top of the canvas
const UploadedVideo = (props: { videoElements: Props }) => {
	const {
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
					width="auto"
					height="500px"
					onLoadedData={videoReady}
					onTimeUpdate={() => {
						// Keep canvas in sync with playback
						checkIfOver()
						paintCanvas(true)
					}}
					onPlay={() => {
						paintCanvas()
					}}
					onPause={() => {
						// Stop frame polling when paused
						if (showFrame) {
							clearInterval(showFrame)
							setShowFrame(null)
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
					title="canvas"
					ref={canvasRef}
					width={vidRef.current?.clientWidth || 0}
					height={vidRef.current?.clientHeight || 0}
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
