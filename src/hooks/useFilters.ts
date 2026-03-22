import { useRef, useState } from "react"
import { Callback, Colour, FilterLevels } from "../interfaces/types"
import { videoMenu } from "../interfaces/enums"

const INITIAL_RGBA: Colour = { red: 0, green: 0, blue: 0, alpha: 0 }
const INITIAL_RGB_SHIFT: Colour = { red: 0, green: 0, blue: 0 }
const INITIAL_LEVELS: FilterLevels = {
	rmin: 50, rmax: 100,
	gmin: 50, gmax: 100,
	bmin: 50, bmax: 100,
	background: "#3fff00",
}

export function useFilters() {
	const [rgbaMod, setRgbaMod] = useState<Colour>(INITIAL_RGBA)
	const [rgbShift, setRgbShift] = useState<Colour>(INITIAL_RGB_SHIFT)
	const [levels, setLevels] = useState<FilterLevels>(INITIAL_LEVELS)
	const [callback, setCallback] = useState<Callback>(null)
	const [colourSettings, setColourSettings] = useState<videoMenu | null>(null)
	const colorChanged = useRef(false)

	const reset = () => {
		setRgbaMod(INITIAL_RGBA)
		setRgbShift(INITIAL_RGB_SHIFT)
		setLevels(INITIAL_LEVELS)
		setCallback(null)
		setColourSettings(null)
		colorChanged.current = false
	}

	return {
		rgbaMod, setRgbaMod,
		rgbShift, setRgbShift,
		levels, setLevels,
		callback, setCallback,
		colourSettings, setColourSettings,
		colorChanged,
		reset,
	}
}
