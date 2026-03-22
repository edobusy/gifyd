import React from "react"

type Props = {
	handleClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
	buttonName: string
	tilt: boolean
	disabled: boolean
	value?: string
	isFocused?: boolean
}

const Button = ({ handleClick, buttonName, tilt, disabled, value, isFocused }: Props) => {

	return (
		<button
			className={`buttonContainer ${tilt ? "tilt" : ""} ${
				isFocused ? "focusedButton" : ""
			}`}
			onClick={handleClick}
			disabled={disabled}
			value={value}
		>
			<p className="buttonText">{buttonName}</p>
		</button>
	)
}

export default Button
