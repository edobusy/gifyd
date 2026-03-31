import {
	hexToRgb,
	takeDown,
	customColour as _customColour,
	rgbSplit as _rgbSplit,
	greenScreen as _greenScreen,
} from "../../functions/videoManipulation"
import { FilterOptions } from "../../interfaces/types"

// These are typed as Callback (nullable) but are always defined at import
const customColour = _customColour!
const rgbSplit = _rgbSplit!
const greenScreen = _greenScreen!

// Helper to create a pixel array from RGBA tuples
function pixels(...rgba: [number, number, number, number][]): Uint8ClampedArray {
	const arr = new Uint8ClampedArray(rgba.length * 4)
	rgba.forEach(([r, g, b, a], i) => {
		arr[i * 4] = r
		arr[i * 4 + 1] = g
		arr[i * 4 + 2] = b
		arr[i * 4 + 3] = a
	})
	return arr
}

function makeOptions(
	overrides: Partial<FilterOptions> = {}
): FilterOptions {
	return {
		rgbaMod: { red: 0, green: 0, blue: 0 },
		rgbShift: { red: 0, green: 0, blue: 0 },
		levels: {
			rmin: 0, rmax: 255,
			gmin: 0, gmax: 255,
			bmin: 0, bmax: 255,
			background: "#000000",
		},
		...overrides,
	}
}

describe("hexToRgb", () => {
	it("converts valid hex colors", () => {
		expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 })
		expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 })
		expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 })
		expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 })
		expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 })
	})

	it("handles mixed-case hex", () => {
		expect(hexToRgb("#ABCDEF")).toEqual({ r: 171, g: 205, b: 239 })
		expect(hexToRgb("#abcdef")).toEqual({ r: 171, g: 205, b: 239 })
	})

	it("returns zero for invalid inputs", () => {
		expect(hexToRgb("")).toEqual({ r: 0, g: 0, b: 0 })
		expect(hexToRgb("ffffff")).toEqual({ r: 0, g: 0, b: 0 })
		expect(hexToRgb("#fff")).toEqual({ r: 0, g: 0, b: 0 })
		expect(hexToRgb("#")).toEqual({ r: 0, g: 0, b: 0 })
	})
})

describe("takeDown", () => {
	it("leaves small dimensions unchanged (and even)", () => {
		expect(takeDown(400, 300)).toEqual([400, 300])
	})

	it("leaves exact boundary unchanged", () => {
		expect(takeDown(600, 600)).toEqual([600, 600])
	})

	it("scales down when width exceeds 600", () => {
		// 1200x600 -> scale = 600/1200 = 0.5 -> 600x300
		expect(takeDown(1200, 600)).toEqual([600, 300])
	})

	it("scales down when height exceeds 600", () => {
		// 400x800 -> scale = 600/800 = 0.75 -> 300x600
		expect(takeDown(400, 800)).toEqual([300, 600])
	})

	it("scales down when both exceed 600", () => {
		// 1200x1200 -> scale = 0.5 -> 600x600
		expect(takeDown(1200, 1200)).toEqual([600, 600])
	})

	it("ensures even dimensions", () => {
		// 601x601 -> both under 600? No, over. scale = 600/601 ~= 0.998
		// 601 * 0.998 = 599.998 -> floor(599.998/2)*2 = 598
		const result = takeDown(601, 601)
		expect(result[0] % 2).toBe(0)
		expect(result[1] % 2).toBe(0)
	})

	it("ensures even dimensions for small odd inputs", () => {
		// 301x201 -> under 600, no scaling. floor(301/2)*2=300, floor(201/2)*2=200
		expect(takeDown(301, 201)).toEqual([300, 200])
	})

	it("preserves aspect ratio", () => {
		const [w, h] = takeDown(1600, 900)
		// Original ratio: 1600/900 = 1.778
		// Scaled: should be close after even-rounding
		expect(Math.abs(w / h - 1600 / 900)).toBeLessThan(0.02)
	})
})

describe("customColour", () => {
	it("returns pixels unchanged with zero modification", () => {
		const input = pixels([100, 150, 200, 255])
		const opts = makeOptions({ rgbaMod: { red: 0, green: 0, blue: 0 } })
		const result = customColour(input, opts)
		expect(result[0]).toBe(100)
		expect(result[1]).toBe(150)
		expect(result[2]).toBe(200)
		expect(result[3]).toBe(255) // alpha untouched
	})

	it("adds positive RGB values", () => {
		const input = pixels([100, 100, 100, 255])
		const opts = makeOptions({ rgbaMod: { red: 50, green: 30, blue: 10 } })
		const result = customColour(input, opts)
		expect(result[0]).toBe(150)
		expect(result[1]).toBe(130)
		expect(result[2]).toBe(110)
	})

	it("subtracts with negative RGB values", () => {
		const input = pixels([100, 100, 100, 255])
		const opts = makeOptions({ rgbaMod: { red: -50, green: -30, blue: -10 } })
		const result = customColour(input, opts)
		expect(result[0]).toBe(50)
		expect(result[1]).toBe(70)
		expect(result[2]).toBe(90)
	})

	it("Uint8ClampedArray clamps overflow to 255", () => {
		const input = pixels([200, 200, 200, 255])
		const opts = makeOptions({ rgbaMod: { red: 100, green: 100, blue: 100 } })
		const result = customColour(input, opts)
		expect(result[0]).toBe(255) // 200+100=300 -> clamped to 255
		expect(result[1]).toBe(255)
		expect(result[2]).toBe(255)
	})

	it("Uint8ClampedArray clamps underflow to 0", () => {
		const input = pixels([50, 50, 50, 255])
		const opts = makeOptions({ rgbaMod: { red: -100, green: -100, blue: -100 } })
		const result = customColour(input, opts)
		expect(result[0]).toBe(0) // 50-100=-50 -> clamped to 0
		expect(result[1]).toBe(0)
		expect(result[2]).toBe(0)
	})

	it("does not modify alpha channel", () => {
		const input = pixels([100, 100, 100, 128])
		const opts = makeOptions({ rgbaMod: { red: 50, green: 50, blue: 50 } })
		customColour(input, opts)
		expect(input[3]).toBe(128)
	})

	it("processes multiple pixels", () => {
		const input = pixels([10, 20, 30, 255], [40, 50, 60, 255])
		const opts = makeOptions({ rgbaMod: { red: 5, green: 5, blue: 5 } })
		const result = customColour(input, opts)
		expect(result[0]).toBe(15)
		expect(result[4]).toBe(45)
	})
})

describe("rgbSplit", () => {
	it("with zero shift, all channels write to slot 0 (last write wins)", () => {
		// pixels[i+0]=source[i], pixels[i+0]=source[i+1], pixels[i+0]=source[i+2]
		// Last write (blue) overwrites slot 0
		const input = pixels([100, 150, 200, 255])
		const opts = makeOptions({ rgbShift: { red: 0, green: 0, blue: 0 } })
		const result = rgbSplit(input, opts)
		expect(result[0]).toBe(200) // blue value wins
	})

	it("shifts channels according to shift values", () => {
		const input = pixels([100, 150, 200, 255])
		// red=1 means: pixels[i + 1] = source[i] (red value written to green slot)
		const opts = makeOptions({ rgbShift: { red: 1, green: 0, blue: 0 } })
		const result = rgbSplit(input, opts)
		// pixels[0 + 1] = source[0] = 100 (red value overwrites green slot)
		expect(result[1]).toBe(100)
	})

	it("reads from original values, not mutated buffer", () => {
		// With red=1: pixels[i+1] = source[i] (writes red to green slot)
		// With green=0: pixels[i+0] = source[i+1] (writes green to red slot)
		// If no copy were made, the second write would read the already-mutated
		// green slot instead of the original value. The copy ensures source[i+1]
		// is the original green (150), not the overwritten value.
		const input = pixels([100, 150, 200, 255])
		const opts = makeOptions({ rgbShift: { red: 1, green: 0, blue: 2 } })
		const result = rgbSplit(input, opts)
		// pixels[i+1] = source[i] = 100 (original red)
		expect(result[1]).toBe(100)
		// pixels[i+0] = source[i+1] = 150 (original green, NOT the 100 just written)
		expect(result[0]).toBe(150)
		// pixels[i+2] = source[i+2] = 200 (original blue)
		expect(result[2]).toBe(200)
	})

	it("spreads channels to distinct slots with different shifts", () => {
		// red=0, green=1, blue=2 -> identity mapping: each channel stays in place
		const input = pixels([100, 150, 200, 255])
		const opts = makeOptions({ rgbShift: { red: 0, green: 1, blue: 2 } })
		const result = rgbSplit(input, opts)
		expect(result[0]).toBe(100) // pixels[i+0] = source[i] (red)
		expect(result[1]).toBe(150) // pixels[i+1] = source[i+1] (green)
		expect(result[2]).toBe(200) // pixels[i+2] = source[i+2] (blue)
	})

	it("processes multiple pixels", () => {
		const input = pixels([10, 20, 30, 255], [40, 50, 60, 255])
		const opts = makeOptions({ rgbShift: { red: 0, green: 1, blue: 2 } })
		const result = rgbSplit(input, opts)
		expect(result[0]).toBe(10)
		expect(result[4]).toBe(40)
	})
})

describe("greenScreen", () => {
	it("replaces pixels within the colour range", () => {
		const input = pixels([75, 75, 75, 255])
		const opts = makeOptions({
			levels: {
				rmin: 50, rmax: 100,
				gmin: 50, gmax: 100,
				bmin: 50, bmax: 100,
				background: "#ff0000",
			},
		})
		const result = greenScreen(input, opts)
		expect(result[0]).toBe(255) // replaced with red background
		expect(result[1]).toBe(0)
		expect(result[2]).toBe(0)
	})

	it("leaves pixels outside the range unchanged", () => {
		const input = pixels([200, 200, 200, 255])
		const opts = makeOptions({
			levels: {
				rmin: 50, rmax: 100,
				gmin: 50, gmax: 100,
				bmin: 50, bmax: 100,
				background: "#ff0000",
			},
		})
		const result = greenScreen(input, opts)
		expect(result[0]).toBe(200)
		expect(result[1]).toBe(200)
		expect(result[2]).toBe(200)
	})

	it("includes boundary values (exactly at min and max)", () => {
		const input = pixels([50, 50, 50, 255])
		const opts = makeOptions({
			levels: {
				rmin: 50, rmax: 100,
				gmin: 50, gmax: 100,
				bmin: 50, bmax: 100,
				background: "#0000ff",
			},
		})
		const result = greenScreen(input, opts)
		expect(result[0]).toBe(0)
		expect(result[1]).toBe(0)
		expect(result[2]).toBe(255) // blue background

		const input2 = pixels([100, 100, 100, 255])
		const result2 = greenScreen(input2, opts)
		expect(result2[2]).toBe(255) // also replaced (at max)
	})

	it("excludes pixel if any single channel is outside range", () => {
		// red=49 is below rmin=50, so no replacement
		const input = pixels([49, 75, 75, 255])
		const opts = makeOptions({
			levels: {
				rmin: 50, rmax: 100,
				gmin: 50, gmax: 100,
				bmin: 50, bmax: 100,
				background: "#ff0000",
			},
		})
		const result = greenScreen(input, opts)
		expect(result[0]).toBe(49) // unchanged
	})

	it("handles multiple pixels with mixed matches", () => {
		const input = pixels(
			[75, 75, 75, 255],   // in range -> replaced
			[200, 200, 200, 255], // out of range -> unchanged
		)
		const opts = makeOptions({
			levels: {
				rmin: 50, rmax: 100,
				gmin: 50, gmax: 100,
				bmin: 50, bmax: 100,
				background: "#00ff00",
			},
		})
		const result = greenScreen(input, opts)
		expect(result[0]).toBe(0)   // replaced
		expect(result[1]).toBe(255)
		expect(result[4]).toBe(200) // unchanged
		expect(result[5]).toBe(200)
	})
})
