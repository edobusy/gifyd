# GIF Creation Race Condition Fix

## The Problem

When users clicked "GIF it!" while the video preview was playing, two critical bugs could occur:

### Bug 1: First GIF Creation Fails
**Symptoms:**
- App gets stuck
- Console error: `Uncaught (in promise) Error: ffmpeg.FS('readFile', 'out.gif') error. Check if the path exists`
- No GIF is created

**Root Cause:**
- Video was playing when "GIF it!" was clicked
- `makeGif` called `vidRef.current.pause()` but didn't wait for it to complete
- The existing animation loop (`showFrame`) continued running
- Race condition between old animation and new recording process
- MediaRecorder didn't capture full duration
- Incomplete recording → FFmpeg transcoding produced invalid/no output
- FFmpeg tried to read 'out.gif' that doesn't exist or is corrupted

### Bug 2: Subsequent GIF Creation Shows Old GIF
**Symptoms:**
- User creates a GIF successfully
- Returns to editor, makes changes
- Clicks "GIF it!" while video is playing
- GIF creation appears to succeed instantly (too fast)
- Shows the OLD GIF, not the new one with changes

**Root Cause:**
- Same race condition as Bug 1
- Recording failed/incomplete, BUT `gifUrl` state still had the old GIF URL
- `setGifUrl()` was called with the old URL still in memory
- Old GIF was displayed instead of showing an error
- User thinks it worked but sees outdated result

## The Race Condition Explained

### What Was Happening (Before Fix)

```typescript
const makeGif = async () => {
  vidRef.current.pause()  // ❌ Doesn't wait! Returns immediately
  vidRef.current.currentTime = startTime / 1000  // ❌ Set while still playing
  
  await createVid()  // Starts recording
  // Meanwhile: old animation loop still running, interfering
}

function fn() {
  mediaRecorder.current.start()
  vidRef.current.play()  // ❌ Fights with old animation
  
  let frameController = startDrawingFrames(ctx, vidRef, drawFrame)
  setShowFrame(frameController)  // ❌ Now TWO animation loops competing!
}
```

### The Race Timeline

```
Time  | Old Animation Loop          | GIF Creation Process
------|----------------------------|----------------------------
T=0   | Playing video, drawing      | User clicks "GIF it!"
      | frames at framerate         |
T=1   |                             | pause() called (async)
T=2   | Still drawing frames!       | currentTime set to start
T=3   | Loop continues...           | fn() called, play() called
T=4   | Loop reaches duration end   | Recording starts
      | Calls checkIfOver()         |
      | Pauses video, seeks to start|
T=5   | **CONFLICT**: Two loops     | Drawing frames for recording
      | trying to control video     | MediaRecorder capturing
T=6   | Frames drawn at wrong times | Incomplete/corrupted capture
T=7   | Duration reached, stopped   | Recording stops too early
------|----------------------------|----------------------------
Result: Incomplete recording → FFmpeg fails → Error or old GIF shown
```

## The Solution

### Key Changes

#### 1. Stop Existing Animation First
```typescript
// CRITICAL: Properly stop any existing animation before starting GIF creation
if (showFrame) {
  showFrame.stop()
  setShowFrame(null)
}
```

**Why:** Ensures the old animation loop is completely stopped before starting the recording process.

#### 2. Event-Driven Pause
```typescript
// Wait for video to actually pause
try {
  await pauseVideo(vidRef.current)
} catch (error) {
  console.error("Error pausing video before GIF creation:", error)
}
```

**Why:** Uses the event-driven `pauseVideo` helper that waits for the 'pause' event, ensuring the video is actually paused before proceeding.

#### 3. Clear Old GIF URL
```typescript
// Clear the old GIF URL to ensure fresh creation
if (gifUrl) {
  URL.revokeObjectURL(gifUrl)
  setGifUrl("")
}
```

**Why:** 
- Revokes the old blob URL to free memory
- Clears the state so we can't accidentally show old GIF
- If recording fails, user won't see stale data

#### 4. Ensure Correct Start Position in Recording
```typescript
function fn() {
  return new Promise<{ url: string; blob: Blob } | null>(async (res, rej) => {
    // Ensure video is at the correct start position before recording
    try {
      await seekVideoToTime(vidRef.current, startTime / 1000)
    } catch (error) {
      console.error("Error seeking to start time:", error)
      return rej(error)
    }
    
    // Now start recording...
  })
}
```

**Why:** Double-checks that the video is exactly at the start position before beginning the recording, preventing timing issues.

#### 5. Better Error Handling
```typescript
// Changed from:
if (!canvasRef.current) return rej
if (!vidRef.current) return rej

// To:
if (!canvasRef.current) return rej(new Error("Canvas not available"))
if (!vidRef.current) return rej(new Error("Video not available"))
```

**Why:** Provides meaningful error messages for debugging if something goes wrong.

## Fixed Flow

### What Happens Now (After Fix)

```
Time  | State                        | Actions
------|------------------------------|----------------------------------
T=0   | Video playing               | User clicks "GIF it!"
T=1   | Animation loop stopped      | showFrame.stop() called
T=2   | Video pausing...            | pauseVideo() awaiting event
T=3   | ✅ Video PAUSED confirmed   | 'pause' event fired
T=4   | Position set                | currentTime = startTime
T=5   | Old GIF cleared             | gifUrl revoked and cleared
T=6   | fn() begins                 | Seeks to start position
T=7   | ✅ Seek confirmed           | 'seeked' event fired
T=8   | Recording starts            | MediaRecorder.start()
      | Video plays                 | play() called
      | NEW animation starts        | startDrawingFrames()
T=9   | Clean recording in progress | Single animation loop
      |                             | No interference
T=10  | Duration complete           | Recording stops naturally
T=11  | Transcode begins            | FFmpeg processes video
T=12  | ✅ GIF created              | New, correct GIF displayed
```

## Testing Scenarios

### Test 1: First GIF Creation While Playing ✅
1. Upload video
2. Click play
3. While playing, click "GIF it!"
4. **Expected**: Video pauses, GIF is created successfully
5. **Result**: ✅ Works correctly

### Test 2: Multiple GIF Creations While Playing ✅
1. Upload video
2. Create first GIF (while paused or playing)
3. Return to editor
4. Make changes (adjust filters, text, etc.)
5. Click play
6. While playing, click "GIF it!"
7. **Expected**: New GIF with changes is created
8. **Result**: ✅ Shows new GIF, not old one

### Test 3: GIF Creation While Paused ✅
1. Upload video
2. Keep video paused
3. Click "GIF it!"
4. **Expected**: Works as before
5. **Result**: ✅ No regression, works correctly

### Test 4: Rapid Clicks ✅
1. Upload video
2. Click "GIF it!" multiple times quickly
3. **Expected**: Button is disabled after first click
4. **Result**: ✅ `setDisablePlayPause(true)` prevents this

## Technical Deep Dive

### Why `vidRef.current.pause()` Wasn't Enough

The native `pause()` method is **fire-and-forget**:
```typescript
vidRef.current.pause()
// Returns immediately - doesn't wait for video to actually pause!
console.log(vidRef.current.paused)  // Might still be false!
```

The video element needs time to:
1. Stop the media pipeline
2. Cancel pending frames
3. Update internal state
4. Fire the 'pause' event

Our `pauseVideo` helper waits for the actual event:
```typescript
export const pauseVideo = (video: HTMLVideoElement): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (video.paused) {
      resolve()
      return
    }
    
    video.addEventListener('pause', () => resolve(), { once: true })
    video.pause()
  })
}
```

### Why We Stop `showFrame` First

The `showFrame` controller uses `requestVideoFrameCallback` to draw frames. Even after calling `pause()`, queued callbacks might still fire. By calling `showFrame.stop()` first, we:

1. Set the `stopped` flag
2. Cancel any pending `requestVideoFrameCallback`
3. Ensure no more frames will be drawn

This gives us a clean slate before starting the recording.

### Memory Management: Why We Revoke Old GIF URL

Blob URLs created with `URL.createObjectURL()` consume memory until revoked:

```typescript
// Before fix: potential memory leak
setGifUrl(URL.createObjectURL(newBlob))  // Old URL never revoked!

// After fix: proper cleanup
if (gifUrl) {
  URL.revokeObjectURL(gifUrl)  // Free old blob memory
  setGifUrl("")
}
const newGifUrl = URL.createObjectURL(newBlob)
setGifUrl(newGifUrl)
```

This prevents memory leaks if users create multiple GIFs in one session.

## Related Files Changed

### `src/App.tsx`

**`makeGif` function:**
- Added `showFrame` cleanup
- Added event-driven `pauseVideo` call
- Added old GIF URL cleanup
- Removed synchronous `pause()` call

**`fn` function:**
- Made Promise async
- Added `seekVideoToTime` verification
- Improved error messages
- Better error handling

## Edge Cases Handled

1. ✅ Video playing → pauses cleanly
2. ✅ Video already paused → no-op, continues
3. ✅ Animation running → stops completely
4. ✅ No animation running → safe to proceed
5. ✅ Old GIF exists → revoked and cleared
6. ✅ No old GIF → safe to proceed
7. ✅ Seek fails → rejects with error
8. ✅ Canvas unavailable → rejects with error
9. ✅ Video unavailable → rejects with error

## Performance Impact

**Minimal - actually improves performance:**
- Old animation loop consumed CPU cycles for nothing
- Stopping it frees resources for encoding
- Memory leak from old GIF URLs now fixed
- Recording process is cleaner and more reliable

## Prevention of Future Issues

The fix follows these principles:

1. **Event-Driven Operations**: Wait for actual events, don't assume
2. **Clean State**: Stop old processes before starting new ones
3. **Resource Management**: Revoke old URLs, clean up refs
4. **Defensive Programming**: Check state before proceeding
5. **Meaningful Errors**: Return descriptive error messages

These patterns prevent similar race conditions in future development.
