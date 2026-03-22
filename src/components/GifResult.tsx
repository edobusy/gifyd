import React, { SetStateAction, useState } from "react"
import Button from "./generic/Button"

type Props = {
	gifRef: React.RefObject<HTMLImageElement>
	gifUrl: string
	disablePlayPause: boolean
	setGifUrl: React.Dispatch<SetStateAction<string>>
}

const GifResult = ({ gifRef, gifUrl, disablePlayPause, setGifUrl }: Props) => {

	const [fileName, setFileName] = useState("")

	return (
		<div className="modalBackground">
			<div className="modalContainer">
				<img ref={gifRef} src={gifUrl} className="finalGif" alt="Generated GIF preview" />
				<div className="dualColGif">
					<div className="container shiftLeft">
						<label htmlFor="fileName" className="simpleLabel tilt">
							Name:
						</label>
					</div>
					<div className="container">
						<input
							type="text"
							id="fileName"
							name="fileName"
							placeholder="Write name here"
							maxLength={45}
							value={fileName}
							onChange={(e) => {
								setFileName(e.target.value)
							}}
						/>
					</div>
				</div>
				<div className="dualColGif">
					<div className="gifButton">
						<Button
							buttonName="Back"
							disabled={disablePlayPause}
							tilt={false}
							handleClick={() => {
								setGifUrl("")
							}}
						/>
					</div>
					<div className="gifButton">
						<a
							href={gifUrl}
							download={fileName.length > 0 ? fileName : "newGif"}
						>
							<Button
								buttonName="Download"
								disabled={disablePlayPause}
								tilt={false}
							/>
						</a>
					</div>
				</div>
			</div>
		</div>
	)
}

export default GifResult
