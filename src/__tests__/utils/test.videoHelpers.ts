import {
	seekVideoToTime,
	waitForVideoData,
	waitForNextFrame,
	pauseVideo,
	playVideo,
} from "../../utils/videoHelpers"

// Mock requestAnimationFrame for jsdom
beforeEach(() => {
	jest.useFakeTimers()
})

afterEach(() => {
	jest.useRealTimers()
})

/**
 * Creates a minimal mock HTMLVideoElement with controllable properties
 * and event dispatch.
 */
function createMockVideo(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
	const listeners: Record<string, EventListenerOrEventListenerObject[]> = {}
	const video = {
		currentTime: 0,
		duration: 60,
		paused: true,
		readyState: 0,
		addEventListener: jest.fn((event: string, handler: EventListenerOrEventListenerObject) => {
			if (!listeners[event]) listeners[event] = []
			listeners[event].push(handler)
		}),
		removeEventListener: jest.fn((event: string, handler: EventListenerOrEventListenerObject) => {
			if (listeners[event]) {
				listeners[event] = listeners[event].filter((h) => h !== handler)
			}
		}),
		pause: jest.fn(() => {
			(video as Record<string, unknown>).paused = true
			// Dispatch pause event asynchronously
			setTimeout(() => {
				listeners["pause"]?.forEach((h) => {
					if (typeof h === "function") h(new Event("pause"))
				})
			}, 10)
		}),
		play: jest.fn(() => {
			(video as Record<string, unknown>).paused = false
			// Dispatch play event asynchronously
			setTimeout(() => {
				listeners["play"]?.forEach((h) => {
					if (typeof h === "function") h(new Event("play"))
				})
			}, 10)
			return Promise.resolve()
		}),
		// Expose listeners for test control
		_listeners: listeners,
		_fireEvent: (eventName: string) => {
			listeners[eventName]?.forEach((h) => {
				if (typeof h === "function") h(new Event(eventName))
			})
		},
		...overrides,
	}
	return video as unknown as HTMLVideoElement
}

describe("seekVideoToTime", () => {
	it("resolves immediately if already at target time", async () => {
		const video = createMockVideo({ currentTime: 5.0 })
		await expect(seekVideoToTime(video, 5.0)).resolves.toBeUndefined()
		// Should not register any event listener since no seek is needed
		expect(video.addEventListener).not.toHaveBeenCalled()
	})

	it("sets currentTime and listens for seeked event", async () => {
		const video = createMockVideo({ currentTime: 0 })
		const promise = seekVideoToTime(video, 10)

		// Verify it registered a seeked listener
		expect(video.addEventListener).toHaveBeenCalledWith(
			"seeked", expect.any(Function), { once: true }
		)
		// Verify it set currentTime on the video element
		expect(video.currentTime).toBe(10)

		;(video as unknown as { _fireEvent: (e: string) => void })._fireEvent("seeked")
		await expect(promise).resolves.toBeUndefined()

		// Verify cleanup: listener removed after resolve
		expect(video.removeEventListener).toHaveBeenCalledWith(
			"seeked", expect.any(Function)
		)
	})

	it("rejects on timeout and cleans up listener", async () => {
		const video = createMockVideo({ currentTime: 0 })
		const promise = seekVideoToTime(video, 10, 100)

		jest.advanceTimersByTime(150)

		await expect(promise).rejects.toThrow("Seek timeout")
		expect(video.removeEventListener).toHaveBeenCalledWith(
			"seeked", expect.any(Function)
		)
	})
})

describe("waitForVideoData", () => {
	it("resolves immediately if readyState >= 2", async () => {
		const video = createMockVideo({ readyState: 3 })
		await expect(waitForVideoData(video)).resolves.toBeUndefined()
		// No listener needed when data is already loaded
		expect(video.addEventListener).not.toHaveBeenCalled()
	})

	it("listens for loadeddata when readyState < 2", async () => {
		const video = createMockVideo({ readyState: 0 })
		const promise = waitForVideoData(video)

		expect(video.addEventListener).toHaveBeenCalledWith(
			"loadeddata", expect.any(Function), { once: true }
		)

		;(video as unknown as { _fireEvent: (e: string) => void })._fireEvent("loadeddata")
		await expect(promise).resolves.toBeUndefined()
		expect(video.removeEventListener).toHaveBeenCalledWith(
			"loadeddata", expect.any(Function)
		)
	})

	it("rejects on timeout", async () => {
		const video = createMockVideo({ readyState: 0 })
		const promise = waitForVideoData(video, 100)

		jest.advanceTimersByTime(150)

		await expect(promise).rejects.toThrow("Video data timeout")
	})
})

describe("waitForNextFrame", () => {
	it("resolves after requestAnimationFrame fires", async () => {
		jest.useRealTimers()
		// requestAnimationFrame is available in jsdom (polyfilled or real)
		await expect(waitForNextFrame()).resolves.toBeUndefined()
	})
})

describe("pauseVideo", () => {
	it("resolves immediately if already paused", async () => {
		const video = createMockVideo({ paused: true })
		await expect(pauseVideo(video)).resolves.toBeUndefined()
		expect(video.pause).not.toHaveBeenCalled()
	})

	it("calls pause() and waits for pause event", async () => {
		const video = createMockVideo({ paused: false })
		const promise = pauseVideo(video)

		expect(video.pause).toHaveBeenCalled()
		expect(video.addEventListener).toHaveBeenCalledWith(
			"pause", expect.any(Function), { once: true }
		)

		// Our mock fires pause event after 10ms via setTimeout
		jest.advanceTimersByTime(20)

		await expect(promise).resolves.toBeUndefined()
	})

	it("rejects on timeout", async () => {
		const video = createMockVideo({ paused: false })
		// Override pause to not fire event
		;(video as unknown as { pause: jest.Mock }).pause = jest.fn()
		const promise = pauseVideo(video, 100)

		jest.advanceTimersByTime(150)

		await expect(promise).rejects.toThrow("Pause timeout")
	})
})

describe("playVideo", () => {
	it("resolves immediately if already playing", async () => {
		const video = createMockVideo({ paused: false })
		await expect(playVideo(video)).resolves.toBeUndefined()
		expect(video.play).not.toHaveBeenCalled()
	})

	it("calls play() and waits for play event", async () => {
		const video = createMockVideo({ paused: true })
		const promise = playVideo(video)

		expect(video.play).toHaveBeenCalled()
		expect(video.addEventListener).toHaveBeenCalledWith(
			"play", expect.any(Function), { once: true }
		)

		// Our mock fires play event after 10ms via setTimeout
		jest.advanceTimersByTime(20)

		await expect(promise).resolves.toBeUndefined()
	})

	it("rejects on timeout", async () => {
		const video = createMockVideo({ paused: true })
		// Override play to not fire event
		;(video as unknown as { play: jest.Mock }).play = jest.fn(() => Promise.resolve())
		const promise = playVideo(video, 100)

		jest.advanceTimersByTime(150)

		await expect(promise).rejects.toThrow("Play timeout")
	})
})
