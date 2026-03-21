import React from "react"
import { videoMenu } from "../../interfaces/enums"
import { Callback } from "../../interfaces/types"
import Button from "../generic/Button"

type Props = {
	buttonName: string
	videoMenuVal: videoMenu
	callbackFunction: Callback
	setCallback: (value: React.SetStateAction<Callback>) => void
	setColourSettings: React.Dispatch<React.SetStateAction<videoMenu | null>>
	isFilterFocused: boolean[]
	setIsFilterFocused: React.Dispatch<React.SetStateAction<boolean[]>>
}

const FilterButton = (props: { filterButtonProps: Props }) => {
	const {
		buttonName,
		videoMenuVal,
		callbackFunction,
		setCallback,
		setColourSettings,
		isFilterFocused,
		setIsFilterFocused,
	} = props.filterButtonProps

	const handleClick = () => {
		setColourSettings((setting) => {
			if (setting === videoMenuVal) {
				setIsFilterFocused((arr) => {
					const next = [...arr]
					next[videoMenuVal] = false
					return next
				})
				return null
			}
			setIsFilterFocused((arr) => {
				return arr.map((_, idx) => idx === videoMenuVal)
			})
			return videoMenuVal
		})

		setCallback(() => callbackFunction)
	}

	return (
		<Button
			buttonProps={{
				handleClick,
				buttonName,
				tilt: false,
				disabled: false,
				isFocused: isFilterFocused[videoMenuVal],
			}}
		/>
	)
}

export default FilterButton
