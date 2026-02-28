# Timeline & Note Component Refactor: Implementation Plan

## Overview
Refactor Timeline and Note components to fix input handling issues (dragging, clicking, resizing) and add multiselection, copy/paste functionality.

---

## Phase 1: Foundation & State Management

### 1.1 Create Selection & Clipboard State Service
**File:** `src/app/services/timeline-state.service.ts`

- **SelectionState interface**: Track selected notes (array of IDs)
- **ClipboardState interface**: Store copied notes with metadata
  - `notes: SequenceObject[]`
  - `sourceSequencerId: number` (preserve relationships)
  - `timingInfo: { startTime, endTime, duration }` (for intelligent pasting)
- **Methods:**
  - `selectNote(noteId)`
  - `toggleSelectNote(noteId)`
  - `selectMultiple(noteIds[])`
  - `clearSelection()`
  - `copyToClipboard(selectedNotes[])`
  - `pasteFromClipboard() → SequenceObject[]`
  - `deleteSelected()`
  - `getSelectedNotes() → SequenceObject[]`
- **Benefit:** Separates selection/clipboard logic from component logic

---

## Phase 1.5: Fix Event Handling Architecture (CRITICAL)

### Problem: Event Conflicts
**Current issues:**
- Note components have their own pointer handlers
- Timeline has separate pointer handlers
- Drag handles have their own handlers
- Events bubble up and multiple handlers fire simultaneously
- Race conditions between timeline drag and note drag
- Inconsistent event propagation stopping

**Current flow (broken):**
```
pointerdown on drag-handle
  → drag-handle handler fires
  → bubbles to note
  → note handler fires
  → bubbles to timeline
  → timeline handler fires
  ❌ Three different handlers trying to manage same drag state
```

### Solution: Centralized Event Handling at Timeline Level

**Use capture phase on Timeline to intercept ALL pointer events:**

```typescript
@Component({
  selector: 'sy-timeline',
  host: {
    '(pointerdown)': 'onTimelinePointerDown($event)',      // Capture all
    '(pointermove)': 'onTimelinePointerMove($event)',
    '(pointerup)': 'onTimelinePointerUp($event)',
    '(pointercancel)': 'onTimelinePointerCancel($event)',
  }
})
export class TimelineComponent {
  
  onTimelinePointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement
    
    // Determine what was clicked
    const dragHandle = target.closest('.drag-handle')
    const noteElement = target.closest('.note')
    const controlBtn = target.closest('.note-controls .btn')
    
    // IMPORTANT: Stop propagation immediately
    event.stopPropagation()
    event.preventDefault()  // Prevent browser defaults
    
    if (dragHandle) {
      // Resize handle clicked
      this.inputHandler.startResize(dragHandle, noteElement, event)
    } else if (controlBtn) {
      // Note control button - let it handle itself but don't drag
      this.inputHandler.clearDrag()
      return
    } else if (noteElement) {
      // Note body clicked - prepare for drag or select
      this.handleNoteSelection(noteElement, event)
      this.inputHandler.prepareDrag(noteElement, event)
    } else {
      // Timeline empty space
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
        this.timelineState.clearSelection()
      }
    }
  }
  
  onTimelinePointerMove(event: PointerEvent) {
    event.stopPropagation()
    this.inputHandler.updateDrag(event)
  }
  
  onTimelinePointerUp(event: PointerEvent) {
    event.stopPropagation()
    this.inputHandler.endDrag(event)
  }
  
  onTimelinePointerCancel(event: PointerEvent) {
    event.stopPropagation()
    this.inputHandler.cancelDrag()
  }
}
```

### Remove from Note Component:
- `(pointerdown)` handler
- `(pointerup)` handler
- All drag/resize logic
- Pointer event propagation management

### Remove from Drag Handle:
- `(pointerdown)` handler
- `(pointerup)` handler
- Event stop calls

**Result:**
```
pointerdown on drag-handle
  ↓
Timeline.onTimelinePointerDown captures event
  ↓
Identifies target is drag-handle
  ↓
Single handler: inputHandler.startResize()
  ✓ Single source of truth for drag state
```

---

## Phase 2: Input Handling Architecture

### 2.1 Create Unified Input Handler Service
**File:** `src/app/services/timeline-input.service.ts`

This service will manage all pointer/keyboard events:

**DragState2 interface (improved):**
```typescript
interface DragState {
  active: boolean
  type: 'move' | 'resize-start' | 'resize-end' | null
  selectedNoteIds: number[]          // Support multi-note drag
  startClientX: number
  startClientY: number
  originalPositions: Map<number, {time, length}>  // Track original state for all dragged notes
  handle: 0 | 1 | null                // 0 = start, 1 = end
  pixelsPerBar: number                // Cache this to avoid recalculation
  gridQuantize: number | null
}
```

**Methods:**
- `startDrag(noteId, event, handle?)`
- `updateDrag(event) → DragUpdate`
- `endDrag(event) → boolean` (returns whether changes were committed)
- `validateDragState() → boolean` (check if state is consistent)
- `rollbackDrag()` (discard changes)

**Key improvements:**
- Store original positions upfront to prevent reset issues
- Cache `pixelsPerBar` instead of recalculating
- Validate state transitions
- Return structured updates instead of mutating directly

---

## Phase 3: Timeline Component Refactor

### 3.1 Simplify Component Logic
**File:** `src/app/view/Timeline.component.ts` (refactored)

**Remove from component:**
- `dragState` ← Move to TimelineInputService
- `selectedNote`, `alteredSequenceObject`, `draggedNoteElement` ← Move to state service
- Direct DOM manipulation ← Move to input service

**Keep in component:**
- Render logic (grid, notes)
- Event delegation to handlers
- Change detection management
- Integration with sequencer

**New structure:**
```typescript
export class TimelineComponent implements OnChanges, OnDestroy {
  @Input() sequencer: Sequencer
  
  selection$ = this.timelineState.selectedNotes$  // Observable
  isDragging$ = this.inputHandler.isDragging$
  
  constructor(
    private timelineState: TimelineStateService,
    private inputHandler: TimelineInputService,
    private cdr: ChangeDetectorRef
  ) {}
  
  // Single unified pointer down handler
  onPointerDown(event: PointerEvent, noteId?: number) {
    if (noteId) {
      // Shift+Click: toggle selection
      // Ctrl+Click: add to selection
      // Click: single selection + potential drag
      this.handleNotePointerDown(event, noteId)
    } else {
      // Clicked on timeline empty space: clear selection
      this.handleTimelinePointerDown(event)
    }
  }
  
  // Use observables for state-driven rendering
  getSelectedNotes(): number[] {
    return this.timelineState.getSelectedNotes()
  }
  
  isNoteSelected(noteId: number): boolean {
    return this.timelineState.isNoteSelected(noteId)
  }
}
```

### 3.2 Fix Position Calculation Issues
**Problem:** Notes jump/reset because position is recalculated from sequencer data during drag

**Solution:**
- Store `originalPositions` map in DragState at drag start
- Never pull values from sequencer during drag
- Only read from `originalPositions` + delta calculations
- Commit to sequencer only on drag end

---

## Phase 4: Note Component Refactor

### 4.1 Simplify to Pure Presentation
**File:** `src/app/view/Note.component.ts` (refactored)

**Remove:**
- All pointer/drag handlers ← Move to Timeline
- Direct sequencer calls for updates
- Complex state logic

**Keep:**
- Display rendering (note name, octave)
- Visual styling based on @Input props
- ng-content for drag handles

**New inputs:**
```typescript
@Input() note: SequenceObject
@Input() isSelected: boolean
@Input() isDragging: boolean  // NEW
@Input() isResizing: boolean  // NEW
@Input() position: {x, y, width, height}  // NEW: use direct positioning
@Input() isPartOfMultiSelection: boolean  // NEW
```

**Benefit:** Component becomes stateless, easier to debug, no side effects

---

## Phase 5: Multi-Selection Implementation

### 5.1 Update Timeline with Selection Logic
**In Timeline.component.ts:**

```typescript
onTimelineClick(event: PointerEvent) {
  if (event.target === this.timelineElement) {
    // Clicked on empty space
    this.timelineState.clearSelection()
  }
}

notePointerDown(event: PointerEvent, noteId: number) {
  event.stopPropagation()
  
  if (event.ctrlKey || event.metaKey) {
    // Multi-select: toggle this note
    this.timelineState.toggleSelectNote(noteId)
  } else if (event.shiftKey) {
    // Range select: select all notes between first and last
    this.timelineState.selectRange(noteId)
  } else {
    // Single select
    this.timelineState.selectNote(noteId)
  }
  
  // Check if this is a drag or just selection
  const selectedNotes = this.timelineState.getSelectedNotes()
  if (selectedNotes.length > 0) {
    this.inputHandler.startDrag(selectedNotes, event)
  }
}
```

### 5.2 Handle Multi-Note Drag
**In TimelineInputService:**

```typescript
startDrag(noteIds: number[], event: PointerEvent) {
  // Store original positions for ALL selected notes
  const originalPositions = new Map()
  for (let noteId of noteIds) {
    const note = this.sequencer.sequence.find(n => n.id === noteId)
    if (note) {
      originalPositions.set(noteId, {
        time: note.time,
        length: note.length
      })
    }
  }
  
  this.dragState = {
    ...initialState,
    selectedNoteIds: noteIds,
    originalPositions
  }
}

updateDrag(event: PointerEvent): DragUpdate {
  const deltaX = event.clientX - this.dragState.startClientX
  const deltaInBars = deltaX / this.dragState.pixelsPerBar
  
  const updates = new Map()
  for (let [noteId, originalPos] of this.dragState.originalPositions) {
    updates.set(noteId, {
      time: originalPos.time + deltaInBars,
      length: originalPos.length
    })
  }
  
  return { updates, isValid: this.validatePositions(updates) }
}
```

---

## Phase 6: Copy/Paste Implementation

### 6.1 Clipboard Service Methods
**In TimelineStateService:**

```typescript
copySelected() {
  const selected = this.getSelectedNotes()
  if (selected.length === 0) return
  
  // Calculate relative positioning
  const minTime = Math.min(...selected.map(n => Tone.Time(n.time).toSeconds()))
  
  this.clipboard = {
    notes: selected.map(n => ({...n})),  // Deep copy
    sourceSequencerId: this.sequencer.id,
    timingInfo: {
      minTime,
      maxTime: Math.max(...selected.map(n => 
        Tone.Time(n.time).toSeconds() + Tone.Time(n.length).toSeconds()
      )),
      relativeTimes: selected.map(n => 
        Tone.Time(n.time).toSeconds() - minTime
      )
    }
  }
}

pasteAtTime(pasteTime: Tone.Unit.Time) {
  if (!this.clipboard || !this.clipboard.notes.length) return []
  
  const pasteTimeSeconds = Tone.Time(pasteTime).toSeconds()
  const timeDelta = pasteTimeSeconds - this.clipboard.timingInfo.minTime
  
  const newNotes = this.clipboard.notes.map(note => ({
    ...note,
    id: this.generateNewId(),
    time: Tone.Time(
      Tone.Time(note.time).toSeconds() + timeDelta,
      'seconds'
    )
  }))
  
  // Add to sequencer
  for (let note of newNotes) {
    this.sequencer.addNote(note.note, note.time, note.length, note.velocity)
  }
  
  return newNotes
}
```

### 6.2 Keyboard Shortcuts
**In Timeline.component.ts:**

```typescript
@HostListener('document:keydown', ['$event'])
handleKeyDown(event: KeyboardEvent) {
  // Cmd/Ctrl + C: Copy
  if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
    event.preventDefault()
    this.timelineState.copySelected()
  }
  
  // Cmd/Ctrl + V: Paste at playhead
  if ((event.metaKey || event.ctrlKey) && event.key === 'v') {
    event.preventDefault()
    const pasteTime = this.sequencer.currentTime
    const newNotes = this.timelineState.pasteAtTime(pasteTime)
    this.timelineState.selectNotes(newNotes.map(n => n.id))
  }
  
  // Delete: Remove selected notes
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    this.timelineState.deleteSelected()
  }
  
  // Cmd/Ctrl + A: Select all
  if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
    event.preventDefault()
    this.timelineState.selectAll()
  }
}
```

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests
- Input handler state transitions
- Selection logic (single, multi, range)
- Drag calculations with quantization
- Copy/paste timing
- Multi-note drag with boundary checking

### 7.2 Integration Tests
- Drag + multiselect interaction
- Copy selected → paste at different location
- Undo/redo with new features

### 7.3 Manual Testing Checklist
- [ ] Single note drag (no selection reset)
- [ ] Single note resize (start + end handle)
- [ ] Multi-select with Ctrl+Click
- [ ] Drag multiple selected notes together
- [ ] Copy beat (5 notes) → paste in new location
- [ ] Shift+Click range select
- [ ] Keyboard shortcuts (Ctrl+C, Ctrl+V, Delete, Ctrl+A)
- [ ] Grid quantization during drag
- [ ] Undo/redo with copy/paste

---

## Phase 8: Implementation Order

### PRIORITY 0 (FIX EVENT CONFLICTS FIRST)
0. **Consolidate event handling** in Timeline
   - Remove all pointer handlers from Note component
   - Remove all pointer handlers from drag handles
   - Add centralized handler in Timeline with event.target detection
   - This is the root cause of current bugs - do this first!

### PRIORITY 1 (FIX CURRENT BUGS)
1. **Create services** (TimelineStateService, TimelineInputService)
2. **Extract drag logic** from Timeline into InputService
3. **Fix position reset issue** by using originalPositions map
4. **Simplify Note component** to pure presentation

### PRIORITY 2 (ADD NEW FEATURES)
5. **Add selection UI** (visual indication of selected notes)
6. **Implement multi-select** (Ctrl+Click, Shift+Click)
7. **Add multi-note drag** (drag all selected at once)
8. **Implement clipboard service** and copy/paste
9. **Add keyboard shortcuts**

### PRIORITY 3 (POLISH)
10. **Test & debug**
11. **Performance optimization** (if needed)

---

## Expected Benefits

✓ **Fixes current issues:**
- Notes no longer reset position during drag
- Input state properly isolated
- No race conditions between drag and change detection

✓ **Enables new features:**
- Multi-selection naturally follows from state service
- Copy/paste becomes simple clipboard operations
- Future features (duplicate, nudge, etc.) easy to add

✓ **Code quality:**
- Components simpler and testable
- Services handle cross-cutting concerns
- Clear separation of concerns
- Observables for reactive updates

