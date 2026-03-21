import type { FFmpeg } from "@ffmpeg/ffmpeg"

/**
 * Reliably reads a file from FFmpeg's virtual filesystem with retry logic.
 * 
 * FFmpeg.wasm's filesystem operations can be asynchronous on some browsers
 * (especially mobile). This function polls for file existence and retries
 * reading with exponential backoff to handle timing issues.
 * 
 * @param ffmpeg - The FFmpeg instance
 * @param filename - Name of the file to read
 * @param options - Configuration options
 * @returns The file contents as Uint8Array
 * @throws Error if file cannot be read after all retries
 */
export async function readFFmpegFile(
	ffmpeg: FFmpeg,
	filename: string,
	options: {
		maxRetries?: number
		initialDelay?: number
		backoffMultiplier?: number
		verbose?: boolean
	} = {}
): Promise<Uint8Array> {
	const {
		maxRetries = 10,
		initialDelay = 100,
		backoffMultiplier = 1.5,
		verbose = true,
	} = options

	let lastError: any = null

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			if (attempt > 0 && verbose) {
				console.log(`readFFmpegFile: Retry attempt ${attempt} for ${filename}`)
			}

			// First, verify file exists by listing directory
			const directory = filename.includes("/") 
				? filename.substring(0, filename.lastIndexOf("/")) || "/"
				: "/"
			const files = ffmpeg.FS("readdir", directory)
			const fileBasename = filename.includes("/")
				? filename.substring(filename.lastIndexOf("/") + 1)
				: filename
			const fileExists = files.includes(fileBasename)

			if (!fileExists) {
				if (attempt === 0 && verbose) {
					console.log(
						`readFFmpegFile: ${filename} not found in ${directory}, available files:`,
						files
					)
				}
				throw new Error(`File ${filename} not yet available`)
			}

			// File exists in directory listing, try to read it
			const data = ffmpeg.FS("readFile", filename)

			// Verify we got valid data
			if (!data || data.length === 0) {
				throw new Error(`File ${filename} is empty`)
			}

			if (verbose) {
				console.log(
					`readFFmpegFile: Successfully read ${filename} on attempt ${
						attempt + 1
					}, size: ${data.length} bytes`
				)
			}

			return data
		} catch (error) {
			lastError = error

			// If this is the last attempt, throw with diagnostics
			if (attempt === maxRetries - 1) {
				if (verbose) {
					console.error(
						`readFFmpegFile: Failed to read ${filename} after ${maxRetries} attempts:`,
						error
					)

					// Final diagnostic: list directory contents
					try {
						const directory = filename.includes("/")
							? filename.substring(0, filename.lastIndexOf("/")) || "/"
							: "/"
						const finalFiles = ffmpeg.FS("readdir", directory)
						console.log(
							`readFFmpegFile: Final contents of ${directory}:`,
							finalFiles
						)
					} catch (e) {
						console.error("readFFmpegFile: Could not list directory:", e)
					}
				}

				throw new Error(
					`Failed to read ${filename} after ${maxRetries} attempts: ${
						lastError instanceof Error ? lastError.message : String(lastError)
					}`
				)
			}

			// Calculate wait time with exponential backoff
			const waitTime = initialDelay * Math.pow(backoffMultiplier, attempt)
			await new Promise((resolve) => setTimeout(resolve, waitTime))
		}
	}

	// Should never reach here, but TypeScript needs this
	throw new Error(`Unexpected error reading ${filename}`)
}

/**
 * Checks if a file exists in FFmpeg's virtual filesystem.
 * 
 * @param ffmpeg - The FFmpeg instance
 * @param filename - Name of the file to check
 * @returns true if file exists, false otherwise
 */
export function ffmpegFileExists(ffmpeg: FFmpeg, filename: string): boolean {
	try {
		const directory = filename.includes("/")
			? filename.substring(0, filename.lastIndexOf("/")) || "/"
			: "/"
		const files = ffmpeg.FS("readdir", directory)
		const fileBasename = filename.includes("/")
			? filename.substring(filename.lastIndexOf("/") + 1)
			: filename
		return files.includes(fileBasename)
	} catch (error) {
		return false
	}
}

/**
 * Waits for a file to appear in FFmpeg's virtual filesystem.
 * 
 * @param ffmpeg - The FFmpeg instance
 * @param filename - Name of the file to wait for
 * @param options - Configuration options
 * @returns Promise that resolves when file exists
 * @throws Error if file doesn't appear after timeout
 */
export async function waitForFFmpegFile(
	ffmpeg: FFmpeg,
	filename: string,
	options: {
		timeout?: number
		pollInterval?: number
		verbose?: boolean
	} = {}
): Promise<void> {
	const { timeout = 5000, pollInterval = 100, verbose = true } = options

	const startTime = Date.now()

	while (Date.now() - startTime < timeout) {
		if (ffmpegFileExists(ffmpeg, filename)) {
			if (verbose) {
				console.log(
					`waitForFFmpegFile: ${filename} appeared after ${
						Date.now() - startTime
					}ms`
				)
			}
			return
		}

		await new Promise((resolve) => setTimeout(resolve, pollInterval))
	}

	throw new Error(
		`File ${filename} did not appear within ${timeout}ms timeout`
	)
}
