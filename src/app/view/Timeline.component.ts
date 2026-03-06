import * as Tone from "tone";
import {
  Sequencer,
  type NoteLength,
  type SequenceObject,
} from "../synthesizer/sequencer";
import { Storage } from "../core/storage";
import { BeatMachine } from "../synthesizer/beat-machine";
import { timer, type Subscription } from "rxjs";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { NoteComponent } from "./Note.component";
import { CommonModule } from "@angular/common";
import { Synthesizer } from "../synthesizer/synthesizer";
import { TimelineStateService } from "../services/timeline-state.service";
import { TimelineInputService } from "../services/timeline-input.service";
import { TimelineSelectionService } from "../services/timeline-selection.service";
import { TimelineKeyboardService } from "../services/timeline-keyboard.service";
import { Observable } from "rxjs";

export const convertNoteLength = (n: NoteLength) => {
  switch (n) {
    case "1":
      return "1n";
    case "1/2":
      return "2n";
    case "1/4":
      return "4n";
    case "1/8":
      return "8n";
    case "1/16":
      return "16n";
    case "1/32":
      return "32n";
    case "1/64":
      return "64n";
  }
};

/**
 * Timeline drag state for a single drag operation
 */
export interface DragState {
  active: boolean;
  type: "move" | "resize-start" | "resize-end" | null;
  noteId: number | null;
  startClientX: number;
  startClientY: number;
  startTime: number;
  endTime: number;
  dragOffsetX: number;
  dragOffsetY: number;
  handle: number; // 0 = start, 1 = end
  startRowIndex: number;
}

@Component({
  selector: "sy-timeline",
  standalone: true,
  imports: [CommonModule, NoteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TimelineStateService,
    TimelineInputService,
    TimelineSelectionService,
    TimelineKeyboardService,
  ],
  template: `
    <div *ngIf="sequencer != undefined" class="timeline-wrapper">
      <div
        class="timeline"
        #timeline
        [style.height.px]="wrapperHeight"
        (pointerdown)="onTimelineClick($event)"
        (dblclick)="onTimelineDblClick($event)"
        (resize)="onResizeTimeline($event)"
      >
        <div *ngIf="timelineRect != undefined">
          <div class="timeline-ui">
            <div
              *ngIf="sequencer.isPlaying == true"
              class="current-line"
              [style.transform]="'translateX(' + currentLinePos + 'px)'"
            ></div>

            <!-- Grid lines with adaptive detail level based on pixel density -->
            @for (bar of barArray; track bar) {
              <!-- 16th notes (hidden if too crowded) -->
              @if (show16ths) {
                @for (sixteenth of sixteenthArray; track sixteenth) {
                  <div
                    class="grid-line grid-16th"
                    [style.left.px]="
                      barPositionArray[bar] + (sixteenth * barWidth) / 16
                    "
                  ></div>
                }
              }

              <!-- 8th notes (hidden if too crowded) -->
              @if (show8ths) {
                @for (eighth of eighthArray; track eighth) {
                  <div
                    class="grid-line grid-8th"
                    [style.left.px]="
                      barPositionArray[bar] + (eighth * barWidth) / 8
                    "
                  ></div>
                }
              }

              <!-- Quarter notes (always visible) -->
              @for (quarter of quarterNoteArray; track quarter) {
                <div
                  class="grid-line grid-quarter"
                  [style.left.px]="
                    barPositionArray[bar] + (quarter * barWidth) / 4
                  "
                ></div>
              }

              <!-- Bar boundary line -->
              <div
                class="grid-line grid-bar"
                [style.left.px]="barPositionArray[bar]"
              ></div>
            }

            <!-- Final bar line -->
            <div
              class="grid-line grid-bar"
              [style.right.px]="-1"
              [style.left]="'unset'"
            ></div>
          </div>

          <!-- Rectangular selection box overlay -->
          <div
            class="timeline-selection-overlay"
            *ngIf="(selectionBox$ | async) as box"
            [ngClass]="{ visible: box.visible }"
          >
            <div
              class="selection-rect"
              *ngIf="box.visible"
              [style.left.px]="Math.min(box.startX, box.currentX)"
              [style.top.px]="Math.min(box.startY, box.currentY)"
              [style.width.px]="Math.abs(box.currentX - box.startX)"
              [style.height.px]="Math.abs(box.currentY - box.startY)"
            ></div>
          </div>

          <!-- Selection count info -->
          <div class="selection-info" *ngIf="(selectedNoteIds$ | async) as selectedIds">
            <span *ngIf="selectedIds.size > 0">
              {{ selectedIds.size }} note(s) selected
            </span>
          </div>

          <!-- Timeline rows container -->
          <div class="timeline-rows">
            @for (row of rowArray; track row; let i = $index) {
              <div 
                class="timeline-row"
                [style.top.px]="(wrapperHeight / rows) * i"
                [style.height.px]="noteHeight"
                (dblclick)="onRowDblClick($event, i)"
              ></div>
            }
          </div>

          <div class="timeline-notes">
            @for (note of sequence; track note; let i = $index) {
              <sy-note
                [note]="getSequenceObject(note)"
                (onDelete)="removeNote(note)"
                [sequencer]="sequencer"
                [timelineRect]="timelineRect"
                [yPos]="noteYArray[i]"
                [height]="noteHeight"
                [isSelected]="(selectedNoteIds$ | async)?.has(note.id)"
                [selectedCount]="(selectedNoteIds$ | async)?.size ?? 0"
                [isDragging]="isDragging$ | async"
              >
                <div class="drag-handle drag-start" data-handle="start"></div>

                <div class="drag-handle drag-end" data-handle="end"></div>
              </sy-note>
            }
          </div>
          </div>
          </div>
          </div>
          `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: auto;
    }

    .timeline {
      mix-blend-mode: color-dodge;
      mix-blend-mode: unset;

      position: relative;

      width: 100%;
      height: 100px;
    }

    .timeline .timeline-notes,
    .timeline .timeline-ui {
      position: absolute;

      width: 100%;
      height: 100%;
    }

    /* Grid line hierarchy */
    .timeline .grid-line {
      z-index: 1;
      position: absolute;
      top: 0px;
      height: 100%;
      background-color: var(--c-bl);
    }

    /* 16th notes - thinnest, most subtle */
    .timeline .grid-16th {
      width: 0.5px;
      opacity: 0.7;
    }

    /* 8th notes - medium */
    .timeline .grid-8th {
      width: 0.75px;
      opacity: 0.8;
    }

    /* Quarter notes - prominent */
    .timeline .grid-quarter {
      width: 1px;
      opacity: 0.9;
    }

    /* Bar boundaries - thickest, most visible */
    .timeline .grid-bar {
      width: 2px;
      opacity: 1;
    }

    .timeline .current-line {
      z-index: 1000;
      position: absolute;
      left: 1px;
      top: 0px;
      height: 100%;
      width: 2px;
      opacity: 1;

      background-color: #fff;
    }

    /* Rectangular selection box */
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
    }

    /* Selection count info */
    .selection-info {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 5px 10px;
      background: rgba(0, 255, 0, 0.1);
      border: 1px solid var(--c-hl);
      border-radius: 4px;
      font-size: 12px;
      color: var(--c-hl);
      z-index: 101;
    }
    .timeline .add-remove-cont {
      height: 100%;
      width: 50px;
    }

    .timeline .remove-bar,
    .timeline .add-bar {
      display: inline-flex;
      justify-content: center;
      align-items: center;

      cursor: pointer;

      width: 50px;
      height: 50%;
      background-color: var(--c-w);
      color: var(--c-b);
    }

    .timeline .remove-bar:hover,
    .timeline .add-bar:hover {
      background-color: var(--c-b);
      color: var(--c-y);
    }

    /* Timeline rows for double-click note creation */
    .timeline .timeline-rows {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto;
      z-index: 2;
    }

    .timeline .timeline-row {
      position: absolute;
      width: 100%;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: cell;
    }

    .timeline .timeline-row:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  `,
  host: {
    "(document:pointermove)": "onDocumentPointerMove($event)",
    "(document:pointerup)": "onDocumentPointerUp($event)",
    "(document:pointercancel)": "onDocumentPointerCancel($event)",
  },
})
export class TimelineComponent implements OnInit, OnChanges, OnDestroy {
  /** Instance of the Sequencer */
  @Input("sequencer") sequencer: Sequencer;

  @Input("sequence")
  get sequence(): SequenceObject[] {
    return this._sequence;
  }
  set sequence(s: SequenceObject[]) {
    this._sequence = s;

    this.update();
  }
  private _sequence: SequenceObject[];

  noteYArray: number[] = [];

  @Input("bars")
  get bars(): number {
    return this._bars;
  }
  set bars(b: number) {
    this._bars = b;

    this.update();
  }
  private _bars: number = 1;

  /** Unified drag state management */
  private dragState: DragState = {
    active: false,
    type: null,
    noteId: null,
    startClientX: 0,
    startClientY: 0,
    startTime: 0,
    endTime: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    handle: 0,
    startRowIndex: 0,
  };

  /**
   * Grid quantization in bar units
   * Set to null to disable quantization
   * Common values: 0.0625 (1/16), 0.125 (1/8), 0.25 (1/4)
   */
  private gridQuantize: number | null = null; // null = no snapping

  barWidth: number = 0;
  barPositionArray: number[] = [];
  barArray: number[] = [];
  rowArray: number[] = [];

  /** Quarter notes per bar (4/4 time) */
  quarterNoteArray: number[] = [0, 1, 2, 3];

  /** Eighth notes per bar (8 total) */
  eighthArray: number[] = [0, 1, 2, 3, 4, 5, 6, 7];

  /** 16th notes per bar (16 total) */
  sixteenthArray: number[] = Array.from({ length: 16 }, (_, i) => i);

  /** Whether to show 8th notes (adaptive based on pixel density) */
  show8ths: boolean = true;

  /** Whether to show 16th notes (adaptive based on pixel density) */
  show16ths: boolean = true;

  /** Height of a single note */
  noteHeight: number = 100;

  minNoteHeight: number = 25;

  /** Height of the html wrapper of the timeline. */
  wrapperHeight: number = 100;

  /** Counts how many rows of notes are in the timeline  */
  rows: number = 1;

  /** HTML Timline line x position */
  currentLinePos = 0;

  /** Position tracking interval (60 FPS) */
  private positionUpdateInterval: any;

  /** Optional: subscription to beat events for snapping UI */
  private beatSubscription: Subscription;

  /** Reference to currently dragged note element for direct DOM updates */
  private draggedNoteElement: HTMLElement | null = null;

  /** Store original note time at start of drag to detect changes */
  private originalNoteTime: number | null = null;

  /** Timeline HTML element ref */
  @ViewChild("timeline")
  private _timeline: ElementRef<HTMLElement>;
  /** Timeline HTML element ref */
  get timeline(): HTMLElement {
    if (this._timeline == null) return null;

    this.timelineRect = this._timeline.nativeElement.getBoundingClientRect();

    return this._timeline.nativeElement;
  }

  /** Timeline's client rect object */
  timelineRect: DOMRect;

  /** Stored ID of a currently clicked SequnceObject. */
  public _clickedSequenceObjectID: number | null = null;

  /** Selected note object */
  private selectedNote: SequenceObject;
  /** Temporary object for altering the selected note */
  private alteredSequenceObject: SequenceObject;

  private isPointerDown = false;
  private isNoteDrag = false;
  /** Track whether we ever entered actual drag mode (movement > 3px) */
  private dragWasActivated = false;
  /** Track the note ID that was clicked on pointerdown (for opening controls on pure click) */
  private clickedNoteIdOnPointerDown: number | null = null;
  private noteEle: HTMLElement;
  /** X Offset of mouse to element origin  */
  private clickOffsetX: number = 0;
  /** Client X */
  private pointerPositionX: number = 0;
  /** Client Y */
  private pointerPositionY: number = 0;
  private pointerMovedAmount: number = 0;

  private noteRect: DOMRect;
  
  /** Cached timeline rect during drag to prevent recalculation */
  private cachedTimelineRect: DOMRect | null = null;

  // Observable streams from services
  selectedNoteIds$: Observable<Set<number>>;
  clipboard$: Observable<any>;
  dragState$: Observable<any>;
  isDragging$: Observable<boolean>;
  selectionBox$: Observable<any>;
  isDragSelecting$: Observable<boolean>;

  constructor(
    public cdr: ChangeDetectorRef,
    private timelineState: TimelineStateService,
    private inputService: TimelineInputService,
    private selectionService: TimelineSelectionService,
    private keyboardService: TimelineKeyboardService,
  ) {
    // Initialize observables
    this.selectedNoteIds$ = this.timelineState.selectedNoteIds$;
    this.clipboard$ = this.timelineState.clipboard$;
    this.dragState$ = this.inputService.dragState$;
    this.isDragging$ = this.inputService.isDragging$;
    this.selectionBox$ = this.selectionService.selectionBox$;
    this.isDragSelecting$ = this.selectionService.isDragSelecting$;
  }

  @HostListener('window:resize', ['$event'])
  onResize(e) {
    this.update();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.keyboardService.handleKeyDown(event);
  }

  ngOnInit() {
    // Subscribe to state changes for change detection
    this.selectedNoteIds$.subscribe(() => {
      this.cdr.markForCheck();
    });

    this.isDragging$.subscribe(() => {
      this.cdr.markForCheck();
    });

    this.isDragSelecting$.subscribe(() => {
      this.cdr.markForCheck();
    });

    // Register keyboard callbacks
    this.keyboardService.registerCallbacks({
      onCopy: () => this.onCopyFeedback(),
      onDelete: () => this.onDeleteFeedback(),
      onPaste: () => this.onPasteFeedback(),
    });
  }

  ngAfterViewInit() {
    this.onResizeTimeline();

    if (this.sequencer == undefined) return;

    // Configure services
    this.timelineState.setSequencer(this.sequencer);
    this.inputService.setSequencer(this.sequencer);

    if (this.timelineRect) {
      this.inputService.setConfig(
        this._bars,
        this.gridQuantize,
        this.timelineRect,
      );
      this.selectionService.setTimelineElement(this.timeline);
    }

    // Initialize BeatMachine
    BeatMachine.initialize();

    // Start polling transport position for smooth current-line animation
    this.startPositionTracking();

    this.update();

    this.cdr.markForCheck();
  }

  /**
   * Poll transport position 60x per second for smooth timeline animation
   * Apply negative latency offset to sync visual with audio playback
   */
  private startPositionTracking() {
    // Latency compensation in seconds - Tone.js schedules audio slightly ahead of transport position
    const AUDIO_LATENCY_MS = 50;
    const AUDIO_LATENCY_SECONDS = AUDIO_LATENCY_MS / 1000;

    this.positionUpdateInterval = setInterval(() => {
      // Ensure timelineRect is always fresh
      if (!this.timelineRect) {
        this.timelineRect =
          this._timeline?.nativeElement.getBoundingClientRect();
      }

      if (!this.timelineRect) return;

      if (this.sequencer?.isPlaying) {
        // Get current transport position in seconds (convert from Tone.Time)
        const transportPos = Tone.getTransport().position;
        const transportTimeSeconds =
          typeof transportPos === "number"
            ? transportPos
            : Tone.Time(transportPos).toSeconds();

        // Apply latency compensation (subtract to delay visual slightly)
        const compensatedTimeSeconds =
          transportTimeSeconds - AUDIO_LATENCY_SECONDS;

        // Get bar duration in seconds
        const barDurationSeconds = Tone.Time(this._bars + "b").toSeconds();

        // Wrap position to loop within bar range (handles looping sequencers)
        const wrappedTimeSeconds = compensatedTimeSeconds % barDurationSeconds;

        // Convert seconds to pixels
        const timelineWidthPixels = this.timelineRect.width;
        const pixelPos =
          (wrappedTimeSeconds / barDurationSeconds) * timelineWidthPixels;

        this.currentLinePos = Math.max(
          0,
          Math.min(pixelPos, timelineWidthPixels),
        );
      } else {
        // Not playing - reset position
        this.currentLinePos = 0;
      }

      // Minimal change detection
      this.cdr.markForCheck();
    }, 16); // ~60 FPS
  }

  getBarArray() {
    this.barArray.length = 0;

    for (let i = 0; i < this.bars; i++) this.barArray.push(i);

    return this.barArray;
  }

  getBarPositionArray() {
    this.barPositionArray.length = 0;

    for (let i = 0; i < this.bars; i++)
      this.barPositionArray.push(this.getBarLeftPosition(i));

    return this.barPositionArray;
  }

  ngOnChanges() {
    this.update();
    // if(this.selectedNote) this.getSequenceObject(this.selectedNote)
  }

  ngOnDestroy() {
    // Clean up position tracking interval
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
    }

    // Clean up beat subscription if it exists
    if (this.beatSubscription) {
      this.beatSubscription.unsubscribe();
    }
  }

  update() {
    this.onResizeTimeline();
    this.updateRows();
    this.updateWrapperHeight();
    this.updateNoteHeight();
    this.updateNoteYArray();
    this.updateRowArray();

    if (this.timeline && this.timelineRect) {
      this.barWidth = this.getBarWidth();
      this.barArray = this.getBarArray();
      this.barPositionArray = this.getBarPositionArray();
      this.updateGridVisibility();
    }
  }

  /** DblClick Timeline event */
  onTimelineDblClick(e: MouseEvent) {
    // console.log('onTimelineDblClick')

    this.timelineRect = this.timeline.getBoundingClientRect();

    const width = this.timelineRect.width;
    const posX = e.clientX - this.timelineRect.left;

    let xInPercent = posX / width;

    let time = Math.round(this.bars * xInPercent * 1000) / 1000;

    this.addNote(time);

    this.update();

    this.saveUndo();
  }

  /** Pointerdown Timeline event - Route to services */
  onTimelineClick(e: PointerEvent) {
   e.stopPropagation();

   const target = e.target as HTMLElement;
   // Check if the immediate target (not parent) is a drag handle
   const isDragHandleTarget = target.classList.contains('drag-handle');
   const dragHandle = isDragHandleTarget ? target : null;
   const noteElement = target.closest('.note') as HTMLElement | null;
   const controlBtn = target.closest('.note-controls') as HTMLElement | null;
   
   // Diagnostic: Log notes in sequence to detect any with length 0
   const notesWithZeroLength = this.sequence.filter(n => 
     typeof n.length === 'number' && n.length === 0
   );
   if (notesWithZeroLength.length > 0) {
     console.warn('⚠️ Found notes with length 0 in sequence:', notesWithZeroLength);
   }

   if (dragHandle && noteElement) {
     // RESIZE HANDLE: Start resize
      const noteId = parseInt(noteElement.getAttribute('data-note-id') || '0');
      const handleType = dragHandle.getAttribute('data-handle');
      const handle = handleType === 'start' ? 0 : 1;

      // Check if this note is part of multi-selection
      const selectedIds = this.timelineState.getSelectedNoteIds();
      if (selectedIds.includes(noteId) && selectedIds.length > 1) {
        // Resize all selected notes together
        this.inputService.startResizeMultiple(selectedIds, handle, e);
      } else {
        // Resize only this note
        this.inputService.startResize(noteId, handle, e);
      }
    } else if (controlBtn) {
      // NOTE CONTROL BUTTON: Don't start drag
      return;
    } else if (noteElement) {
      // NOTE BODY: Handle selection + potential drag
      const noteId = parseInt(noteElement.getAttribute('data-note-id') || '0');
      const previouslySelected = this.timelineState.isNoteSelected(noteId);
      
      // Track which note was clicked (for potential controls opening on pointerup)
      this.clickedNoteIdOnPointerDown = noteId;

      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click: Toggle selection (add/remove individual note)
        console.log('👆 Ctrl+Click toggle:', noteId);
        this.timelineState.toggleSelectNote(noteId);
        // Don't open controls during modifier clicks
        this._clickedSequenceObjectID = null;
        // Clear the clicked note since this was a modifier click (not a pure click)
        this.clickedNoteIdOnPointerDown = null;
      } else if (e.shiftKey) {
        // Shift+Click: ADD this note to selection (just the clicked note, no range)
        console.log('⬆️ Shift+Click add to selection:', noteId);
        this.timelineState.selectNote(noteId, false); // false = don't clear others
        // Don't open controls during shift clicks
        this._clickedSequenceObjectID = null;
        // Clear the clicked note since this was a modifier click (not a pure click)
        this.clickedNoteIdOnPointerDown = null;
      } else {
        // Single click on unselected note: Don't select yet - wait for pointerup to confirm it's a pure click
        if (previouslySelected) {
          // Already selected - start drag with current selection
          console.log('👆 Single click on already-selected note:', noteId, '- will drag or show controls on pointerup');
        } else {
          // Not selected - DON'T select on pointerdown (this would show controls)
          // Only select on pointerup if it's a pure click, or start drag if it moves
          console.log('👆 Single click new note (not yet selected):', noteId, '- will decide on pointerup');
        }
        // Don't open controls on pointerdown - wait for pointerup
        this._clickedSequenceObjectID = null;
        console.log('🔴 SET _clickedSequenceObjectID = null on pointerdown, current value:', this._clickedSequenceObjectID);
      }

      // Clear any stale altered sequence object before starting drag
      this.alteredSequenceObject = null;
      
      // Reset drag activation flag for this new operation
      this.dragWasActivated = false;

      // Start drag with the clicked note, or current selection if clicking on already-selected note
      const selectedIds = this.timelineState.getSelectedNoteIds();
      console.log('💫 After pointerdown handling - selectedIds:', Array.from(selectedIds), 'clickedNote:', this.clickedNoteIdOnPointerDown);
      
      // Determine which notes to drag
      let notesToDrag: number[];
      if (this.clickedNoteIdOnPointerDown !== null) {
        // A note was clicked
        const isClickedNoteSelected = selectedIds.includes(this.clickedNoteIdOnPointerDown);
        if (isClickedNoteSelected) {
          // Clicking on an already-selected note - drag the whole selection
          notesToDrag = selectedIds;
          console.log('💫 Dragging selected notes (clicked note is in selection):', notesToDrag);
        } else {
          // Clicking on an unselected note - drag only that note (don't select yet)
          // Selection will happen on pointerup if it's a pure click
          notesToDrag = [this.clickedNoteIdOnPointerDown];
          console.log('💫 Dragging only clicked note (unselected):', notesToDrag);
        }
      } else {
        // No note clicked - drag current selection
        notesToDrag = selectedIds;
        console.log('💫 Dragging current selection:', notesToDrag);
      }
      
      if (notesToDrag.length > 0) {
        // Cache the timeline rect before starting drag
        // Always refresh timelineRect on pointerdown to ensure we have current dimensions
        if (this.timeline) {
          this.timelineRect = this.timeline.getBoundingClientRect();
        }
        this.cachedTimelineRect = this.timelineRect;
        this.inputService.startDragMultiple(notesToDrag, e);
      }
    } else {
      // EMPTY TIMELINE: Start rectangular selection or clear
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        this.timelineState.clearSelection();
      }
      this.selectionService.startDragSelection(e);
    }
  }

  /**
   * Handle pointer down on note body
   */
  private handleNotePointerDown(event: PointerEvent, noteElement: Element | null) {
    console.log('🟢 handleNotePointerDown called', noteElement);
    if (!noteElement) {
      console.log('❌ noteElement is null, returning');
      return;
    }
    event.preventDefault();

    const noteId = (noteElement as HTMLElement).getAttribute("data-note-id");
    console.log('🔑 noteId from data-note-id:', noteId);
    if (!noteId) {
      console.log('❌ noteId not found, returning');
      return;
    }

    const note = this.sequence.find((n) => n.id === parseInt(noteId));
    console.log('📋 Found note:', note, 'from sequence:', this.sequence);
    if (!note) {
      console.log('❌ note not found in sequence, returning');
      return;
    }

    const noteElem = noteElement as HTMLElement;

    this.isPointerDown = true;
    document.body.style.cursor = "grabbing";

    this.noteEle = noteElem;
    this.draggedNoteElement = noteElem;
    this.pointerPositionX = event.clientX;
    this.pointerPositionY = event.clientY;
    this.pointerMovedAmount = 0;

    // Store initial position of the note
    const noteX =
      (Tone.Time(note.time).toSeconds() / this.sequencer.bars) *
      this.timelineRect.width;

    this.clickOffsetX = event.clientX - this.timelineRect.left - noteX;

    this.noteRect = noteElem.getBoundingClientRect();

    this.selectedNote = note;
    this.originalNoteTime = Tone.Time(note.time).toSeconds();

    if (!this.alteredSequenceObject) this.alteredSequenceObject = { ...note };
    
    console.log('✅ handleNotePointerDown complete', {
      noteId: note.id,
      isPointerDown: this.isPointerDown,
      clickOffsetX: this.clickOffsetX,
      pointerPosition: { x: this.pointerPositionX, y: this.pointerPositionY }
    });
  }

  /**
   * Handle pointer down on resize handle
   */
  private handleResizeStart(
    event: PointerEvent,
    handleElement: Element | null,
    noteElement: Element | null,
  ) {
    if (!handleElement || !noteElement) return;
    event.preventDefault();

    const handleElem = handleElement as HTMLElement;
    const noteElem = noteElement as HTMLElement;

    const noteId = noteElem.getAttribute("data-note-id");
    const handleType = handleElem.getAttribute("data-handle");

    if (!noteId || !handleType) return;

    const note = this.sequence.find((n) => n.id === parseInt(noteId));
    if (!note) return;

    this.draggedNoteElement = noteElem;

    const noteTimeInBars = typeof note.time === "number" ? note.time : 0;
    const noteLengthInBars = typeof note.length === "number" ? note.length : 0;

    this.dragState = {
      active: true,
      type: handleType === "start" ? "resize-start" : "resize-end",
      noteId: note.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startTime: noteTimeInBars,
      endTime: noteTimeInBars + noteLengthInBars,
      dragOffsetX: event.clientX - noteElem.getBoundingClientRect().left,
      dragOffsetY: 0,
      handle: handleType === "start" ? 0 : 1,
      startRowIndex: 0,
    };

    this.selectedNote = note;
    this.alteredSequenceObject = null;
    this._clickedSequenceObjectID = null;
  }
  /** Resize Timeline event - need to get clientRect from timeline */
  onResizeTimeline(e?) {
    // console.log('onResizeTimeline')

    // if(e instanceof Event) timelineRect = (e.target as HTMLElement).getBoundingClientRect()
    // else timelineRect = e.getBoundingClientRect()

    if (this.timeline != undefined)
      this.timelineRect = this.timeline.getBoundingClientRect();
  }

  /** Add new note to sequencer */
  addNote(time: Tone.Unit.Time, note?: Tone.Unit.Frequency | number, rowIndex?: number) {
    let noteFreq: Tone.Unit.Frequency;

    if (typeof note === 'number') {
      // If second param is a number, treat it as rowIndex
      rowIndex = note;
      noteFreq = Synthesizer.lastNotePlayed || "F3";
    } else if (note == undefined) {
      if (Synthesizer.lastNotePlayed != undefined)
        noteFreq = Synthesizer.lastNotePlayed;
      else noteFreq = "F3";
    } else {
      noteFreq = note;
    }

    const newNote = this.sequencer.addNote(
      noteFreq,
      time,
      convertNoteLength(this.sequencer.noteLength),
      1,
    );

    // Assign to specific row if provided
    if (rowIndex !== undefined && newNote) {
      newNote.rowIndex = rowIndex;
    }

    this.update();

    this.saveUndo();
  }

  /** DblClick Note Event  */
  removeNote(note: SequenceObject) {
    if (this.dragState.active && this.dragState.type?.includes("resize"))
      return;

    this.sequencer.removeNote(note.id);

    this.update();

    this.saveUndo();
  }

  updateNoteYArray() {
    this.noteYArray.length = 0;

    for (let n of this.sequence) {
      this.noteYArray.push(this.getNoteY(n));
    }
  }

  getBarWidth() {
    return this.timelineRect.width / this.bars;
  }

  /**
   * Determine which grid lines to show based on pixel density
   * Prevents crowding when zoomed out
   */
  updateGridVisibility() {
    const MIN_PIXEL_SPACING = 8; // Minimum pixels between grid lines

    // Calculate pixel width per subdivision
    const pixelsPerQuarter = this.barWidth / 4;
    const pixelsPerEighth = this.barWidth / 8;
    const pixelsPerSixteenth = this.barWidth / 16;

    // Show 8th notes if they're spaced at least MIN_PIXEL_SPACING pixels apart
    this.show8ths = pixelsPerEighth >= MIN_PIXEL_SPACING;

    // Show 16th notes if they're spaced at least MIN_PIXEL_SPACING pixels apart
    this.show16ths = pixelsPerSixteenth >= MIN_PIXEL_SPACING;
  }

  getBarLeftPosition(bar: number) {
    return (this.timelineRect.width / this.bars) * bar - 1;
  }

  /**
     * Handle pointer move for both note dragging and resizing
     */
  onDocumentPointerMove(e: PointerEvent) {
    e.stopPropagation();

    const dragState = this.inputService.getDragState();

    // Check if drag was initiated but movement threshold not met yet
    if (dragState.active && !this.inputService.isCurrentlyDragging()) {
      // Calculate movement distance
      const deltaX = e.clientX - dragState.startClientX;
      const deltaY = e.clientY - dragState.startClientY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      console.log('📊 Threshold check:', {
        dragStateActive: dragState.active,
        isCurrentlyDragging: this.inputService.isCurrentlyDragging(),
        distance: distance.toFixed(2),
        exceedsThreshold: distance > 3,
      });
      
      // If movement exceeds threshold (3px), activate actual dragging
      if (distance > 3) {
        console.log('🔥 THRESHOLD MET! Setting dragWasActivated = true', {
          dragState: dragState.type,
          noteIds: dragState.noteIds,
        });
        this.inputService.setDragging(true);
        this.dragWasActivated = true; // Track that we actually dragged
        // Close note controls immediately when drag starts (isDragging$ will hide them via binding)
        console.log('🟠 Closing controls - drag started. _clickedSequenceObjectID was:', this._clickedSequenceObjectID);
        this._clickedSequenceObjectID = null;
        
        // Clear selection if dragging an unselected note
        // This prevents previously selected notes from staying selected when dragging a different note
        const draggedNoteIds = dragState.noteIds || [];
        const currentSelection = this.timelineState.getSelectedNoteIds();
        const isAnyDraggedNoteSelected = draggedNoteIds.some(id => currentSelection.includes(id));
        
        if (!isAnyDraggedNoteSelected && draggedNoteIds.length > 0) {
          // Dragging unselected note(s) - clear previous selection
          console.log('🟠 Dragging unselected note - clearing previous selection');
          this.timelineState.clearSelection();
        }
        // Otherwise keep selection as-is (dragging selected notes stays selected)
        
        this.cdr.markForCheck();
      } else {
        // Movement below threshold, don't update DOM yet
        return;
      }
    }

    // Handle drag/resize via services
    if (this.inputService.isCurrentlyDragging()) {
      document.body.style.cursor = 'grabbing';
      console.log('📍 isDragging = true, processing drag');
      
      const dragState = this.inputService.getDragState();
      
      // Use cached rect during drag to prevent recalculation
      const rect = this.cachedTimelineRect || this.timelineRect;
      
      // Update row detection for move operations only (not resize)
      if (dragState.type === 'move' && rect) {
        this.inputService.updateDragRow(
          e.clientY,
          rect.top,
          rect.height,
          this.rows
        );
      }
      
      const update = this.inputService.updateDrag(e);
      
      // Apply DOM updates for smooth visual feedback during drag
      if (update.isValid && rect) {
        for (const [noteId, position] of update.positions) {
          const noteElement = this._timeline?.nativeElement?.querySelector(
            `[data-note-id="${noteId}"]`
          ) as HTMLElement;
          
          if (noteElement) {
            const noteX = (position.time / this._bars) * rect.width;
            const noteWidth = (position.length / this._bars) * rect.width;
            
            console.log('🎨 Updating note DOM:', {
              noteId,
              position,
              noteX,
              noteWidth,
              bars: this._bars,
              rectWidth: rect.width,
            });
            
            noteElement.style.left = noteX + 'px';
            noteElement.style.width = noteWidth + 'px';
            
            // Only update Y position for move operations (not resize)
            if (dragState.type === 'move') {
              // Calculate this note's row based on its original row offset
              const currentRowIndex = dragState.currentRowIndex !== undefined ? dragState.currentRowIndex : 0;
              const originalRowIndex = dragState.originalRowIndices?.get(noteId) || 0;
              const rowOffset = originalRowIndex - dragState.startRowIndex;
              // Allow negative row indices during drag, but clamp final position to valid range
              const unclamped = currentRowIndex + rowOffset;
              const noteRowIndex = Math.max(0, Math.min(unclamped, this.rows - 1));
              const noteY = (this.wrapperHeight / this.rows) * noteRowIndex;
              
              console.log('🎨 Updating note row:', {
                noteId,
                currentRowIndex,
                originalRowIndex,
                rowOffset,
                unclamped,
                noteRowIndex,
                noteY,
                wrapperHeight: this.wrapperHeight,
                rows: this.rows,
              });
              
              noteElement.style.top = noteY + 'px';
            }
          }
        }
      }
    }

    // Handle rectangular selection
    if (this.selectionService.isCurrentlyDragSelecting()) {
      this.selectionService.updateDragSelection(e);
    }
  }

  /**
   * Handle note body drag movement
   */
  private handleNotePointerMove(e: PointerEvent) {
    console.log('🟠 handleNotePointerMove - checking conditions', {
      isPointerDown: this.isPointerDown,
      noteEle: !!this.noteEle,
      selectedNote: !!this.selectedNote,
      draggedNoteElement: !!this.draggedNoteElement
    });
    
    if (!this.isPointerDown) {
      console.log('❌ !isPointerDown');
      return;
    }
    if (!this.noteEle) {
      console.log('❌ !noteEle');
      return;
    }
    if (!this.selectedNote || !this.draggedNoteElement) {
      console.log('❌ !selectedNote || !draggedNoteElement');
      return;
    }

    this.pointerMovedAmount += Math.sqrt(
      Math.pow(e.clientX - this.pointerPositionX, 2) +
        Math.pow(e.clientY - this.pointerPositionY, 2),
    );

    this.pointerPositionX = e.clientX;
    this.pointerPositionY = e.clientY;

    console.log('📏 Movement amount:', this.pointerMovedAmount);

    // Only mark as drag if movement exceeds threshold
    if (this.pointerMovedAmount < 3) {
      console.log('⏸️ Movement below threshold (3px), not dragging yet');
      return;
    }
    
    console.log('✅ Starting actual drag, pointerMovedAmount:', this.pointerMovedAmount);

    this.isNoteDrag = true;
    // Close controls immediately when drag starts
    this._clickedSequenceObjectID = null;
    this.cdr.markForCheck();
    document.body.style.cssText = "cursor: grabbing !important;";

    const width = this.timelineRect.width;

    // Calculate position maintaining cursor offset
    let posX = e.clientX - this.timelineRect.left - this.clickOffsetX;

    // Right boundary check
    if (posX + this.noteRect.width > width) {
      posX = width - this.noteRect.width;
    }

    // Left boundary check
    if (posX < 0) {
      posX = 0;
    }

    // Convert pixel position to time in bars
    const xPercent = posX / width;
    let time = xPercent * this._bars;

    // Quantize to grid if Shift is NOT held and quantization is enabled
    if (!e.shiftKey && this.gridQuantize !== null) {
      const gridInBars = this.gridQuantize;
      time = Math.round(time / gridInBars) * gridInBars;
    }

    // Initialize alteredSequenceObject if not already done
    if (!this.alteredSequenceObject) {
      this.alteredSequenceObject = { ...this.selectedNote };
    }

    // Only update if time actually changed
    const currentTime =
      typeof this.alteredSequenceObject.time === "number"
        ? this.alteredSequenceObject.time
        : 0;
    if (Math.abs(currentTime - time) > 0.0001) {
      this.alteredSequenceObject.time = time;
      // Update DOM directly for smooth drag (no change detection)
      this.draggedNoteElement.style.left = posX + "px";
    }

    this.updateWrapperHeight();
  }

  /**
     * Unified pointer up handler for both drag and rectangular selection
     */
  onDocumentPointerUp(e: PointerEvent) {
    console.log('🎯 onDocumentPointerUp called');
    e.stopPropagation();

    // Handle rectangular selection end first
    const selectedIds = this.selectionService.endDragSelection(e);
    if (selectedIds.length > 0) {
      console.log('📦 Rectangular selection ended, selected:', selectedIds);
      this.timelineState.selectNotes(selectedIds);
    } else {
      // Handle drag/resize end via service
      const commit = this.inputService.endDrag(e);
      console.log('🏁 Drag ended, commit:', commit);
      
      // Clear cached rect after drag
      this.cachedTimelineRect = null;
      
      // ALWAYS clear inline DOM styles (whether drag succeeded or not)
      // This prevents residual styles from mini-movements
      const dragState = this.inputService.getDragState();
      if (dragState.noteIds && dragState.noteIds.length > 0) {
        for (const noteId of dragState.noteIds) {
          const noteElement = this._timeline?.nativeElement?.querySelector(
            `[data-note-id="${noteId}"]`
          ) as HTMLElement;
          if (noteElement) {
            noteElement.style.left = '';
            noteElement.style.width = '';
            noteElement.style.top = '';
          }
        }
      }
      
      if (commit.success) {
        this.update();
        this.updateWrapperHeight();
        this.saveUndo();
      }
      
      // Open note controls ONLY if this was a pure click (never entered drag mode)
      // Check if the target was a note element
      const target = e.target as HTMLElement;
      const noteElement = target.closest('.note') as HTMLElement | null;
      
      // Only open controls if:
      // 1. No drag was activated (movement never exceeded threshold), AND
      // 2. A note was clicked on pointerdown AND
      // 3. The pointerup happened on the same note
      const wasPureClick = !this.dragWasActivated && this.clickedNoteIdOnPointerDown !== null;
      
      console.log('📌 onDocumentPointerUp note element check:', {
        hasNoteElement: !!noteElement,
        commitSuccess: commit.success,
        dragWasActivated: this.dragWasActivated,
        clickedNoteIdOnPointerDown: this.clickedNoteIdOnPointerDown,
        wasPureClick,
        dragState: dragState,
      });
      
      if (wasPureClick && noteElement) {
        // This was a pure click (never exceeded drag threshold)
        const noteId = parseInt(noteElement.getAttribute('data-note-id') || '0');
        // Only handle controls if the pointerup happened on the same note that was clicked
        if (noteId === this.clickedNoteIdOnPointerDown) {
          // Check if note is selected - if not, select it first
          const isNoteSelected = this.timelineState.isNoteSelected(noteId);
          if (!isNoteSelected) {
            console.log('📋 Pure click on unselected note - selecting it first:', noteId);
            this.timelineState.selectNote(noteId, true);
          }
          
          const selectedNote = this.sequence.find(n => n.id === noteId);
          if (selectedNote) {
            console.log('📋 onDocumentPointerUp: Opening controls for note:', noteId);
            this._clickedSequenceObjectID = selectedNote.id;
            console.log('🟢 SET _clickedSequenceObjectID on pointerup:', this._clickedSequenceObjectID);
          }
        }
      } else {
        console.log('📋 onDocumentPointerUp: NOT opening controls - drag occurred or not a pure click. dragWasActivated:', this.dragWasActivated, 'clickedNoteIdOnPointerDown:', this.clickedNoteIdOnPointerDown);
      }
      
      console.log('🟡 RESET clickedNoteIdOnPointerDown from', this.clickedNoteIdOnPointerDown, 'to null');
      // Reset the clicked note tracker for the next gesture
      this.clickedNoteIdOnPointerDown = null;
    }

    // CRITICAL: Always clear alteredSequenceObject after drag ends
    // Otherwise it persists and breaks subsequent drags
    if (this.alteredSequenceObject) {
      console.log('🧹 Clearing alteredSequenceObject');
      this.alteredSequenceObject = null;
    }

    document.body.style.cursor = 'default';
    this.cdr.markForCheck();
  }

  /**
    * Handle note drag end - commit changes
    * DEPRECATED: This function is from the old drag system and may conflict with new system
    */
  private handleNotePointerUp(e: PointerEvent) {
    console.log('🟣 handleNotePointerUp called (OLD SYSTEM)', { isNoteDrag: this.isNoteDrag, selectedNote: !!this.selectedNote });
    if (!this.selectedNote) {
      console.log('❌ !selectedNote, returning');
      return;
    }

    if (
      this.selectedNote &&
      this.alteredSequenceObject &&
      this.selectedNote.id === this.alteredSequenceObject.id
    ) {
      if (this.originalNoteTime !== this.alteredSequenceObject.time) {
        this.sequencer.updateNote(
          this.alteredSequenceObject.id,
          this.alteredSequenceObject.note,
          this.alteredSequenceObject.time,
          this.alteredSequenceObject.length,
          this.alteredSequenceObject.velocity,
        );

        this.updateWrapperHeight();
        this.saveUndo();
      }
    }

    // Only clear manual DOM styles if the note actually changed position
    const noteChanged =
      this.originalNoteTime !== this.alteredSequenceObject.time;
    if (this.draggedNoteElement && noteChanged) {
      this.draggedNoteElement.style.left = "";
    }

    // Determine if this was just a click or actual drag
    if (!this.isNoteDrag) {
      // This was just a click (never entered drag mode) - show controls
      this._clickedSequenceObjectID = this.selectedNote.id;
      console.log('✅ CLICK: Selected note for controls', this.selectedNote.id, 'isNoteDrag:', this.isNoteDrag);
    } else {
      // This was a drag - hide controls after dragging
      this._clickedSequenceObjectID = null;
      console.log('✅ DRAG: Cleared selection, controls hidden', 'isNoteDrag:', this.isNoteDrag);
    }

    // Reset drag state
    this.selectedNote = null;
    this.alteredSequenceObject = null;
    this.originalNoteTime = null;
    this.clickOffsetX = 0;
    this.noteRect = null;
    this.isNoteDrag = false;
    this.noteEle = null;
    this.draggedNoteElement = null;

    // Trigger change detection for selection state update
    this.cdr.markForCheck();
  }

  /**
   * Keyboard action callbacks
   */
  private onCopyFeedback(): void {
    const count = this.timelineState.getSelectedCount();
    console.log(`Copied ${count} note(s)`);
  }

  private onPasteFeedback(): void {
    // Paste at next bar from current sequencer time
    const currentTime = this.sequencer.isPlaying
      ? (Tone.getTransport().position as number)
      : 0;

    const newNotes = this.timelineState.pasteAtNextBar(currentTime);
    if (newNotes.length > 0) {
      // Add notes to sequencer and preserve their row indices
      const newNoteIds: number[] = [];
      for (const note of newNotes) {
        const createdNote = this.sequencer.addNote(note.note, note.time, note.length, note.velocity);
        // Preserve the row index from pasted note
        if (createdNote && note.rowIndex !== undefined) {
          createdNote.rowIndex = note.rowIndex;
        }
        if (createdNote) {
          newNoteIds.push(createdNote.id);
        }
      }
      this.timelineState.selectNotes(newNoteIds);
      this.update();
      this.saveUndo();
      console.log(`Pasted ${newNotes.length} note(s)`);
    }
  }

  private onDeleteFeedback(): void {
    // Delete was already handled by service
    this.update();
    this.saveUndo();
  }

  /**
    * Handle pointer cancel (e.g., pointer leaves window)
    */
  onDocumentPointerCancel(e: PointerEvent) {
    e.stopPropagation();
    this.inputService.cancelDrag();
    this.selectionService.cancelDragSelection();
    document.body.style.cursor = 'default';
  }

  /**
   * Handle resize drag movement
   * Hold Shift to bypass quantization (free-form resize)
   */
  resizeNoteMoveHandler = (e: PointerEvent) => {
    if (!this.dragState.active || !this.dragState.type?.includes("resize"))
      return;
    if (!this.selectedNote || !this.draggedNoteElement) return;

    const deltaX = e.clientX - this.dragState.startClientX;
    const hasMovement = Math.abs(deltaX) > 3;

    // Only initialize alteredSequenceObject and apply styles if there's actual movement
    if (!hasMovement) return;

    // Initialize alteredSequenceObject on first significant movement
    if (!this.alteredSequenceObject) {
      this.alteredSequenceObject = { ...this.selectedNote };
    }

    // Convert pixels to bar units
    const pixelsPerBar = this.timelineRect.width / this._bars;
    const deltaInBars = deltaX / pixelsPerBar;

    let newStartTime = this.dragState.startTime;
    let newEndTime = this.dragState.endTime;
    const minDuration = 0.05; // Minimum note length in bars

    if (this.dragState.handle === 0) {
      // Dragging start handle
      newStartTime = this.dragState.startTime + deltaInBars;
      newStartTime = Math.max(
        0,
        Math.min(newStartTime, newEndTime - minDuration),
      );

      // Apply quantization if enabled and Shift not held
      if (!e.shiftKey && this.gridQuantize !== null) {
        newStartTime =
          Math.round(newStartTime / this.gridQuantize) * this.gridQuantize;
      }
    } else {
      // Dragging end handle
      newEndTime = this.dragState.endTime + deltaInBars;
      newEndTime = Math.max(newStartTime + minDuration, newEndTime);

      // Apply quantization if enabled and Shift not held
      if (!e.shiftKey && this.gridQuantize !== null) {
        newEndTime =
          Math.round(newEndTime / this.gridQuantize) * this.gridQuantize;
      }
    }

    this.alteredSequenceObject.time = newStartTime;
    this.alteredSequenceObject.length = newEndTime - newStartTime;

    // Update DOM directly for smooth drag (no change detection)
    const newWidth =
      ((newEndTime - newStartTime) / this._bars) * this.timelineRect.width;

    // Only update left position when dragging start handle
    if (this.dragState.handle === 0) {
      const newLeft = (newStartTime / this._bars) * this.timelineRect.width;
      this.draggedNoteElement.style.left = newLeft + "px";
    }

    this.draggedNoteElement.style.width = newWidth + "px";
  };

  /**
    * End resize operation
    */
  resizeNoteEndHandler = (e: PointerEvent) => {
    if (!this.dragState.active || !this.dragState.type?.includes("resize"))
      return;

    // Only commit if there was actual resize movement
    const hasMovement = Math.abs(e.clientX - this.dragState.startClientX) > 3;

    if (hasMovement && this.selectedNote && this.alteredSequenceObject) {
      this.sequencer.updateNote(
        this.selectedNote.id,
        this.alteredSequenceObject.note,
        this.alteredSequenceObject.time,
        this.alteredSequenceObject.length,
        this.alteredSequenceObject.velocity,
      );

      this.updateWrapperHeight();
      this.saveUndo();
    }

    // Only clear DOM styles if we actually applied them (i.e., if alteredSequenceObject was created)
    if (this.alteredSequenceObject && this.draggedNoteElement) {
      if (this.dragState.handle === 0) {
        this.draggedNoteElement.style.left = "";
      }
      this.draggedNoteElement.style.width = "";
    }

    // Reset drag state
    this.dragState = {
      active: false,
      type: null,
      noteId: null,
      startClientX: 0,
      startClientY: 0,
      startTime: 0,
      endTime: 0,
      dragOffsetX: 0,
      dragOffsetY: 0,
      handle: 0,
      startRowIndex: 0,
    };

    this.selectedNote = null;
    this.alteredSequenceObject = null;
    this.draggedNoteElement = null;

    // Trigger change detection after reset
    this.cdr.markForCheck();
  };

  /** The Note component is filled with a SequenceObject. On some events like dragndrop
   * the selected sequenceObject is replaced with an temporal sequenceObject to visualize the process
   * without manipulating the real sequence of the sequencer. */
  getSequenceObject(note: SequenceObject): SequenceObject {
    if (this.alteredSequenceObject && this.alteredSequenceObject.id == note.id)
      return this.alteredSequenceObject;
    return note;
  }

  updateRows() {
    // rows = getMaxDifferentNotes(sequencer.sequence).length

    this.rows = this.sequence.length;

    return this.rows;
  }

  /** Returns the maximal amount of overlaps of the array */
  getMaxDifferentNotes(notes: SequenceObject[]) {
    let _notes = [];
    for (let n of notes) {
      if (_notes.indexOf(n.note) == -1) _notes.push(n.note);
    }

    return _notes;
  }

  /** Returns an array with all notes (including the passed in note) that overlap with the passed in note. */
  getYOverlappingNotesByNote = (() => {
    let t1: number, t2: number, l1: number, l2: number;

    return (note: SequenceObject) => {
      const notes: SequenceObject[] = [note];

      t1 = Tone.Time(note.time).toSeconds();
      l1 = Tone.Time(note.length).toSeconds();

      for (let n2 of this.sequencer.sequence) {
        t2 = Tone.Time(n2.time).toSeconds();
        l2 = Tone.Time(n2.length).toSeconds();

        if ((t1 > t2 && t1 < t2 + l2) || (t1 + l1 > t2 && t1 + l1 < t2 + l2)) {
          notes.push(n2);
        }
      }

      return notes;
    };
  })();

  /** Returns the Y position for the passed in note. Y position is for HTML */
  getNoteY = (note: SequenceObject) => {
    // Use the note's rowIndex if available, otherwise fall back to sequence index
    const rowIndex = note.rowIndex !== undefined ? note.rowIndex : this.sequencer.sequence.indexOf(note);
    
    // Update row count if we see notes in higher rows
    const maxRowIndex = Math.max(...this.sequencer.sequence.map(n => n.rowIndex || 0));
    const requiredRows = maxRowIndex + 1;
    if (requiredRows > this.rows) {
      this.rows = requiredRows;
      this.updateWrapperHeight();
      this.updateNoteHeight();
    }

    return (this.wrapperHeight / this.rows) * rowIndex;
  };

  /** Returns the HTML height for the passed in note */
  updateNoteHeight = () => {
    return (this.noteHeight = this.wrapperHeight / this.rows);
  };

  updateWrapperHeight() {
    if (this.rows < 3) return (this.wrapperHeight = 100);
    return (this.wrapperHeight = this.rows * this.minNoteHeight);
  }

  /**
   * Quantize time value in bars to nearest grid position
   * @param timeInBars - Time in bar units
   * @returns Quantized time
   */
  quantizeToGrid(timeInBars: number): number {
    if (this.gridQuantize === null) return timeInBars;
    return Math.round(timeInBars / this.gridQuantize) * this.gridQuantize;
  }

  /**
   * Calculate row position based on overlapping notes
   * Notes that overlap get stacked vertically
   */
  calculateNoteRow(note: SequenceObject): number {
    const overlappingNotes = this.getYOverlappingNotesByNote(note);

    // Sort overlapping notes by time
    overlappingNotes.sort((a, b) => {
      const timeA = Tone.Time(a.time).toSeconds();
      const timeB = Tone.Time(b.time).toSeconds();
      return timeA - timeB;
    });

    // Find this note's position in the overlap group
    return overlappingNotes.indexOf(note);
  }

  /**
   * Update row array for rendering timeline rows
   */
  updateRowArray() {
    this.rowArray = Array.from({ length: this.rows }, (_, i) => i);
  }

  /**
   * Handle row double-click to add a note to that row
   */
  onRowDblClick(e: MouseEvent, rowIndex: number) {
    e.stopPropagation();

    this.timelineRect = this.timeline.getBoundingClientRect();

    const width = this.timelineRect.width;
    const posX = e.clientX - this.timelineRect.left;

    let xInPercent = posX / width;
    let time = Math.round(this.bars * xInPercent * 1000) / 1000;

    this.addNote(time, rowIndex);

    this.update();
    this.saveUndo();
  }

  /**
   * Add a row to the timeline
   */
  onAddRow() {
    this.inputService.addRow();
    this.rows += 1;
    this.updateWrapperHeight();
    this.updateNoteHeight();
    this.updateRowArray();
    this.cdr.markForCheck();
  }

  saveUndo = () => {
    Storage.saveUndo(JSON.stringify(this.sequencer.synthesizer.serializeOut()));
  };
}
