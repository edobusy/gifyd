# Console Warning Fix - willReadFrequently

## The Warning
```
Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true.
```

## Root Cause
The warning appeared because the canvas context was being retrieved in multiple places, and not all of them specified the `willReadFrequently: true` optimization hint.

### What is `willReadFrequently`?
When you create a 2D canvas context with `willReadFrequently: true`, the browser optimizes the canvas for frequent `getImageData()` operations. Without this flag, the browser assumes you're primarily drawing to the canvas, not reading from it.

In Gifyd's case, we frequently call `getImageData()` to:
1. Apply filters to video frames
2. Check if frames are ready/drawable
3. Process pixel data for effects

## Locations Where Context Was Retrieved

### ✅ Already Correct
```typescript
// App.tsx - useEffect for setting ctx state
useEffect(() => {
  if (canvasRef.current) {
    setCtx(canvasRef.current.getContext("2d", { willReadFrequently: true }))
  }
}, [canvasRef.current])
```

### ❌ Missing the Flag (Fixed)

1. **`paintCanvasAtCurrentTime` function** (App.tsx, line ~339)
   ```typescript
   // BEFORE:
   const currentCtx = canvas?.getContext("2d")
   
   // AFTER:
   // Now uses the stored ctx that already has willReadFrequently set
   if (!ctx || !video || !canvas) { ... }
   ```

2. **`waitForVideoFrameReady` helper** (videoHelpers.ts, line ~106)
   ```typescript
   // BEFORE:
   const ctx = canvas.getContext('2d')
   
   // AFTER:
   const ctx = canvas.getContext('2d', { willReadFrequently: true })
   ```

## Solution Approach

### Strategy 1: Use the Stored Context (App.tsx)
Instead of calling `getContext()` again in `paintCanvasAtCurrentTime`, we now use the `ctx` state variable that was already created with the proper optimization flag.

**Benefits:**
- Avoids redundant context retrieval
- Ensures consistent context configuration
- Better performance (no need to retrieve context multiple times)

### Strategy 2: Add the Flag (videoHelpers.ts)
For the utility function `waitForVideoFrameReady` that needs to temporarily retrieve the context, we added the `{ willReadFrequently: true }` flag.

**Why this is needed:**
- The function performs `getImageData()` operations to test if frames are drawable
- It's a utility function that doesn't have access to the stored context
- Adding the flag ensures optimal performance even for temporary context usage

## Performance Impact

### Before Fix
- Browser would show console warning
- Potential performance degradation when reading pixel data
- Inefficient GPU↔CPU data transfers

### After Fix
- No console warnings
- Browser optimizes canvas memory layout for reading operations
- Faster `getImageData()` calls (especially important during animation)
- More efficient filter application

## Best Practices Applied

1. **Single Source of Truth**: The main context is created once with the optimization flag and stored in state
2. **Reuse Over Recreation**: Functions use the stored context instead of retrieving it again
3. **Consistent Configuration**: All context retrievals now use the same optimization flag
4. **Documentation**: The optimization choice is clear in the code

## Testing
After this fix:
1. ✅ No console warnings should appear
2. ✅ Filters should work as before
3. ✅ Preview animation should work smoothly
4. ✅ Frame readiness checks should function correctly

## Related to Framerate Feature
This fix complements the framerate preview feature because:
- The preview relies heavily on `getImageData()` for filter application
- Each frame drawn may involve multiple pixel data reads
- The optimization becomes more important as framerate increases (more frequent operations)
