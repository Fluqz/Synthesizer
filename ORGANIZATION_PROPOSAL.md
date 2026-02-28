# Timeline Component Organization & Rectangular Selection

## Problem Statement

**Timeline.component.ts is ~1200 lines handling:**
- Event routing & detection
- Drag state management  
- Selection management
- Rendering logic
- Keyboard shortcuts
- Undo/redo integration
- DOM calculations
- Change detection

**Current structure makes it hard to:**
- Test individual features
- Debug issues (too many responsibilities)
- Add new features without side effects
- Understand code flow

---

## Solution: Separation of Concerns

### Current (Monolithic)
```
TimelineComponent (1200 lines)
├── Event routing
├── Drag logic
├── Selection logic
├── Rendering
├── Keyboard handling
├── Undo/redo
└── DOM queries
```

### Proposed (Modular)
```
TimelineComponent (300 lines - Orchestration only)
├── Template rendering
├── Dependency injection
└── Coordinate services

Services (Extracted logic):
├── TimelineStateService (Selection, clipboard)
├── TimelineInputService (Drag, resize, calc)
├── TimelineKeyboardService (Keyboard shortcuts)
└── TimelineSelectionService (Rectangular selection box)

Sub-components (If needed):
├── TimelineGridComponent (Grid rendering)
├── TimelineNotesContainerComponent (Notes wrapper)
└── Note.component (Already extracted)
```

---

## 1. Service Extraction Plan

### A. TimelineStateService
**Responsibility:** All state that persists

```typescript
// Selection, clipboard, UI state
export class TimelineStateService {
  selectedNoteIds$: Observable<Set<number>>;
  clipboard$: Observable<ClipboardData | null>;
  
  selectNote(noteId: number, clearOthers?: boolean)
  toggleSelectNote(noteId: number)
  selectNotes(noteIds: number[])
  selectRange(fromNoteId: number, toNoteId: number)
  selectAll()
  clearSelection()
  
  copySelected()
  pasteAtTime(time: number): SequenceObject[]
  pasteAtNextBar(fromTime: number): SequenceObject[]
}
```

**File:** `src/app/services/timeline-state.service.ts` (~150 lines)

---

### B. TimelineInputService
**Responsibility:** All drag/resize mechanics

```typescript
// Drag state, calculations, validation
export class TimelineInputService {
  dragState$: Observable<DragState>;
  isDragging$: Observable<boolean>;
  
  // Start operations
  startDragMultiple(noteIds: number[], event: PointerEvent)
  startResizeStart(noteId: number, event: PointerEvent)
  startResizeEnd(noteId: number, event: PointerEvent)
  
  // During drag
  updateDrag(event: PointerEvent): DragUpdate
  
  // End operations
  endDrag(event: PointerEvent): DragCommit
  cancelDrag()
  
  // Validation
  validateDragPositions(positions: Map<number, {time, length}>): boolean
  applyBoundaryChecks(positions: Map<number, {time, length}>): void
}
```

**File:** `src/app/services/timeline-input.service.ts` (~200 lines)

---

### C. TimelineKeyboardService
**Responsibility:** All keyboard shortcuts

```typescript
export class TimelineKeyboardService {
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Ctrl+C/Cmd+C: Copy
    // Ctrl+V/Cmd+V: Paste
    // Delete/Backspace: Remove selected
    // Ctrl+A/Cmd+A: Select all
    // Escape: Deselect
  }
}
```

**File:** `src/app/services/timeline-keyboard.service.ts` (~100 lines)

---

### D. TimelineSelectionService (NEW!)
**Responsibility:** Rectangular selection box logic

```typescript
export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  visible: boolean;
}

export class TimelineSelectionService {
  selectionBox$: Observable<SelectionBox>;
  
  startDragSelection(event: PointerEvent)
  updateDragSelection(event: PointerEvent)
  endDragSelection(event: PointerEvent): number[]  // Returns selected noteIds
  cancelDragSelection()
  
  // Hit detection
  getNotesBoundingBox(noteIds: number[]): {x, y, width, height}
  isNoteIntersectingBox(noteElement: HTMLElement, box: SelectionBox): boolean
}
```

**File:** `src/app/services/timeline-selection.service.ts` (~150 lines)

---

## 2. Rectangular Selection Feature

### How It Works

```
User Action Sequence:
1. pointerdown on empty timeline
   ↓
2. Hold for 100ms with no movement
   ↓
3. Start drag to create selection box
   ↓
4. Visual rectangle shows area of selection
   ↓
5. Drag across notes to include them
   ↓
6. pointerup → Select all notes in box
```

### Implementation Detail

```typescript
onTimelinePointerDown(event: PointerEvent) {
  const noteElement = event.target.closest('.note');
  const dragHandle = event.target.closest('.drag-handle');
  
  if (dragHandle && noteElement) {
    // Resize handle
    this.handleResizeStart(event, dragHandle, noteElement);
  } else if (noteElement) {
    // Note clicked
    this.handleNotePointerDown(event, noteElement);
  } else {
    // Empty timeline - potential drag-select
    this.handleEmptyTimelinePointerDown(event);
  }
}

private handleEmptyTimelinePointerDown(event: PointerEvent) {
  this.dragSelectStartX = event.clientX;
  this.dragSelectStartY = event.clientY;
  this.pointerMovedAmount = 0;
  
  // Don't start selection immediately
  // Wait for movement threshold or timeout
}

onDocumentPointerMove(event: PointerEvent) {
  // Existing drag/resize logic...
  
  // Check if this is a drag-select operation
  if (this.dragSelectStartX !== null) {
    this.pointerMovedAmount += Math.abs(event.clientX - this.lastClientX);
    
    if (this.pointerMovedAmount > 5) {  // 5px threshold
      // Start rectangular selection
      this.timelineSelectionService.startDragSelection(event);
      this.isDragSelecting = true;
    }
  }
  
  // Update drag-select box
  if (this.isDragSelecting) {
    this.timelineSelectionService.updateDragSelection(event);
  }
}

onDocumentPointerUp(event: PointerEvent) {
  if (this.isDragSelecting) {
    // End rectangular selection
    const selectedNoteIds = this.timelineSelectionService.endDragSelection(event);
    this.timelineState.selectNotes(selectedNoteIds);
    this.isDragSelecting = false;
  } else {
    // Existing drag/resize end logic...
  }
}
```

### Visual Feedback

```html
<!-- Selection box canvas overlay -->
<div class="timeline-selection-overlay" 
     *ngIf="(selectionBox$ | async) as box"
     [ngClass]="{ visible: box.visible }">
  <div class="selection-rect"
       [style.left.px]="Math.min(box.startX, box.currentX)"
       [style.top.px]="Math.min(box.startY, box.currentY)"
       [style.width.px]="Math.abs(box.currentX - box.startX)"
       [style.height.px]="Math.abs(box.currentY - box.startY)">
  </div>
</div>
```

```css
.timeline-selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.selection-rect {
  position: absolute;
  border: 2px dashed var(--c-hl);
  background: rgba(0, 255, 0, 0.1);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  transition: none;  /* No animation during drag */
}
```

### Hit Detection

```typescript
// In TimelineSelectionService
isNoteIntersectingBox(noteElement: HTMLElement, box: SelectionBox): boolean {
  const noteRect = noteElement.getBoundingClientRect();
  const boxRect = {
    left: Math.min(box.startX, box.currentX),
    top: Math.min(box.startY, box.currentY),
    right: Math.max(box.startX, box.currentX),
    bottom: Math.max(box.startY, box.currentY),
  };
  
  // Check if note rect intersects with box rect
  return !(noteRect.right < boxRect.left || 
           noteRect.left > boxRect.right ||
           noteRect.bottom < boxRect.top ||
           noteRect.top > boxRect.bottom);
}
```

---

## 3. Updated Timeline Component

### Before (Monolithic)
```typescript
export class TimelineComponent implements OnChanges, OnDestroy {
  // Properties (40+ fields)
  dragState: DragState = {...};
  selectedNote: SequenceObject | null;
  alteredSequenceObject: SequenceObject | null;
  isPointerDown = false;
  isNoteDrag = false;
  // ... many more
  
  // Methods (30+ methods)
  onTimelineClick() {...}
  handleNotePointerDown() {...}
  handleNotePointerMove() {...}
  handleNotePointerUp() {...}
  // ... many more
}
```

### After (Orchestration)
```typescript
export class TimelineComponent implements OnInit, OnDestroy {
  @Input() sequencer: Sequencer;
  @ViewChild('timeline') timelineElement: ElementRef;
  
  // Observable state from services
  selectedNoteIds$ = this.timelineState.selectedNoteIds$;
  isDragging$ = this.inputService.isDragging$;
  dragState$ = this.inputService.dragState$;
  selectionBox$ = this.selectionService.selectionBox$;
  clipboard$ = this.timelineState.clipboard$;
  
  // Local refs only
  timelineRect: DOMRect;
  
  constructor(
    private timelineState: TimelineStateService,
    private inputService: TimelineInputService,
    private selectionService: TimelineSelectionService,
    private keyboardService: TimelineKeyboardService,
    private sequencer: Sequencer,
    private cdr: ChangeDetectorRef,
  ) {}
  
  ngOnInit() {
    // Subscribe to service observables only if needed for side effects
    this.selectedNoteIds$.subscribe(ids => {
      this.cdr.markForCheck();
    });
  }
  
  // Only route events to services
  @HostListener('pointerdown', ['$event'])
  onTimelinePointerDown(event: PointerEvent) {
    const dragHandle = (event.target as HTMLElement).closest('.drag-handle');
    const noteElement = (event.target as HTMLElement).closest('.note');
    
    if (dragHandle && noteElement) {
      this.handleResizeStart(event, dragHandle, noteElement);
    } else if (noteElement) {
      this.handleNotePointerDown(event, noteElement);
    } else {
      this.selectionService.startDragSelection(event);
    }
  }
  
  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(event: PointerEvent) {
    this.inputService.updateDrag(event);
    this.selectionService.updateDragSelection(event);
  }
  
  @HostListener('document:pointerup', ['$event'])
  onDocumentPointerUp(event: PointerEvent) {
    // Handle drag end
    const commit = this.inputService.endDrag(event);
    if (commit.success) {
      this.updateWrapperHeight();
      this.saveUndo();
    }
    
    // Handle selection box end
    const selectedIds = this.selectionService.endDragSelection(event);
    if (selectedIds.length > 0) {
      this.timelineState.selectNotes(selectedIds);
    }
  }
  
  // Private helpers (much smaller)
  private handleResizeStart(event: PointerEvent, handleElement: Element, noteElement: Element) {
    // 20 lines, just setup
  }
  
  private handleNotePointerDown(event: PointerEvent, noteElement: Element) {
    // 15 lines, just route to service
  }
  
  getSequenceObject(note: SequenceObject): SequenceObject {
    // Check if being altered during drag
  }
}
```

---

## 4. File Structure

### Before
```
src/app/
├── view/
│   ├── Timeline.component.ts     (1200 lines 😱)
│   ├── Note.component.ts          (300 lines)
│   └── ...
└── synthesizer/
    └── sequencer.ts
```

### After
```
src/app/
├── view/
│   ├── Timeline.component.ts      (300 lines - Orchestration)
│   ├── Note.component.ts          (300 lines - Pure presentation)
│   └── ...
├── services/
│   ├── timeline-state.service.ts  (150 lines - Selection & clipboard)
│   ├── timeline-input.service.ts  (200 lines - Drag & resize logic)
│   ├── timeline-keyboard.service.ts (100 lines - Keyboard shortcuts)
│   └── timeline-selection.service.ts (150 lines - Rectangular selection)
└── synthesizer/
    └── sequencer.ts
```

**Total organized code:** Same lines, but each file has single responsibility

---

## 5. Implementation Order

### Phase 1: Extract Core Services (in order)
1. **TimelineStateService** - Selection & clipboard
   - Easiest to extract
   - No dependencies on DOM
   - Pure business logic
   
2. **TimelineInputService** - Drag & resize
   - Moderate complexity
   - Depends on TimelineStateService
   - Math-heavy, testable
   
3. **TimelineSelectionService** - Rectangular selection (NEW!)
   - Moderate complexity
   - DOM hit detection logic
   - Visual feedback
   
4. **TimelineKeyboardService** - Keyboard shortcuts
   - Easiest to integrate
   - Depends on TimelineStateService
   - Just event routing

### Phase 2: Refactor Timeline Component
1. Inject all four services
2. Remove old methods, replace with service calls
3. Use observables from services ($)
4. Simplify event handlers to just route events
5. Test incrementally

### Phase 3: Sub-components (Optional)
1. Extract grid rendering to `TimelineGridComponent`
2. Extract notes rendering to `TimelineNotesComponent`
3. Only if performance needs it or code gets complex again

---

## 6. Testing Benefits

### Before
```typescript
// Hard to test - everything is intertwined
it('should drag note without jumping', () => {
  // Need to mock whole component, 40+ properties, 30+ methods
  // Brittle tests that break if you refactor internal state
});
```

### After
```typescript
// Test each service independently
describe('TimelineStateService', () => {
  it('should select multiple notes', () => {
    service.selectNote(1);
    service.toggleSelectNote(2);
    expect(service.getSelectedNoteIds()).toEqual([1, 2]);
  });
});

describe('TimelineInputService', () => {
  it('should calculate correct drag delta', () => {
    service.startDragMultiple([1, 2, 3], event1);
    const update = service.updateDrag(event2);
    expect(update.positions.get(1).time).toBeCloseTo(expectedTime);
  });
});

describe('TimelineSelectionService', () => {
  it('should detect note in selection box', () => {
    const box = {startX: 0, startY: 0, currentX: 100, currentY: 100, visible: true};
    expect(service.isNoteIntersectingBox(noteElement, box)).toBe(true);
  });
});
```

---

## 7. Development Workflow

### Week 1: Services Extraction
```
Day 1-2: TimelineStateService
Day 3-4: TimelineInputService
Day 5: TimelineSelectionService + integration
```

### Week 2: Component Refactoring
```
Day 1-2: Inject services, test
Day 3-4: Remove old code from component
Day 5: Manual testing + polish
```

### Week 3: Features
```
Day 1-2: Multi-select Ctrl+Click
Day 3-4: Copy/Paste shortcuts
Day 5: Polish, edge cases
```

---

## 8. Migration Path (No Breaking Changes)

You can implement this **incrementally** without rewriting everything at once:

```
Step 1: Create TimelineStateService alongside existing code
        Both work together temporarily

Step 2: Refactor piece by piece
        Remove old selection logic, use service instead

Step 3: Remove old methods as they're replaced

Step 4: Tests pass the entire time (incremental)
```

---

## Summary

**Problem:** Timeline component 1200 lines, hard to maintain, hard to test

**Solution:** Extract into focused services + rectangular selection feature

**Benefits:**
- ✅ Each file ~150-200 lines (readable)
- ✅ Single responsibility per service
- ✅ Easy to test (mock dependencies)
- ✅ Easy to add features (just add method to service)
- ✅ Rectangular selection (professional UX)
- ✅ Can implement incrementally
- ✅ No breaking changes to existing functionality

**Result:**
```
Timeline.component.ts:          300 lines (orchestration)
TimelineStateService:           150 lines (selection)
TimelineInputService:           200 lines (drag/resize)
TimelineSelectionService:       150 lines (box select)
TimelineKeyboardService:        100 lines (shortcuts)
────────────────────────────────────────────
Total:                          900 lines (organized!)
```

Ready to start implementing?
