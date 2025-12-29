import React from "react"
import { settings } from "../interfaces/enums"
import { FilterLevels } from "../interfaces/types"

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
}

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
	} = props.videoElements

	return (
		<div>
			<div className="hiddenVideoContainer">
				<video
					ref={vidRef}
					muted
					width="auto"
					height="500px"
					onLoadedData={videoReady}
					onTimeUpdate={() => {
						checkIfOver()

						paintCanvas(true)
					}}
					onPlay={() => {
						paintCanvas()
					}}
					onPause={() => {
						if (showFrame) {
							clearInterval(showFrame)
							setShowFrame(null)
						}
					}}
				>
					<source src={vidUrl} />
				</video>
			</div>
			{!canvasRef.current && <p>Loading...</p>}
			<div className="vidContainer">
				<canvas
					title="canvas"
					ref={canvasRef}
					width={vidRef.current?.clientWidth || 0}
					height={vidRef.current?.clientHeight || 0}
					className={"canvasVid"}
				/>
			</div>
		</div>
	)
}

export default UploadedVideo
