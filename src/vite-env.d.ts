/// <reference types="vite/client" />

interface HTMLVideoElement {
	requestVideoFrameCallback(
		callback: (now: DOMHighResTimeStamp, metadata: object) => void
	): number
	cancelVideoFrameCallback(handle: number): void
}
