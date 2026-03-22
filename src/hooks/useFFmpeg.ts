import { useEffect, useState } from "react"
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg"
import times from "../assets/times.ttf"
import impact from "../assets/impact.ttf"
import comic from "../assets/comic.ttf"

const ffmpeg = createFFmpeg({ log: false })

export function useFFmpeg() {
	const [isLoaded, setIsLoaded] = useState(false)
	const [ffmpegError, setFfmpegError] = useState<string | null>(null)

	useEffect(() => {
		const loadFfmpeg = async () => {
			try {
				if (ffmpeg.isLoaded()) {
					setIsLoaded(true)
					return
				}
				await ffmpeg.load()
				// Write font files once so they're available for every GIF creation
				let fontData = await fetchFile(times)
				ffmpeg.FS("writeFile", "times.ttf", fontData)
				fontData = await fetchFile(comic)
				ffmpeg.FS("writeFile", "comic.ttf", fontData)
				fontData = await fetchFile(impact)
				ffmpeg.FS("writeFile", "impact.ttf", fontData)
				setIsLoaded(true)
			} catch (error) {
				console.error("Failed to load FFmpeg:", error)
				setFfmpegError(
					"Failed to load video processing engine. " +
					"Please ensure your browser supports SharedArrayBuffer and try again."
				)
			}
		}
		loadFfmpeg()
	}, [])

	return { ffmpeg, isLoaded, ffmpegError }
}
