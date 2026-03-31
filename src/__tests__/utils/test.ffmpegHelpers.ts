import {
	readFFmpegFile,
	ffmpegFileExists,
	waitForFFmpegFile,
} from "../../utils/ffmpegHelpers"
import type { FFmpeg } from "@ffmpeg/ffmpeg"

/**
 * Creates a mock FFmpeg instance with a controllable virtual filesystem.
 */
function createMockFFmpeg(files: Record<string, Uint8Array> = {}): FFmpeg {
	const fs: Record<string, Uint8Array> = { ...files }
	return {
		FS: jest.fn((command: string, ...args: unknown[]) => {
			if (command === "readdir") {
				const dir = args[0] as string
				if (dir === "/") {
					return [".", "..", ...Object.keys(fs)]
				}
				throw new Error(`Directory ${dir} not found`)
			}
			if (command === "readFile") {
				const filename = args[0] as string
				if (filename in fs) return fs[filename]
				throw new Error(`File ${filename} not found`)
			}
			if (command === "writeFile") {
				const filename = args[0] as string
				fs[filename] = args[1] as Uint8Array
			}
		}),
		// Expose fs for test manipulation
		_fs: fs,
	} as unknown as FFmpeg & { _fs: Record<string, Uint8Array> }
}

describe("ffmpegFileExists", () => {
	it("returns true when file exists", () => {
		const ffmpeg = createMockFFmpeg({
			"output.gif": new Uint8Array([1, 2, 3]),
		})
		expect(ffmpegFileExists(ffmpeg, "output.gif")).toBe(true)
	})

	it("returns false when file does not exist", () => {
		const ffmpeg = createMockFFmpeg({})
		expect(ffmpegFileExists(ffmpeg, "missing.gif")).toBe(false)
	})

	it("returns false when FS throws", () => {
		const ffmpeg = {
			FS: jest.fn(() => { throw new Error("FS error") }),
		} as unknown as FFmpeg
		expect(ffmpegFileExists(ffmpeg, "any.gif")).toBe(false)
	})
})

describe("readFFmpegFile", () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})
	afterEach(() => {
		jest.useRealTimers()
	})

	it("reads file successfully on first attempt", async () => {
		const data = new Uint8Array([71, 73, 70]) // "GIF"
		const ffmpeg = createMockFFmpeg({ "out.gif": data })

		const result = await readFFmpegFile(ffmpeg, "out.gif", { verbose: false })
		expect(result).toEqual(data)
	})

	it("throws after max retries when file never appears", async () => {
		const ffmpeg = createMockFFmpeg({})

		const promise = readFFmpegFile(ffmpeg, "missing.gif", {
			maxRetries: 2,
			initialDelay: 10,
			verbose: false,
		})

		// Advance timers to let retries complete
		for (let i = 0; i < 5; i++) {
			jest.advanceTimersByTime(100)
			await Promise.resolve() // flush microtasks
		}

		await expect(promise).rejects.toThrow("Failed to read missing.gif after 2 attempts")
	})

	it("retries and succeeds when file appears on later attempt", async () => {
		const ffmpeg = createMockFFmpeg({})
		const data = new Uint8Array([1, 2, 3])

		const promise = readFFmpegFile(ffmpeg, "delayed.gif", {
			maxRetries: 5,
			initialDelay: 10,
			verbose: false,
		})

		// After first retry delay, add the file
		jest.advanceTimersByTime(15)
		await Promise.resolve()
		;(ffmpeg as unknown as { _fs: Record<string, Uint8Array> })._fs["delayed.gif"] = data

		// Advance to let the retry find it
		jest.advanceTimersByTime(50)
		await Promise.resolve()
		jest.advanceTimersByTime(50)
		await Promise.resolve()

		const result = await promise
		expect(result).toEqual(data)
	})

	it("throws when file exists but is empty", async () => {
		const ffmpeg = createMockFFmpeg({
			"empty.gif": new Uint8Array([]),
		})

		const promise = readFFmpegFile(ffmpeg, "empty.gif", {
			maxRetries: 2,
			initialDelay: 10,
			verbose: false,
		})

		// Advance through retries
		for (let i = 0; i < 5; i++) {
			jest.advanceTimersByTime(100)
			await Promise.resolve()
		}

		await expect(promise).rejects.toThrow("Failed to read empty.gif")
	})
})

describe("waitForFFmpegFile", () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})
	afterEach(() => {
		jest.useRealTimers()
	})

	it("resolves when file already exists", async () => {
		const ffmpeg = createMockFFmpeg({
			"out.gif": new Uint8Array([1]),
		})

		await expect(
			waitForFFmpegFile(ffmpeg, "out.gif", { verbose: false })
		).resolves.toBeUndefined()
	})

	it("resolves when file appears before timeout", async () => {
		const ffmpeg = createMockFFmpeg({})

		const promise = waitForFFmpegFile(ffmpeg, "new.gif", {
			timeout: 1000,
			pollInterval: 50,
			verbose: false,
		})

		// Add file after 100ms
		jest.advanceTimersByTime(60)
		await Promise.resolve()
		;(ffmpeg as unknown as { _fs: Record<string, Uint8Array> })._fs["new.gif"] = new Uint8Array([1])

		jest.advanceTimersByTime(60)
		await Promise.resolve()

		await expect(promise).resolves.toBeUndefined()
	})

	it("throws when timeout exceeded", async () => {
		const ffmpeg = createMockFFmpeg({})

		const promise = waitForFFmpegFile(ffmpeg, "never.gif", {
			timeout: 200,
			pollInterval: 50,
			verbose: false,
		})

		// Advance past timeout
		for (let i = 0; i < 10; i++) {
			jest.advanceTimersByTime(50)
			await Promise.resolve()
		}

		await expect(promise).rejects.toThrow("did not appear within 200ms")
	})
})
