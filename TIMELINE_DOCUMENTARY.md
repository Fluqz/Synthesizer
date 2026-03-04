# Timeline Multi-Selection Implementation - Documentary Handoff

> A comprehensive guide to the current state of the timeline drag/select/resize system for new developers

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Current Status](#current-status)
4. [Known Issues](#known-issues)
5. [How It Works](#how-it-works)
6. [Testing Guide](#testing-guide)
7. [Debugging Guide](#debugging-guide)
8. [Next Steps](#next-steps)

---

## Overview

### What Is This?
The timeline is a DAW-like (Digital Audio Workstation) interface where users can:
- Click notes to select them
- Drag notes horizontally to move them in time
- Resize notes by dragging their start/end handles
- Multi-select notes using Ctrl+Click and Shift+Click
- Open note controls (for editing parameters) by clicking without dragging

### Where Is It?
- **Component**: `src/app/view/Timeline.component.ts` (~1450 lines)
- **Services**: `src/app/services/timeline-*.service.ts` (4 files, ~800 lines total)
- **Tests**: `TESTING_GUIDE.md` (comprehensive manual test scenarios)

### Development Timeline
This feature has been under development across multiple threads with focus on:
1. **Phase 0**: Basic drag/resize mechanics
2. **Phase 1**: Multi-selection and service architecture
3. **Current**: Debugging note controls opening and drag threshold detection

---

## Architecture

### Service-Based Design

The timeline uses **4 independent services**, each injected at the **component level** (not global):

```typescript
@Component({
  providers: [
    TimelineStateService,      // Manages selection state & clipboard
    TimelineInputService,       // Handles drag/resize mechanics
    TimelineSelectionService,   // Manages rectangular selection box
    TimelineKeyboardService,    // Handles keyboard shortcuts
  ]
})
export class TimelineComponent { }
```

This per-component injection is **critical** for supporting multiple timeline instances (e.g., multiple sequencers) without cross-contamination.

### 1. TimelineStateService
**Purpose**: Selection & clipboard management

**Key Methods**:
- `selectNote(id, clearOthers)` - Single select
- `toggleSelectNote(id)` - Ctrl+click toggle
- `selectNote(id, false)` - Shift+click (add to selection)
- `selectAll()` - Select all notes
- `clearSelection()` - Deselect all
- `copy() / paste()` - Clipboard operations

**Observable Streams**:
- `selectedNoteIds$: Observable<Set<number>>` - Currently selected note IDs
- `clipboard$: Observable<ClipboardData | null>` - Copied notes

### 2. TimelineInputService
**Purpose**: Drag and resize mechanics

**Key Methods**:
- `startDragMultiple(noteIds, event)` - Initiate multi-note drag
- `startResize(noteId, handle, event)` - Initiate single note resize
- `startResizeMultiple(noteIds, handle, event)` - Multi-note resize
- `updateDrag(event)` - Calculate new positions during drag
- `endDrag(event)` - Commit changes to sequencer
- `setDragging(boolean)` - Activate/deactivate drag mode (set by component after threshold)

**Observable Streams**:
- `dragState$: Observable<DragState>` - Current drag state
- `isDragging$: Observable<boolean>` - Whether actual drag is in progress

**Critical Detail**: There are TWO drag states:
1. **dragState.active = true**: Drag initiated, awaiting movement threshold (3px)
2. **isDragging = true**: Movement exceeded 3px, actually dragging (component sets this)

### 3. TimelineSelectionService
**Purpose**: Rectangular "lasso" selection

**Key Methods**:
- `startDragSelection(event)` - Start rectangular selection
- `updateDragSelection(event)` - Update selection box
- `endDragSelection(event)` - Return selected note IDs

**Observable Streams**:
- `selectionBox$: Observable<SelectionBox>` - Visual rect position/size
- `isDragSelecting$: Observable<boolean>` - Currently selecting

### 4. TimelineKeyboardService
**Purpose**: Keyboard shortcuts

**Shortcuts Implemented**:
- Ctrl+C / Cmd+C - Copy
- Ctrl+V / Cmd+V - Paste
- Ctrl+A / Cmd+A - Select all
- Delete / Backspace - Delete selected
- Escape - Clear selection

---

## Current Status

### ✅ Working Features
- ✓ Single-click selection
- ✓ Ctrl+Click toggle selection
- ✓ Shift+Click add individual notes (not range)
- ✓ Note drag (single & multi)
- ✓ Note resize (single & multi with handles)
- ✓ Rectangular "lasso" selection
- ✓ Copy/Paste
- ✓ Delete with confirmation
- ✓ Keyboard shortcuts
- ✓ Undo/Redo integration

### 🟡 Partially Working
- ⚠ Note controls opening (should only open on pure clicks, not drags)

### 🔴 Known Issues

#### Issue #1: Note Controls Opening On Drag
**Symptom**: Clicking and dragging a note opens the note-controls panel
**Expected**: Controls should only open if you click and release WITHOUT dragging (3px threshold)
**Status**: Being debugged with `dragWasActivated` flag

**The Flow (Current Implementation)**:
1. **onPointerDown** (click): 
   - Clear `_clickedSequenceObjectID = null` (prevent controls opening)
   - Reset `dragWasActivated = false` for new operation
   - Call `startDragMultiple()` (sets dragState.active=true, isDragging stays false)

2. **onPointerMove** (move mouse):
   - Check if `dragState.active && !isDragging`
   - Calculate distance from start
   - If distance > 3px: Set `dragWasActivated = true` and `isDragging = true`
   - Update DOM with new positions

3. **onPointerUp** (release):
   - Call `endDrag()` 
   - Check: `if (noteElement && !this.dragWasActivated)` → Open controls
   - Clear `dragWasActivated = false` for next operation

**Debug Logs Added**:
- `📊 Threshold check:` - Logs dragState, isDragging, distance
- `🔥 THRESHOLD MET!` - Logs when distance > 3px and dragWasActivated is set
- `📌 onDocumentPointerUp note element check:` - Logs element check and dragWasActivated value

**Hypothesis**: The threshold check might not be executing, or `dragWasActivated` flag is not being set/read correctly

---

## How It Works

### Selection Flow

```
User clicks note
    ↓
onTimelineClick() routes to selection logic
    ↓
TimelineStateService.selectNote() / toggleSelectNote() / etc.
    ↓
Observable selectedNoteIds$ emits new Set
    ↓
Component template updates (ngIf *ngFor with [isSelected])
    ↓
Note gets .selected CSS class (green highlight)
```

### Drag Flow (Multi-Select Example)

```
User clicks note A → selected
User Shift+clicks note B → selected (A + B now selected)
User clicks and drags note B
    ↓
onTimelineClick() detects previous selection
    ↓
startDragMultiple([A, B], event) - Sets dragState.active=true, isDragging=false
    ↓
onPointerMove() - Distance = 0px initially
    ↓
(After 3px+ movement) Distance > 3px
    ↓
setDragging(true) - Sets isDragging observable
    ↓
onPointerMove() continues updating positions
    ↓
DOM styles updated directly (left, width) for smooth visual feedback
    ↓
User releases mouse
    ↓
onPointerUp() calls endDrag()
    ↓
endDrag() calculates final positions and calls sequencer.updateNote()
    ↓
Notes committed to sequencer with new time values
    ↓
Change detection triggers, component re-renders from sequencer state
```

### Note Controls Opening Flow

```
User clicks note (no drag)
    ↓
onTimelineClick() → dragWasActivated = false
    ↓
onPointerMove() 
    - If distance < 3px: return (don't enter threshold block)
    - dragWasActivated stays false
    ↓
onPointerUp() 
    - endDrag() returns success=false (no movement)
    - dragWasActivated is false
    - condition: noteElement && !dragWasActivated → TRUE
    - Sets _clickedSequenceObjectID = noteId
    ↓
Template detects _clickedSequenceObjectID and shows note-controls
```

---

## Testing Guide

### Quick Smoke Test (2 minutes)
```
1. Click a note → should highlight (green)
2. Ctrl+Click another note → both should be highlighted
3. Shift+Click a third note → all three should be highlighted
4. Click and release a note quickly → controls should appear
5. Click and drag a note → controls should NOT appear, note should move
6. Resize a note by dragging handle → note should grow/shrink
7. Select multiple notes → Ctrl+C → Ctrl+V → notes should paste at next bar
```

### Debug Test for Note Controls Issue
```
1. Open browser console (F12)
2. Click and drag a note slowly while watching console
3. Look for these logs:
   - "👆 Single click new selection" - selection logic
   - "📊 Threshold check:" - threshold detection
   - "🔥 THRESHOLD MET!" - when 3px exceeded
   - "📌 onDocumentPointerUp note element check:" - final decision
   - "💬 onDocumentPointerUp: Opening controls for note:" or "NOT opening controls"
4. Verify dragWasActivated changes from false to true when you exceed 3px
```

### Full Test Scenarios
See `TESTING_GUIDE.md` for 20+ detailed scenarios covering:
- All selection methods
- All drag scenarios
- Resize operations
- Copy/paste
- Delete
- Keyboard shortcuts
- Edge cases

---

## Debugging Guide

### If Notes Won't Move
1. Check `TimelineInputService.startDragMultiple()` is called
2. Verify `sequencer.updateNote()` is being called in `endDrag()`
3. Check that `dragState.active = true`
4. Look for error logs in browser console

### If Selection Highlighting Not Showing
1. Verify `.selected` CSS class is defined (should be green highlight)
2. Check if `selectedNoteIds$` observable is emitting values
3. Look at template: `[isSelected]="(selectedNoteIds$ | async)?.has(note.id)"`
4. Verify note component is applying the class

### If Note Controls Won't Open
1. Check dragWasActivated logs in console
2. Verify `_clickedSequenceObjectID` is being set
3. Check if note-controls component is visible in DOM
4. Look for CSS z-index issues (controls might be hidden behind other elements)

### For Threshold Detection Issues
Add this to `onPointerMove()` for detailed logs:
```typescript
console.log('Distance:', distance.toFixed(2), 'Exceeds 3px?', distance > 3, 'dragWasActivated:', this.dragWasActivated);
```

---

## Next Steps

### Immediate (Next Session)
1. **Debug Note Controls Issue**
   - Run debug test (above)
   - Verify threshold logs show distance > 3px
   - Check if `dragWasActivated` flag is actually being set
   - Trace through onPointerUp to see where the logic fails

2. **Fix Identified Issues**
   - May need to check event.target on pointerUp
   - May need to verify dragWasActivated is not being reset unexpectedly
   - May need to review when _clickedSequenceObjectID is being cleared

### Medium Term
1. **Comprehensive Testing**
   - Run full TESTING_GUIDE.md checklist
   - Test with multiple sequencer instances
   - Test edge cases (boundary notes, many notes)

2. **Visual Polish**
   - Verify all CSS classes apply correctly
   - Check z-index and pointer-events
   - Add visual feedback for drag in progress

3. **Performance**
   - Test with 50+ notes
   - Profile drag/resize responsiveness
   - Optimize change detection if needed

### Code Quality
1. Remove debug console logs once issues are resolved
2. Add unit tests for services
3. Add integration tests for complete workflows
4. Document edge cases in code comments

---

## Key Technical Decisions

### 1. Per-Component Service Injection
**Why**: Allows multiple timeline instances (e.g., different sequencers) to have independent state without cross-contamination.

**Important**: Do NOT change `@Injectable()` back to `providedIn: 'root'` - this will break multi-sequencer isolation.

### 2. Two-Stage Drag Detection
- **Stage 1** (dragState.active): Pointer down, waiting to see if user drags
- **Stage 2** (isDragging): User moved 3px+, actually dragging

**Why**: Distinguish between clicks (should open controls) and drags (should move notes)

### 3. Direct DOM Updates During Drag
During drag, styles are updated directly on note elements:
```typescript
noteElement.style.left = newLeft + 'px';
noteElement.style.width = newWidth + 'px';
```

**Why**: Smooth visual feedback without waiting for change detection cycles
**When Cleaned**: After pointerup, when drag ends and data is committed

### 4. Observable-Driven Architecture
All state changes flow through RxJS observables:
- Selection changes → selectedNoteIds$ emits
- Drag state changes → dragState$ emits
- Template subscribes with `async` pipe

**Why**: Reactive, decoupled, testable architecture

---

## Files at a Glance

| File | Lines | Purpose |
|------|-------|---------|
| `Timeline.component.ts` | ~1450 | Main component, event handlers, DOM updates |
| `timeline-state.service.ts` | ~250 | Selection & clipboard management |
| `timeline-input.service.ts` | ~380 | Drag & resize mechanics |
| `timeline-selection.service.ts` | ~170 | Rectangular selection box |
| `timeline-keyboard.service.ts` | ~140 | Keyboard shortcuts |
| `TESTING_GUIDE.md` | - | 20+ manual test scenarios |
| `THREAD_HANDOFF.md` | - | Previous phase handoff |
| `QUICK_REFERENCE.md` | - | Keyboard shortcuts & quick test |

---

## Common Console Logs (For Debugging)

When testing, watch for these console messages:

**Selection**:
- `👆 Single click new selection: [id]`
- `👆 Ctrl+Click toggle: [id]`
- `⬆️ Shift+Click add to selection: [id]`

**Drag/Resize**:
- `🟢 startDragMultiple: {noteIds: [...], ...}`
- `📍 updateDrag (MOVE): {deltaX: ..., ...}`
- `✅ endDrag: committing changes {dragType: 'move', ...}`

**Threshold Detection** (NEW):
- `📊 Threshold check: {dragStateActive: true, distance: 5.23, ...}`
- `🔥 THRESHOLD MET! Setting dragWasActivated = true`

**Controls Opening Decision**:
- `📌 onDocumentPointerUp note element check: {hasNoteElement: true, dragWasActivated: false}`
- `📋 onDocumentPointerUp: Opening controls for note: 3` (or NOT opening)

---

## Resources

- **This file**: Complete architecture and debugging guide
- `THREAD_HANDOFF.md`: Previous phase summary and context
- `TESTING_GUIDE.md`: Detailed test scenarios
- `QUICK_REFERENCE.md`: Keyboard shortcuts and 7-item quick test
- `DEBUG_GUIDE.md`: Specific debugging strategies

---

**Status**: In active development
**Last Updated**: March 4, 2026
**Main Issue**: Note controls opening on drag (being debugged with dragWasActivated flag)
