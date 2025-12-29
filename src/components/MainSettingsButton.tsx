import React, { useState } from "react"
import Button from "./generic/Button"

type Props = {
	showSettings: string
	disablePlayPause: boolean
	setting: number
	buttonName: string
	setShowSettings: (value: React.SetStateAction<string>) => void
	isFocused: boolean[]
	setIsFocused: React.Dispatch<React.SetStateAction<boolean[]>>
}

// This buttons opens up the settings options related to the button
// Example: Edit, Filter, Caption
const MainSettingsButton = (props: { buttonProps: Props }) => {
	const {
		showSettings,
		disablePlayPause,
		setting,
		buttonName,
		setShowSettings,
		isFocused,
		setIsFocused,
	} = props.buttonProps

	const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (showSettings && showSettings.includes(e.currentTarget.value)) {
			const newSetting = showSettings.replace(e.currentTarget.value, "")
			setIsFocused((arr) => {
				arr[setting] = false
				return arr
			})
			setShowSettings(newSetting)
		} else {
			setIsFocused((arr) => {
				return arr.map((item, idx, arr) => {
					if (idx == setting) {
						return true
					} else {
						return false
					}
				})
			})
			setShowSettings(e.currentTarget.value)
		}
	}

	return (
		<div className="mainSettingsButton">
			<Button
				buttonProps={{
					handleClick,
					disabled: disablePlayPause,
					value: `${setting}`,
					buttonName,
					tilt: true,
					isFocused: isFocused[setting],
				}}
			/>
		</div>
	)
}

export default MainSettingsButton
