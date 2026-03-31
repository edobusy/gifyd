import { renderHook, act } from "@testing-library/react"
import { useTimeline } from "../../hooks/useTimeline"

describe("useTimeline", () => {
	it("has correct initial state", () => {
		const { result } = renderHook(() => useTimeline())

		expect(result.current.startTime).toBe(0)
		expect(result.current.framerate).toBe(15)
		expect(result.current.duration).toBe(1000) // MINIMUM_DURATION
		expect(result.current.maxDuration).toBe(0)
		expect(result.current.maxStartTime).toBe(0)
		expect(result.current.minimumDuration).toBe(1000)
	})

	it("initFromVideo sets maxStartTime and maxDuration", () => {
		const { result } = renderHook(() => useTimeline())

		act(() => {
			result.current.initFromVideo(10000)
		})

		// maxStartTime = 10000 - 1000 = 9000
		expect(result.current.maxStartTime).toBe(9000)
		// maxDuration = min(10000, 4000) = 4000
		expect(result.current.maxDuration).toBe(4000)
	})

	it("caps maxDuration at MAX_GIF_DURATION for long videos", () => {
		const { result } = renderHook(() => useTimeline())

		act(() => {
			result.current.initFromVideo(60000)
		})

		expect(result.current.maxDuration).toBe(4000)
	})

	it("sets maxDuration to video duration for short videos", () => {
		const { result } = renderHook(() => useTimeline())

		act(() => {
			result.current.initFromVideo(2000)
		})

		// maxDuration = 2000 (video shorter than MAX_GIF_DURATION)
		expect(result.current.maxDuration).toBe(2000)
	})

	it("allows framerate to be set", () => {
		const { result } = renderHook(() => useTimeline())

		act(() => {
			result.current.setFramerate(30)
		})

		expect(result.current.framerate).toBe(30)
	})

	it("allows startTime to be set", () => {
		const { result } = renderHook(() => useTimeline())

		act(() => {
			result.current.initFromVideo(10000)
		})

		act(() => {
			result.current.setStartTime(5000)
		})

		expect(result.current.startTime).toBe(5000)
	})

	it("clamps duration when startTime moves near end of video", () => {
		const { result } = renderHook(() => useTimeline())

		// Simulate vidRef.current being set (the useEffect checks this)
		const fakeVideo = document.createElement("video")
		Object.defineProperty(result.current.vidRef, "current", {
			get: () => fakeVideo,
			configurable: true,
		})

		act(() => {
			// 6 second video: maxStartTime = 6000 - 1000 = 5000
			result.current.initFromVideo(6000)
		})

		// maxDuration should be 4000 (capped by MAX_GIF_DURATION)
		expect(result.current.maxDuration).toBe(4000)

		act(() => {
			result.current.setDuration(4000)
		})

		// Now move startTime to 4500ms. Remaining = 5000 + 1000 - 4500 = 1500ms
		// Duration should clamp from 4000 to 1500
		act(() => {
			result.current.setStartTime(4500)
		})

		expect(result.current.maxDuration).toBe(1500)
		expect(result.current.duration).toBe(1500)
	})

	it("does not clamp duration below MINIMUM_DURATION", () => {
		const { result } = renderHook(() => useTimeline())

		const fakeVideo = document.createElement("video")
		Object.defineProperty(result.current.vidRef, "current", {
			get: () => fakeVideo,
			configurable: true,
		})

		act(() => {
			result.current.initFromVideo(6000)
		})

		// Move startTime to maxStartTime. Remaining = 5000 + 1000 - 5000 = 1000
		act(() => {
			result.current.setStartTime(5000)
		})

		expect(result.current.maxDuration).toBe(1000)
		expect(result.current.duration).toBe(1000) // MINIMUM_DURATION
	})

	it("reset returns to initial state", () => {
		const { result } = renderHook(() => useTimeline())

		act(() => {
			result.current.initFromVideo(10000)
			result.current.setStartTime(5000)
			result.current.setFramerate(30)
			result.current.setDuration(3000)
		})

		act(() => {
			result.current.reset()
		})

		expect(result.current.startTime).toBe(0)
		expect(result.current.framerate).toBe(15)
		expect(result.current.duration).toBe(1000)
		expect(result.current.maxDuration).toBe(0)
		expect(result.current.maxStartTime).toBe(0)
	})

	it("provides a vidRef", () => {
		const { result } = renderHook(() => useTimeline())
		expect(result.current.vidRef).toBeDefined()
		expect(result.current.vidRef.current).toBeNull()
	})
})
