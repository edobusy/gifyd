# Framerate Preview Fix - Implementation Summary

## Problem Statement
The framerate range input only affected the final GIF output but did not change the preview animation on the canvas. Users would see the video playing at its native framerate (typically 24-30fps) in the preview, but the final GIF would respect their chosen framerate setting (1-30fps), creating a mismatch between preview and output.

## Root Cause
The `startDrawingFrames` function used `requestVideoFrameCallback` which triggers on every video frame, playing back at the video's native framerate. The user's `framerate` setting was only passed to FFmpeg during GIF creation (`transcode` function) and had no effect on the preview animation.

## Solution Implementation

### Event-Driven Framerate Throttling
Modified the `startDrawingFrames` function to respect the user's framerate setting:

1. **Frame Interval Calculation**
   - Calculate target frame interval: `frameInterval = 1000 / framerate` (milliseconds per frame)
   - Track the last frame render time using `lastFrameTime`

2. **Throttled Frame Processing**
   - Modified `processFrame` to accept a timestamp parameter from `requestVideoFrameCallback`
   - Before drawing each frame, check if enough time has elapsed since the last frame
   - Only draw when `elapsed >= frameInterval`, otherwise skip and schedule next check
   - This creates a throttling effect that matches the user's desired framerate

3. **Fallback Path**
   - For browsers without `requestVideoFrameCallback` support
   - Changed the `setInterval` to use `frameInterval` directly instead of hardcoded `1000/30`
   - This ensures consistent behavior across both code paths

### Real-Time Preview Updates
Added a new `useEffect` hook that listens for framerate changes:

```typescript
useEffect(() => {
  // Only restart if video is currently playing
  if (!vidRef.current || vidRef.current.paused || !showFrame) return

  // Stop the current animation
  showFrame.stop()
  setShowFrame(null)

  // Restart with new framerate
  if (ctx) {
    const frameController = startDrawingFrames(ctx, vidRef, drawFrame)
    setShowFrame(frameController)
  }
}, [framerate])
```

**Behavior:**
- When the user adjusts the framerate slider while video is playing, the effect immediately:
  1. Stops the current frame drawing loop
  2. Clears the frame controller
  3. Starts a new frame drawing loop with the updated framerate
- This provides instant visual feedback of the framerate change

## Technical Details

### Key Changes in `startDrawingFrames`

**Before:**
```typescript
const processFrame = () => {
  // ... draw frame immediately on every callback
  callbackId = vidRef.current.requestVideoFrameCallback(processFrame)
}
```

**After:**
```typescript
const frameInterval = 1000 / framerate
let lastFrameTime = 0

const processFrame = (now?: number) => {
  if (now !== undefined && !oneIteration) {
    const elapsed = now - lastFrameTime
    if (elapsed < frameInterval) {
      // Skip this frame, not enough time passed
      callbackId = vidRef.current.requestVideoFrameCallback(processFrame)
      return
    }
    lastFrameTime = now
  }
  // ... draw frame only when interval met
  callbackId = vidRef.current.requestVideoFrameCallback(processFrame)
}
```

### Event-Driven Design Benefits

1. **Accurate Timing**: Uses browser's high-resolution timestamps (`performance.now()` via `requestVideoFrameCallback`)
2. **No Hardcoded Values**: Framerate is dynamically calculated based on user input
3. **Immediate Feedback**: Changes take effect instantly while video is playing
4. **Consistent Behavior**: Same framerate logic for preview and final GIF output
5. **Smooth Operation**: Doesn't interfere with existing filter/paint operations

## Testing Recommendations

1. **Low Framerate Test** (1-5 fps):
   - Should see very choppy, slide-show like animation
   - Each frame should be clearly visible

2. **Medium Framerate Test** (10-15 fps):
   - Should see somewhat smooth but still noticeably stuttered animation
   - Good balance between file size and smoothness

3. **High Framerate Test** (25-30 fps):
   - Should see smooth, fluid animation
   - Close to original video playback

4. **Real-Time Adjustment Test**:
   - Play the video
   - Adjust framerate slider while playing
   - Animation should immediately reflect the change

5. **Paused State Test**:
   - Pause the video
   - Change framerate
   - Resume playback
   - Should use new framerate

## Files Modified

- `src/App.tsx`:
  - Modified `startDrawingFrames` function to implement framerate throttling
  - Added `useEffect` hook to restart animation when framerate changes
  - Updated fallback interval calculation

## Backward Compatibility

- All existing functionality preserved
- No breaking changes to component interfaces
- Filter operations remain unchanged
- GIF creation process unchanged (already used framerate correctly)
