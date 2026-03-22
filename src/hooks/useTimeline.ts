import { useEffect, useRef, useState } from "react"

const MINIMUM_DURATION = 1000
const MAX_GIF_DURATION = 4000

export function useTimeline() {
	const [startTime, setStartTime] = useState(0)
	const [framerate, setFramerate] = useState(15)
	const [duration, setDuration] = useState(MINIMUM_DURATION)
	const [maxDuration, setMaxDuration] = useState(0)
	const [maxStartTime, setMaxStartTime] = useState(0)
	const vidRef = useRef<HTMLVideoElement>(null)

	// Update maxDuration and clamp duration when startTime or maxStartTime changes
	useEffect(() => {
		if (vidRef.current) {
			const remaining = maxStartTime + MINIMUM_DURATION - startTime
			const newMax = remaining > MAX_GIF_DURATION ? MAX_GIF_DURATION : remaining
			setMaxDuration(newMax)
			// Clamp duration so startTime + duration never exceeds the video end.
			// The HTML range input visually clamps to its max attribute, but the
			// React state must be explicitly updated to keep the invariant.
			setDuration((prev) => Math.max(MINIMUM_DURATION, Math.min(prev, newMax)))
		}
	}, [startTime, maxStartTime])

	const initFromVideo = (videoDurationMs: number) => {
		setMaxStartTime(videoDurationMs - MINIMUM_DURATION)
		setMaxDuration(
			videoDurationMs > MAX_GIF_DURATION ? MAX_GIF_DURATION : videoDurationMs,
		)
	}

	const reset = () => {
		setStartTime(0)
		setFramerate(15)
		setDuration(MINIMUM_DURATION)
		setMaxDuration(0)
		setMaxStartTime(0)
	}

	return {
		startTime,
		setStartTime,
		framerate,
		setFramerate,
		duration,
		setDuration,
		maxDuration,
		maxStartTime,
		minimumDuration: MINIMUM_DURATION,
		vidRef,
		initFromVideo,
		reset,
	}
}
