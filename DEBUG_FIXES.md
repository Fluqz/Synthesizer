# Debug Fixes - Issues Found & Solutions

## Issues Identified

### 1. ❌ Selection Affects All Sequencers
**Problem:** When you select a note in sequencer 1, it also selects the same ID in sequencer 2
**Root Cause:** Services are global singletons, selection not scoped per-sequencer
**Solution:** Make services per-sequencer or add sequencer ID to selection state

### 2. ❌ Drag/Resize Not Working
**Problem:** Can't drag or resize notes, no visual feedback
**Root Causes:**
- Drag state updates but DOM not updating visually during drag
- Changes not committing to sequencer
- Visual updates not triggering change detection

**Solution:** 
- Update DOM inline during drag (no change detection needed)
- Commit to sequencer on pointerup
- Trigger change detection at end

### 3. ❌ Selection Highlight Not Visible
**Problem:** Selected notes don't show green highlight
**Root Causes:**
- CSS class `.selected` may not be applying
- Parent elements might have pointer-events: none
- Observable async pipe might have timing issues

**Solution:**
- Ensure CSS class applies properly
- Check pointer-events blocking
- Debug observable subscription

### 4. ❌ Rectangular Selection Box Not Showing
**Problem:** When dragging on empty timeline, no rectangle appears
**Root Causes:**
- `timeline-selection-overlay` has pointer-events: none (correct for performance)
- But the overlay element might not be capturing the drag events properly
- Service might not be initializing drag selection

**Solution:**
- Ensure startDragSelection is being called
- Add console logs to debug
- Check if overlay CSS is correct

---

## Fix Priority

1. **HIGH** - Drag/resize not working (core functionality broken)
2. **HIGH** - Selection visible (visual feedback)
3. **MEDIUM** - Multi-sequencer selection (edge case, needs architecture)
4. **MEDIUM** - Rectangle showing (visual feedback)

---

## Detailed Investigation

### Issue 1: Multi-Sequencer Selection
Currently: Global service + global BehaviorSubject
```typescript
// timeline-state.service.ts
private selectedNoteIds = new BehaviorSubject<Set<number>>(new Set());
```

Problem: Note ID 1 in Sequencer A is same as Note ID 1 in Sequencer B

**Fix Options:**
A) Scope selection per sequencer (add sequencerId to service)
B) Make services non-singleton (provide per component)  
C) Change selection to include sequencerId + noteId tuple

**Recommended:** Option B - Make services non-singleton
```typescript
// In Timeline.component.ts decorator
@Component({
  ...
  providers: [
    TimelineStateService,     // Not in root, provided here
    TimelineInputService,
    TimelineSelectionService,
    TimelineKeyboardService,
  ]
})
```

### Issue 2: Drag/Resize Not Working
Currently: updateDrag() returns positions but they're not applied to DOM

**Missing:**
1. Visual feedback during drag (update note element inline)
2. Commit to sequencer on end (currently calling service, but maybe not working)
3. Change detection trigger

**Fix Required:**
```typescript
// In onDocumentPointerMove
if (this.inputService.isCurrentlyDragging()) {
  const update = this.inputService.updateDrag(e);
  
  // NEW: Apply DOM updates for smooth visual feedback
  if (update.isValid) {
    for (const [noteId, position] of update.positions) {
      const noteElement = this.timeline.querySelector(
        `[data-note-id="${noteId}"]`
      );
      if (noteElement) {
        const noteX = (position.time / this._bars) * this.timelineRect.width;
        const noteWidth = (position.length / this._bars) * this.timelineRect.width;
        
        (noteElement as HTMLElement).style.left = noteX + 'px';
        (noteElement as HTMLElement).style.width = noteWidth + 'px';
      }
    }
  }
}
```

### Issue 3: Selection Not Visible
The `.note.selected` class should apply when `isSelected` binding is true

**Debug:**
1. Check if observable is emitting
2. Check if CSS class applies
3. Check if parent elements block it

**Likely issue:** Observable timing - async pipe might not be updating fast enough

**Fix:** Use `markForCheck()` more aggressively

### Issue 4: Rectangle Not Showing
The selection overlay has `pointer-events: none` which is correct, but we need to ensure:
1. startDragSelection is called
2. updateDragSelection is called
3. Box coordinates are correct
4. CSS positioning works

**Debug steps:**
1. Add console.log in startDragSelection
2. Add console.log in updateDragSelection  
3. Check if selectionBox$ observable is emitting
4. Check overlay z-index and positioning

---

## Immediate Actions

1. **Make services per-component** (not singleton)
   - Add `providers: [TimelineStateService, TimelineInputService, ...]` to @Component
   - This fixes multi-sequencer selection

2. **Fix drag visual feedback**
   - Update DOM inline during drag
   - Apply changes to note element.style.left/width
   - Trigger markForCheck on end

3. **Debug selection visibility**
   - Add console.log when observable emits
   - Verify CSS class applies
   - Check if opacity/color works

4. **Debug rectangle**
   - Add console.log when selection starts/updates
   - Check CSS positioning
   - Verify z-index

---

## Testing After Fixes

1. Create multiple synthesizers
2. Select notes in each separately - should not affect other
3. Drag a note - should follow cursor smoothly
4. Resize a note - should work both handles
5. Rectangular select - green dashed box should appear
6. Copy/paste - should work with fixed services

EOF
cat /Users/hallodri/Cargo-A/dev/Synthesizer/DEBUG_FIXES.md
