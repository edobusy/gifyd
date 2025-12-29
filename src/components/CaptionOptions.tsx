import React, { SetStateAction } from "react"
import { hexToRgb } from "../functions/videoManipulation"
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
		targetContent: string
		transparency: boolean
	}[]
	textOptions: VideoSettings
	setTextOptions: React.Dispatch<SetStateAction<VideoSettings>>
	vidRef: React.RefObject<HTMLVideoElement>
}

// textPositions should be top bottom AND (h-text_h)/20 for top and (h-text_h)-(h-text_h)/20 for bottom
// textSize should be small, medium, large AND 20, 15, 10
// textFonts should be Times New Roman, Impact, Comic Sans AND times, impact, cursive
// targetContentColourInputs should be text, box, false, true
const CaptionOptions = (props: { captionOptions: Props }) => {
	const {
		textPositions,
		textSizes,
		textFonts,
		targetContentColourInputs,
		textOptions,
		setTextOptions,
		vidRef,
	} = props.captionOptions

	return (
		<div className="extraSettings">
			<div className="dualColCaptionPreview">
				<div className="container">
					<label htmlFor="content" className="simpleLabel tilt">
						Preview:
					</label>
				</div>
				<div className="captionPreview">
					<p
						style={{
							fontSize: textOptions.fontSize + "px",
							backgroundColor: `rgba(${hexToRgb(textOptions.boxColour)?.r},${
								hexToRgb(textOptions.boxColour)?.g
							},${hexToRgb(textOptions.boxColour)?.b},${
								textOptions.boxTransparency
							})`,
							color: `rgb(${hexToRgb(textOptions.textColour)?.r},${
								hexToRgb(textOptions.textColour)?.g
							},${hexToRgb(textOptions.textColour)?.b})`,
							display: "inline-block",
							lineHeight: "100%",
							fontFamily: textOptions.font,
							whiteSpace: "nowrap",
							overflow: "hidden",
						}}
					>
						{textOptions.content}
					</p>
				</div>
			</div>
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
										buttonProps={{
											positionName,
											positionEquation,
											textOptions,
											setTextOptions,
										}}
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
										inputProps={{
											size,
											divisor,
											textOptions,
											setTextOptions,
											vidRef,
										}}
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
										fontProps={{
											fontName,
											fontId,
											textOptions,
											setTextOptions,
										}}
									/>
								))}
							</div>
						</div>
						{targetContentColourInputs.map(
							({ targetContent, transparency }) => (
								<TextColour
									key={"textColour" + targetContent}
									colourProps={{
										targetContent,
										transparency,
										textOptions,
										setTextOptions,
									}}
								/>
							)
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default CaptionOptions
