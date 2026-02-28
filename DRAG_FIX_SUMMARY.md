# Drag Movement Fix - Summary

## Problem
Multi-note dragging was not working. The service was starting drag immediately on pointerdown and setting `isDragging.next(true)` without waiting for actual pointer movement.

## Root Cause
In `timeline-input.service.ts` `startDragMultiple()`:
- Drag state was marked `active: true` 
- `isDragging` observable was immediately set to `true`
- No movement threshold was enforced before DOM updates

This meant:
1. Clicking a note would mark it as dragging
2. `onDocumentPointerMove` would immediately try to update DOM styles
3. But the movement calculation would be 0 (no movement yet)
4. Notes would appear frozen or non-responsive

## Solution
Implemented a 3-pixel movement threshold:

1. **Service changes** (`timeline-input.service.ts`):
   - `startDragMultiple()` sets `dragState.active = true` but does NOT set `isDragging.next(true)`
   - Added new public method `setDragging(isDragging: boolean)` for component to call

2. **Component changes** (`Timeline.component.ts`):
   - In `onDocumentPointerMove()`, added movement threshold check:
     - If drag is initiated (`dragState.active`) but not yet "dragging" (`isDragging === false`)
     - Calculate distance moved: `sqrt(deltaX² + deltaY²)`
     - Only call `inputService.setDragging(true)` when distance > 3px
   - Added cursor feedback (`grabbing`) during actual drag

## Files Modified
- `src/app/services/timeline-input.service.ts` - Removed premature `isDragging.next(true)`, added `setDragging()` method
- `src/app/view/Timeline.component.ts` - Added movement threshold logic and cursor feedback

## Testing
- Build: ✅ Successful
- Expected behavior: Click and hold a note, move mouse > 3px → note follows cursor
- Multiple selection drag should now work properly

## Next Steps
Run the TESTING_GUIDE.md test cases to verify:
- Single note drag works
- Multi-note drag works  
- Resize still works
- Selection highlighting works
- No visual glitches

---
**Commit:** `717c145` - "Fix drag movement threshold - don't start DOM updates until pointer moves 3px"
