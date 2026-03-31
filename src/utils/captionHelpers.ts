const MAX_EXPR_DEPTH = 32

/**
 * Safely evaluates mathematical expressions with variable substitution.
 * Supports +, -, *, /, parentheses, numeric literals, and named variables.
 *
 * Used for FFmpeg-style position/size expressions like "(w-text_w)/2".
 */
export function evalExpr(expr: string, env: Record<string, number>): number {
	const tokens = expr.match(/(\d+\.?\d*|[a-z_]\w*|[+\-*/()])/gi)
	if (!tokens) return NaN
	let pos = 0

	function parseExpr(tokens: RegExpMatchArray, depth: number): number {
		if (depth > MAX_EXPR_DEPTH) return NaN
		let left = parseTerm(tokens, depth)
		while (
			pos < tokens.length &&
			(tokens[pos] === "+" || tokens[pos] === "-")
		) {
			const op = tokens[pos++]
			const right = parseTerm(tokens, depth)
			left = op === "+" ? left + right : left - right
		}
		return left
	}

	function parseTerm(tokens: RegExpMatchArray, depth: number): number {
		if (depth > MAX_EXPR_DEPTH) return NaN
		let left = parseFactor(tokens, depth)
		while (
			pos < tokens.length &&
			(tokens[pos] === "*" || tokens[pos] === "/")
		) {
			const op = tokens[pos++]
			const right = parseFactor(tokens, depth)
			left = op === "*" ? left * right : left / right
		}
		return left
	}

	function parseFactor(tokens: RegExpMatchArray, depth: number): number {
		if (depth > MAX_EXPR_DEPTH) return NaN
		if (pos >= tokens.length) return NaN
		if (tokens[pos] === "(") {
			pos++
			const val = parseExpr(tokens, depth + 1)
			if (pos < tokens.length && tokens[pos] === ")") pos++
			return val
		}
		const token = tokens[pos++]
		if (token in env) return env[token]
		const num = Number(token)
		return Number.isFinite(num) ? num : NaN
	}

	return parseExpr(tokens, 0)
}

/** Clamp a value between min (a) and max (b). */
export const clamp = (v: number, a: number, b: number) =>
	Math.max(a, Math.min(b, v))

/** Map font names to actual CSS font family strings. */
export function getFontFamily(fontName: string): string {
	const fontMap: { [key: string]: string } = {
		times: "'GIF Times', 'Times New Roman', Times, serif",
		impact:
			"'GIF Impact', Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
		cursive: "'GIF Comic', 'Comic Sans MS', cursive",
		comic: "'GIF Comic', 'Comic Sans MS', cursive",
	}
	return fontMap[fontName.toLowerCase()] || fontName
}

/** Escape special characters for FFmpeg's drawtext filter. */
export function escapeForFFmpeg(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/'/g, "\\'")
		.replace(/:/g, "\\:")
		.replace(/%/g, "%%")
		.replace(/;/g, "\\;")
}
