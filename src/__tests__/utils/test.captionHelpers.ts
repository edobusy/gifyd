import {
	evalExpr,
	clamp,
	getFontFamily,
	escapeForFFmpeg,
} from "../../utils/captionHelpers"

describe("evalExpr", () => {
	it("evaluates simple arithmetic", () => {
		expect(evalExpr("2+3", {})).toBe(5)
		expect(evalExpr("10-4", {})).toBe(6)
		expect(evalExpr("6*7", {})).toBe(42)
		expect(evalExpr("8/2", {})).toBe(4)
	})

	it("respects operator precedence", () => {
		expect(evalExpr("2+3*4", {})).toBe(14)
		expect(evalExpr("10-2*3", {})).toBe(4)
	})

	it("handles parentheses", () => {
		expect(evalExpr("(2+3)*4", {})).toBe(20)
		expect(evalExpr("((10+5)*2)", {})).toBe(30)
	})

	it("substitutes variables from env", () => {
		expect(evalExpr("w/2", { w: 100 })).toBe(50)
		expect(evalExpr("w+h", { w: 100, h: 200 })).toBe(300)
	})

	it("evaluates complex expressions used in captions", () => {
		const env = { w: 600, text_w: 200 }
		expect(evalExpr("(w-text_w)/2", env)).toBe(200)
	})

	it("handles the typical Y-position expression", () => {
		const env = { h: 1000, text_h: 50 }
		expect(evalExpr("(h-text_h)/2", env)).toBe(475)
	})

	it("handles floating point numbers", () => {
		expect(evalExpr("1.5*2", {})).toBe(3)
		expect(evalExpr("3.14+0.86", {})).toBeCloseTo(4)
	})

	it("returns NaN for empty or invalid input", () => {
		expect(evalExpr("", {})).toBeNaN()
		expect(evalExpr("   ", {})).toBeNaN()
	})

	it("returns NaN for unknown variables", () => {
		expect(evalExpr("unknown_var", {})).toBeNaN()
	})

	it("returns Infinity for division by zero", () => {
		expect(evalExpr("10/0", {})).toBe(Infinity)
	})

	it("handles nested parentheses", () => {
		expect(evalExpr("((2+3)*(4+1))", {})).toBe(25)
	})
})

describe("clamp", () => {
	it("returns value when within range", () => {
		expect(clamp(5, 0, 10)).toBe(5)
	})

	it("clamps to min when below", () => {
		expect(clamp(-5, 0, 10)).toBe(0)
	})

	it("clamps to max when above", () => {
		expect(clamp(15, 0, 10)).toBe(10)
	})

	it("returns min/max when they are equal", () => {
		expect(clamp(5, 10, 10)).toBe(10)
		expect(clamp(15, 10, 10)).toBe(10)
	})

	it("works with negative ranges", () => {
		expect(clamp(-15, -20, -10)).toBe(-15)
		expect(clamp(-25, -20, -10)).toBe(-20)
		expect(clamp(-5, -20, -10)).toBe(-10)
	})

	it("works with zero", () => {
		expect(clamp(0, -10, 10)).toBe(0)
	})

	it("works with floating point values", () => {
		expect(clamp(5.5, 5.0, 6.0)).toBe(5.5)
	})
})

describe("getFontFamily", () => {
	it("maps known font names to CSS font families", () => {
		expect(getFontFamily("times")).toContain("GIF Times")
		expect(getFontFamily("impact")).toContain("GIF Impact")
		expect(getFontFamily("cursive")).toContain("GIF Comic")
		expect(getFontFamily("comic")).toContain("GIF Comic")
	})

	it("is case-insensitive", () => {
		expect(getFontFamily("Times")).toContain("GIF Times")
		expect(getFontFamily("IMPACT")).toContain("GIF Impact")
	})

	it("returns the input for unknown fonts", () => {
		expect(getFontFamily("unknown")).toBe("unknown")
		expect(getFontFamily("Arial")).toBe("Arial")
	})
})

describe("escapeForFFmpeg", () => {
	it("escapes backslashes", () => {
		expect(escapeForFFmpeg("a\\b")).toBe("a\\\\b")
	})

	it("escapes single quotes", () => {
		expect(escapeForFFmpeg("it's")).toBe("it\\'s")
	})

	it("escapes colons", () => {
		expect(escapeForFFmpeg("key:val")).toBe("key\\:val")
	})

	it("escapes percent signs", () => {
		expect(escapeForFFmpeg("100%")).toBe("100%%")
	})

	it("escapes semicolons", () => {
		expect(escapeForFFmpeg("a;b")).toBe("a\\;b")
	})

	it("handles multiple special characters", () => {
		expect(escapeForFFmpeg("it's: 100%")).toBe("it\\'s\\: 100%%")
	})

	it("returns empty string unchanged", () => {
		expect(escapeForFFmpeg("")).toBe("")
	})

	it("returns plain text unchanged", () => {
		expect(escapeForFFmpeg("hello world")).toBe("hello world")
	})
})
