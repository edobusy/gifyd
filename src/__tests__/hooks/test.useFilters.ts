import { renderHook, act } from "@testing-library/react"
import { useFilters } from "../../hooks/useFilters"

describe("useFilters", () => {
	it("has correct initial state", () => {
		const { result } = renderHook(() => useFilters())

		expect(result.current.rgbaMod).toEqual({ red: 0, green: 0, blue: 0, alpha: 0 })
		expect(result.current.rgbShift).toEqual({ red: 0, green: 0, blue: 0 })
		expect(result.current.levels).toEqual({
			rmin: 50, rmax: 100,
			gmin: 50, gmax: 100,
			bmin: 50, bmax: 100,
			background: "#3fff00",
		})
		expect(result.current.callback).toBeNull()
		expect(result.current.colourSettings).toBeNull()
		expect(result.current.colorChanged.current).toBe(false)
	})

	it("setRgbaMod updates the colour modifier", () => {
		const { result } = renderHook(() => useFilters())

		act(() => {
			result.current.setRgbaMod({ red: 50, green: -30, blue: 10 })
		})

		expect(result.current.rgbaMod).toEqual({ red: 50, green: -30, blue: 10 })
	})

	it("setRgbShift updates the shift values", () => {
		const { result } = renderHook(() => useFilters())

		act(() => {
			result.current.setRgbShift({ red: 100, green: -200, blue: 300 })
		})

		expect(result.current.rgbShift).toEqual({ red: 100, green: -200, blue: 300 })
	})

	it("setLevels updates the green screen levels", () => {
		const { result } = renderHook(() => useFilters())

		act(() => {
			result.current.setLevels({
				rmin: 0, rmax: 255,
				gmin: 100, gmax: 200,
				bmin: 10, bmax: 20,
				background: "#ff0000",
			})
		})

		expect(result.current.levels).toEqual({
			rmin: 0, rmax: 255,
			gmin: 100, gmax: 200,
			bmin: 10, bmax: 20,
			background: "#ff0000",
		})
	})

	it("setCallback updates the filter callback", () => {
		const { result } = renderHook(() => useFilters())
		const fn = jest.fn()

		act(() => {
			result.current.setCallback(() => fn)
		})

		expect(result.current.callback).toBe(fn)
	})

	it("reset returns to initial state", () => {
		const { result } = renderHook(() => useFilters())

		act(() => {
			result.current.setRgbaMod({ red: 100, green: 100, blue: 100 })
			result.current.setRgbShift({ red: 500, green: 500, blue: 500 })
			result.current.setLevels({
				rmin: 0, rmax: 0,
				gmin: 0, gmax: 0,
				bmin: 0, bmax: 0,
				background: "#000000",
			})
			result.current.colorChanged.current = true
		})

		act(() => {
			result.current.reset()
		})

		expect(result.current.rgbaMod).toEqual({ red: 0, green: 0, blue: 0, alpha: 0 })
		expect(result.current.rgbShift).toEqual({ red: 0, green: 0, blue: 0 })
		expect(result.current.levels).toEqual({
			rmin: 50, rmax: 100,
			gmin: 50, gmax: 100,
			bmin: 50, bmax: 100,
			background: "#3fff00",
		})
		expect(result.current.callback).toBeNull()
		expect(result.current.colourSettings).toBeNull()
		expect(result.current.colorChanged.current).toBe(false)
	})
})
