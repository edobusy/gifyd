# GIF Length Preservation Fix

## The Problem
When users navigated back from the GIF result view to the editor, the "GIF Length" parameter was being reset to the default 1 second (1000ms), losing the user's customized duration setting.

### User Experience Impact
1. User sets GIF length to 3 seconds
2. User creates GIF and views result
3. User clicks "Back" to return to editor
4. **BUG**: GIF length is now reset to 1 second instead of 3 seconds
5. User has to re-adjust the duration slider

## Root Cause Analysis

### The Flow
When navigating back from GIF result:

1. **GifResult component**: User clicks "Back" button
   ```typescript
   handleClick: () => {
     setGifUrl("")  // Clear the GIF URL
   }
   ```

2. **App component**: `gifUrl` change triggers effects
   ```typescript
   useEffect(() => {
     if (gifUrl) {
       setVideoIsReady(false)  // Reset video ready state
       return
     }
     // ... reinitialize video when gifUrl is cleared
   }, [gifUrl, ...])
   ```

3. **Video reinitialization**: Video needs to be "ready" again
   - The video element triggers its `onLoadedData` event
   - This calls the `videoReady` function

4. **The Bug**: `videoReady` function unconditionally resets duration
   ```typescript
   // BEFORE (line 694):
   setDuration(minimumDuration)  // Always resets to 1000ms
   ```

### Why This Happens
The `videoReady` function was originally designed for the **initial video upload** scenario, where resetting to `minimumDuration` makes sense. However, this function is also called when **returning from the GIF result view**, where the user's duration preference should be preserved.

## The Solution

### Implementation
Modified the `videoReady` function to only reset duration if it's still at the default value:

```typescript
// Only reset duration if it's still at the default minimum
// This preserves user's duration choice when returning from GIF result
if (duration === minimumDuration) {
  setDuration(minimumDuration)
}
```

### How It Works

**Scenario 1: Initial Video Upload**
- `duration` starts at `minimumDuration` (1000ms)
- Condition `duration === minimumDuration` is `true`
- Duration is set to minimum (no change)
- ✅ Correct behavior

**Scenario 2: User Changed Duration, Then Returned from GIF**
- User set `duration` to 3000ms
- User created GIF and clicked "Back"
- `videoReady` is called
- Condition `duration === minimumDuration` is `false` (3000 !== 1000)
- Duration is NOT changed
- ✅ User's 3000ms preference is preserved

**Scenario 3: User Kept Default, Created GIF, Returned**
- User kept `duration` at 1000ms
- User created GIF and clicked "Back"
- `videoReady` is called
- Condition `duration === minimumDuration` is `true` (1000 === 1000)
- Duration is set to minimum (no change)
- ✅ Default is maintained

## Alternative Approaches Considered

### 1. Using a Ref to Track "Has Been Modified"
```typescript
const durationModified = useRef(false)

// In EditOptions onChange:
onChange={(e) => {
  durationModified.current = true
  setDuration(parseFloat(e.target.value))
}}

// In videoReady:
if (!durationModified.current) {
  setDuration(minimumDuration)
}
```
**Rejected**: More complex, requires additional state tracking

### 2. Separate "Initial Load" from "Reinitialize"
```typescript
const videoReady = async (isInitialLoad = true) => {
  // ...
  if (isInitialLoad) {
    setDuration(minimumDuration)
  }
}
```
**Rejected**: Requires tracking when the function is called and passing parameters

### 3. Store Previous Duration Before GIF Creation
```typescript
const previousDuration = useRef(duration)

const makeGif = async () => {
  previousDuration.current = duration
  // ... gif creation
}

// In videoReady:
setDuration(previousDuration.current || minimumDuration)
```
**Rejected**: Unnecessary complexity, stores redundant state

### 4. Check Current Duration Value (Selected Solution)
```typescript
if (duration === minimumDuration) {
  setDuration(minimumDuration)
}
```
**Selected**: Simplest, no extra state, logically sound

## Design Philosophy

This solution follows the principle: **"Don't reset what the user has intentionally changed."**

The check `duration === minimumDuration` effectively answers: *"Did the user customize this value?"*
- If `duration` is still at default → User hasn't customized it → Safe to reset
- If `duration` differs from default → User customized it → Preserve their choice

## Testing Scenarios

### Test 1: Initial Upload
1. Upload video
2. Verify duration is 1 second
3. ✅ Pass

### Test 2: Custom Duration Preserved
1. Upload video
2. Set duration to 2.5 seconds
3. Create GIF
4. Click "Back"
5. Verify duration is still 2.5 seconds
6. ✅ Pass

### Test 3: Default Duration After GIF
1. Upload video
2. Keep duration at 1 second
3. Create GIF
4. Click "Back"
5. Verify duration is 1 second
6. ✅ Pass

### Test 4: Multiple Round Trips
1. Upload video
2. Set duration to 3 seconds
3. Create GIF
4. Go back
5. Verify duration is 3 seconds
6. Set duration to 2 seconds
7. Create another GIF
8. Go back
9. Verify duration is 2 seconds
10. ✅ Pass

## Related Parameters

Other parameters that ARE preserved correctly (for reference):
- ✅ `startTime` - Not reset in `videoReady`
- ✅ `framerate` - Not reset in `videoReady`
- ✅ Filter settings (`rgbaMod`, `rgbShift`, `levels`) - Not reset
- ✅ Text options - Not reset (even uses `fontSizeRef` for preservation)

The `duration` was the only parameter being unconditionally reset, which is now fixed.

## Files Modified
- `src/App.tsx`: Modified `videoReady` function (line ~694)
  - Added conditional check before resetting duration
  - Added explanatory comment
