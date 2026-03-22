/**
 * Video Helper Utilities
 * Event-driven functions for reliable video manipulation
 * No hardcoded timeouts - uses actual browser events
 */

/**
 * Wait for a video element to seek to a specific time
 * @param video - The video element
 * @param timeInSeconds - Target time in seconds
 * @param timeoutMs - Safety timeout (default 3000ms)
 */
export const seekVideoToTime = (
  video: HTMLVideoElement,
  timeInSeconds: number,
  timeoutMs: number = 3000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already at target time
    if (Math.abs(video.currentTime - timeInSeconds) < 0.01) {
      resolve()
      return
    }
    
    let completed = false
    
    const timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true
        video.removeEventListener('seeked', onSeeked)
        reject(new Error(`Seek timeout after ${timeoutMs}ms`))
      }
    }, timeoutMs)
    
    const onSeeked = () => {
      if (!completed) {
        completed = true
        clearTimeout(timeoutId)
        video.removeEventListener('seeked', onSeeked)
        resolve()
      }
    }
    
    video.addEventListener('seeked', onSeeked, { once: true })
    video.currentTime = timeInSeconds
  })
}

/**
 * Wait for video to have enough data to display current frame
 * @param video - The video element
 * @param timeoutMs - Safety timeout (default 5000ms)
 */
export const waitForVideoData = (
  video: HTMLVideoElement,
  timeoutMs: number = 5000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already has data (readyState >= 2 means HAVE_CURRENT_DATA or better)
    if (video.readyState >= 2) {
      resolve()
      return
    }
    
    const timeoutId = setTimeout(() => {
      video.removeEventListener('loadeddata', onReady)
      reject(new Error(`Video data timeout after ${timeoutMs}ms`))
    }, timeoutMs)
    
    const onReady = () => {
      clearTimeout(timeoutId)
      video.removeEventListener('loadeddata', onReady)
      resolve()
    }
    
    video.addEventListener('loadeddata', onReady, { once: true })
  })
}

/**
 * Wait for next animation frame (ensures frame decode)
 */
export const waitForNextFrame = (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

/**
 * Wait for video frame to actually be drawable
 * This is THE PROPER WAY - verify the frame can actually be drawn
 * @param video - The video element  
 * @param canvas - A canvas to test drawing on
 * @param timeoutMs - Safety timeout (default 2000ms)
 */
// Small offscreen canvas reused across calls to avoid per-poll allocation
const probeCanvas = document.createElement('canvas')
probeCanvas.width = 10
probeCanvas.height = 10
const probeCtx = probeCanvas.getContext('2d', { willReadFrequently: true })

export const waitForVideoFrameReady = (
  video: HTMLVideoElement,
  _canvas?: HTMLCanvasElement,
  timeoutMs: number = 2000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const checkFrame = () => {
      if (probeCtx) {
        probeCtx.clearRect(0, 0, 10, 10)
        probeCtx.drawImage(video, 0, 0, 10, 10)
        const imageData = probeCtx.getImageData(0, 0, 10, 10)
        const hasPixels = imageData.data.some((val, idx) => idx % 4 !== 3 && val !== 0)

        if (hasPixels) {
          resolve()
          return
        }
      }

      if (Date.now() - startTime > timeoutMs) {
        reject(new Error('Video frame ready timeout - frame never became drawable'))
        return
      }

      requestAnimationFrame(checkFrame)
    }

    requestAnimationFrame(checkFrame)
  })
}

/**
 * Pause video and wait for pause event
 * @param video - The video element
 * @param timeoutMs - Safety timeout (default 1000ms)
 */
export const pauseVideo = (
  video: HTMLVideoElement,
  timeoutMs: number = 1000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (video.paused) {
      resolve()
      return
    }
    
    const timeoutId = setTimeout(() => {
      video.removeEventListener('pause', onPause)
      reject(new Error('Pause timeout'))
    }, timeoutMs)
    
    const onPause = () => {
      clearTimeout(timeoutId)
      video.removeEventListener('pause', onPause)
      resolve()
    }
    
    video.addEventListener('pause', onPause, { once: true })
    video.pause()
  })
}

/**
 * Play video and wait for play event
 * @param video - The video element
 * @param timeoutMs - Safety timeout (default 1000ms)
 */
export const playVideo = (
  video: HTMLVideoElement,
  timeoutMs: number = 1000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!video.paused) {
      resolve()
      return
    }
    
    const timeoutId = setTimeout(() => {
      video.removeEventListener('play', onPlay)
      reject(new Error('Play timeout'))
    }, timeoutMs)
    
    const onPlay = () => {
      clearTimeout(timeoutId)
      video.removeEventListener('play', onPlay)
      resolve()
    }
    
    video.addEventListener('play', onPlay, { once: true })
    video.play().catch(reject)
  })
}
