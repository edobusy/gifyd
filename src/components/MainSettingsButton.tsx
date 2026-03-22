import React from "react"
import { settings } from "../interfaces/enums"
import Button from "./generic/Button"

type Props = {
	showSettings: settings | null
	disablePlayPause: boolean
	setting: settings
	buttonName: string
	setShowSettings: React.Dispatch<React.SetStateAction<settings | null>>
	isFocused: boolean[]
	setIsFocused: React.Dispatch<React.SetStateAction<boolean[]>>
}

// This buttons opens up the settings options related to the button
// Example: Edit, Filter, Caption
const MainSettingsButton = ({
	showSettings,
	disablePlayPause,
	setting,
	buttonName,
	setShowSettings,
	isFocused,
	setIsFocused,
}: Props) => {
	const handleClick = () => {
		if (showSettings === setting) {
			setIsFocused((arr) => {
				const next = [...arr]
				next[setting] = false
				return next
			})
			setShowSettings(null)
		} else {
			setIsFocused((arr) => {
				return arr.map((_, idx) => idx === setting)
			})
			setShowSettings(setting)
		}
	}

	return (
		<div className="mainSettingsButton">
			<Button
				handleClick={handleClick}
				disabled={disablePlayPause}
				value={`${setting}`}
				buttonName={buttonName}
				tilt={true}
				isFocused={isFocused[setting]}
			/>
		</div>
	)
}

export default MainSettingsButton
