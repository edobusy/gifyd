import React, { SetStateAction } from "react"
import { VideoSettings } from "../interfaces/types"
import TextColour from "./Caption/TextColour"
import TextFont from "./Caption/TextFont"
import TextPosition from "./Caption/TextPosition"
import TextSize from "./Caption/TextSize"

type Props = {
	textPositions: {
		positionName: string
		positionEquation: string
	}[]
	textSizes: {
		size: string
		divisor: number
	}[]
	textFonts: {
		fontName: string
		fontId: string
	}[]
	targetContentColourInputs: {
		targetContent: 'text' | 'box'
		transparency: boolean
	}[]
	textOptions: VideoSettings
	setTextOptions: React.Dispatch<SetStateAction<VideoSettings>>
	vidRef: React.RefObject<HTMLVideoElement>
	fontSizeRef: React.MutableRefObject<string | null>
}

// textPositions should be top bottom AND (h-text_h)/20 for top and (h-text_h)-(h-text_h)/20 for bottom
// textSize should be small, medium, large AND 20, 15, 10
// textFonts should be Times New Roman, Impact, Comic Sans AND times, impact, cursive
// targetContentColourInputs should be text, box, false, true
const CaptionOptions = React.memo(function CaptionOptions(props: Props) {
	const {
		textPositions,
		textSizes,
		textFonts,
		targetContentColourInputs,
		textOptions,
		setTextOptions,
		vidRef,
		fontSizeRef,
	} = props

	return (
		<div className="extraSettings">
			<div className="captionSettings">
				<div className="captionOptionsContainer">
					<div className="captionOption">
						<div className="dualColCaption">
							<div className="container">
								<label htmlFor="content" className="simpleLabel tilt">
									Content:
								</label>
							</div>
							<div className="container">
								<input
									type="text"
									id="content"
									name="content"
									placeholder="Write caption here"
									maxLength={45}
									value={textOptions.content}
									onChange={(e) => {
										setTextOptions({
											...textOptions,
											content: e.target.value,
										})
									}}
								/>
							</div>
						</div>
						<div className="dualColCaption">
							<div className="container">
								<p className="simpleLabel tilt">Position:</p>
							</div>
							<div className="containerRadio">
								{textPositions.map(({ positionName, positionEquation }) => (
									<TextPosition
										key={"textPosButton" + positionName}
										positionName={positionName}
										positionEquation={positionEquation}
										textOptions={textOptions}
										setTextOptions={setTextOptions}
									/>
								))}
							</div>
						</div>
						<div className="dualColCaption">
							<div className="container">
								<p className="simpleLabel tilt">Size:</p>
							</div>
							<div className="containerRadio">
								{textSizes.map(({ size, divisor }) => (
									<TextSize
										key={"sizeInput" + size}
										size={size}
										divisor={divisor}
										textOptions={textOptions}
										setTextOptions={setTextOptions}
										vidRef={vidRef}
										fontSizeRef={fontSizeRef}
									/>
								))}
							</div>
						</div>
						<div className="dualColCaption">
							<div className="container">
								<p className="simpleLabel tilt">Font:</p>
							</div>
							<div className="containerRadio">
								{textFonts.map(({ fontName, fontId }) => (
									<TextFont
										key={"fontChoice" + fontId}
										fontName={fontName}
										fontId={fontId}
										textOptions={textOptions}
										setTextOptions={setTextOptions}
									/>
								))}
							</div>
						</div>
						{targetContentColourInputs.map(
							({ targetContent, transparency }) => (
								<TextColour
									key={"textColour" + targetContent}
									targetContent={targetContent}
									transparency={transparency}
									textOptions={textOptions}
									setTextOptions={setTextOptions}
								/>
							),
						)}
					</div>
				</div>
			</div>
		</div>
	)
})

export default CaptionOptions
