
import * as Tone from "tone";
import { Sequencer, type NoteLength, type SequenceObject } from "../synthesizer/sequencer";
import { Storage } from "../core/storage";
import { BeatMachine } from "../synthesizer/beat-machine";
import { timer, type Subscription } from "rxjs";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, ViewChild } from "@angular/core";
import { NoteComponent } from "./Note.component";
import { CommonModule } from "@angular/common";
import { Synthesizer } from "../synthesizer/synthesizer";


export const convertNoteLength = (n: NoteLength) => {

    switch(n) {

        case '1': return '1n'
        case '1/2': return '2n'
        case '1/4': return '4n'
        case '1/8': return '8n'
        case '1/16': return '16n'
        case '1/32': return '32n'
        case '1/64': return '64n'
    }
}

/**
 * Timeline drag state for a single drag operation
 */
export interface DragState {
    active: boolean
    type: 'move' | 'resize-start' | 'resize-end' | null
    noteId: number | null
    startClientX: number
    startClientY: number
    startTime: number
    endTime: number
    dragOffsetX: number
    handle: number  // 0 = start, 1 = end
}

@Component({

    selector: 'sy-timeline',
    standalone: true,
    imports: [ CommonModule, NoteComponent ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `


    <div *ngIf="sequencer != undefined" class="timeline-wrapper" >

        <div class="timeline"
                #timeline
                [style.height.px]="wrapperHeight"
                (pointerdown)="onTimelineClick($event)"
                (dblclick)="onTimelineDblClick($event)"
                (resize)="onResizeTimeline($event)">
            
            <div *ngIf="timelineRect != undefined">

                <div class="timeline-ui">

                    <div *ngIf="sequencer.isPlaying == true" class="current-line" [style.transform]="'translateX(' + currentLinePos + 'px)'"></div>

                    <!-- Grid lines with adaptive detail level based on pixel density -->
                    @for(bar of barArray; track bar) {
                        <!-- 16th notes (hidden if too crowded) -->
                        @if(show16ths) {
                            @for(sixteenth of sixteenthArray; track sixteenth) {
                                <div class="grid-line grid-16th" 
                                     [style.left.px]="(barPositionArray[bar] + (sixteenth * barWidth / 16))"></div>
                            }
                        }
                        
                        <!-- 8th notes (hidden if too crowded) -->
                        @if(show8ths) {
                            @for(eighth of eighthArray; track eighth) {
                                <div class="grid-line grid-8th" 
                                     [style.left.px]="(barPositionArray[bar] + (eighth * barWidth / 8))"></div>
                            }
                        }
                        
                        <!-- Quarter notes (always visible) -->
                        @for(quarter of quarterNoteArray; track quarter) {
                            <div class="grid-line grid-quarter" 
                                 [style.left.px]="(barPositionArray[bar] + (quarter * barWidth / 4))"></div>
                        }
                        
                        <!-- Bar boundary line -->
                        <div class="grid-line grid-bar" [style.left.px]="barPositionArray[bar]"></div>
                    }
                    
                    <!-- Final bar line -->
                    <div class="grid-line grid-bar" [style.right.px]="-1" [style.left]="'unset'"></div>

                </div>

                <div class="timeline-notes">

                    @for(note of sequence; track note; let i = $index;) {

                        <sy-note [note]="getSequenceObject(note)"
                                (pointerdown)="notePointerDown($event, note)"
                                (pointerup)="notePointerUp($event, note)"
                                (onDelete)="removeNote(note)"
                                [sequencer]="sequencer"
                                [timelineRect]="timelineRect"
                                [yPos]="noteYArray[i]"
                                [height]="noteHeight"
                                [isSelected]="_clickedSequenceObjectID != null && _clickedSequenceObjectID == note.id">
                            
                                            
                            <div class="drag-handle drag-start"
                                    (pointerdown)="resizeNoteStartHandler($event, note, 'start')"></div>
                                    
                            <div class="drag-handle drag-end"
                                    (pointerdown)="resizeNoteStartHandler($event, note, 'end')"></div>

                        </sy-note>

                    }

                </div>

            </div>

        </div>

    </div>

`,
    styles: `

    :host {

        display:block;
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
        opacity: 0.08;
    }

    /* 8th notes - medium */
    .timeline .grid-8th {
        width: 0.75px;
        opacity: 0.25;
    }

    /* Quarter notes - prominent */
    .timeline .grid-quarter {
        width: 1px;
        opacity: 0.5;
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

`,
    host: {
        '(document:pointermove)': 'resizeNoteMoveHandler($event)',
        '(document:pointerup)': 'resizeNoteEndHandler($event)',
    }
    })
    export class TimelineComponent implements OnChanges, OnDestroy {

    /** Instance of the Sequencer */
    @Input('sequencer') sequencer: Sequencer

    @Input('sequence')
    get sequence(): SequenceObject[] { return this._sequence }
    set sequence(s: SequenceObject[]) {

        this._sequence = s

        this.update()
    }
    private _sequence: SequenceObject[]

    noteYArray: number[] = []

    @Input('bars')
    get bars(): number { return this._bars }
    set bars(b: number) { 

        this._bars = b

        this.update()
    }
    private _bars: number = 1

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
        handle: 0
    }

    /** 
     * Grid quantization in bar units
     * Set to null to disable quantization
     * Common values: 0.0625 (1/16), 0.125 (1/8), 0.25 (1/4)
     */
    private gridQuantize: number | null = null  // null = no snapping

    barWidth: number = 0
    barPositionArray: number[] = []
    barArray: number[] = []
    
    /** Quarter notes per bar (4/4 time) */
    quarterNoteArray: number[] = [0, 1, 2, 3]
    
    /** Eighth notes per bar (8 total) */
    eighthArray: number[] = [0, 1, 2, 3, 4, 5, 6, 7]
    
    /** 16th notes per bar (16 total) */
    sixteenthArray: number[] = Array.from({ length: 16 }, (_, i) => i)
    
    /** Whether to show 8th notes (adaptive based on pixel density) */
    show8ths: boolean = true
    
    /** Whether to show 16th notes (adaptive based on pixel density) */
    show16ths: boolean = true

    /** Height of a single note */
    noteHeight: number = 100

    /** Height of the html wrapper of the timeline. */
    wrapperHeight: number = 100

    /** Counts how many rows of notes are in the timeline  */
    rows: number = 1

    /** HTML Timline line x position */
    currentLinePos = 0

    /** Position tracking interval (60 FPS) */
    private positionUpdateInterval: any

    /** Optional: subscription to beat events for snapping UI */
    private beatSubscription: Subscription

    /** Reference to currently dragged note element for direct DOM updates */
    private draggedNoteElement: HTMLElement | null = null

    /** Timeline HTML element ref */
    @ViewChild('timeline')
    private _timeline: ElementRef<HTMLElement>
    /** Timeline HTML element ref */
    get timeline() : HTMLElement { 
        
        if(this._timeline == null) return null

        this.timelineRect = this._timeline.nativeElement.getBoundingClientRect()

        return this._timeline.nativeElement 
    }

    /** Timeline's client rect object */
    timelineRect: DOMRect

    /** Stored ID of a currently clicked SequnceObject. */
    public _clickedSequenceObjectID: number | null = null

    /** Selected note object */
    private selectedNote: SequenceObject
    /** Temporary object for altering the selected note */
    private alteredSequenceObject: SequenceObject

    private isPointerDown = false
    private isNoteDrag = false
    private noteEle: HTMLElement
    /** X Offset of mouse to element origin  */
    private clickOffsetX: number = 0
    /** Client X */
    private pointerPositionX: number = 0
    /** Client Y */
    private pointerPositionY: number = 0
    private pointerMovedAmount: number = 0

    private noteRect: DOMRect
    
    constructor(public cdr: ChangeDetectorRef) {}

    @HostListener('window:resize', ['$event'])
    onResize(e) {

        this.update()
    }

    ngAfterViewInit() {

        this.onResizeTimeline()

        if(this.sequencer == undefined) return 

        // Initialize BeatMachine
        BeatMachine.initialize()

        // Start polling transport position for smooth current-line animation
        this.startPositionTracking()

        this.update()

        this.cdr.markForCheck()
    }

    /**
     * Poll transport position 60x per second for smooth timeline animation
     * Apply negative latency offset to sync visual with audio playback
     */
    private startPositionTracking() {
        // Latency compensation in seconds - Tone.js schedules audio slightly ahead of transport position
        const AUDIO_LATENCY_MS = 50
        const AUDIO_LATENCY_SECONDS = AUDIO_LATENCY_MS / 1000
        
        this.positionUpdateInterval = setInterval(() => {
            // Ensure timelineRect is always fresh
            if(!this.timelineRect) {
                this.timelineRect = this._timeline?.nativeElement.getBoundingClientRect()
            }

            if(!this.timelineRect) return

            if(this.sequencer?.isPlaying) {
                // Get current transport position in seconds (convert from Tone.Time)
                const transportPos = Tone.getTransport().position
                const transportTimeSeconds = typeof transportPos === 'number' ? transportPos : Tone.Time(transportPos).toSeconds()
                
                // Apply latency compensation (subtract to delay visual slightly)
                const compensatedTimeSeconds = transportTimeSeconds - AUDIO_LATENCY_SECONDS
                
                // Get bar duration in seconds
                const barDurationSeconds = Tone.Time(this._bars + 'b').toSeconds()
                
                // Wrap position to loop within bar range (handles looping sequencers)
                const wrappedTimeSeconds = compensatedTimeSeconds % barDurationSeconds
                
                // Convert seconds to pixels
                const timelineWidthPixels = this.timelineRect.width
                const pixelPos = (wrappedTimeSeconds / barDurationSeconds) * timelineWidthPixels

                this.currentLinePos = Math.max(0, Math.min(pixelPos, timelineWidthPixels))
            } else {
                // Not playing - reset position
                this.currentLinePos = 0
            }
            
            // Minimal change detection
            this.cdr.markForCheck()
        }, 16) // ~60 FPS
    }

    getBarArray() {

        this.barArray.length = 0

        for(let i = 0; i < this.bars; i++) this.barArray.push(i)

        return this.barArray
    }



    getBarPositionArray() {

        this.barPositionArray.length = 0

        for(let i = 0; i < this.bars; i++) this.barPositionArray.push(this.getBarLeftPosition(i))

        return this.barPositionArray
    }

    ngOnChanges() {

        this.update()
        // if(this.selectedNote) this.getSequenceObject(this.selectedNote)
    }


    ngOnDestroy() {

        // Clean up position tracking interval
        if(this.positionUpdateInterval) {
            clearInterval(this.positionUpdateInterval)
        }

        // Clean up beat subscription if it exists
        if(this.beatSubscription) {
            this.beatSubscription.unsubscribe()
        }
    }

    update() {

        this.onResizeTimeline()
        this.updateRows()
        this.updateWrapperHeight()
        this.updateNoteHeight()
        this.updateNoteYArray()

        if(this.timeline && this.timelineRect) {

            this.barWidth = this.getBarWidth()
            this.barArray = this.getBarArray()
            this.barPositionArray = this.getBarPositionArray()
            this.updateGridVisibility()
        }
    }


    /** DblClick Timeline event */
    onTimelineDblClick(e: MouseEvent) {

        // console.log('onTimelineDblClick')

        this.timelineRect = this.timeline.getBoundingClientRect()

        const width = this.timelineRect.width
        const posX = e.clientX - this.timelineRect.left 

        let xInPercent = posX / width

        let time = Math.round(this.bars * xInPercent * 1000) / 1000

        this.addNote(time)
        
        this.update()

        this.saveUndo()
    }

    /** Pointerdown Timeline event */
    onTimelineClick(e: MouseEvent) {

        // console.log('onTimelineClick')

        this.selectedNote = null
        this._clickedSequenceObjectID = null

        this.update()

    }
    /** Resize Timeline event - need to get clientRect from timeline */
    onResizeTimeline(e?) {

        // console.log('onResizeTimeline')

        // if(e instanceof Event) timelineRect = (e.target as HTMLElement).getBoundingClientRect()
        // else timelineRect = e.getBoundingClientRect()

        if(this.timeline != undefined) this.timelineRect = this.timeline.getBoundingClientRect()
    }
    
    /** Add new note to sequencer */
    addNote(time: Tone.Unit.Time, note?: Tone.Unit.Frequency) {
        
        if(note == undefined) {
            
            if(Synthesizer.lastNotePlayed != undefined) note = Synthesizer.lastNotePlayed
            else note = 'F3'
        }
        
        this.sequencer.addNote(note, time, convertNoteLength(this.sequencer.noteLength), 1)
        
        this.update()

        this.saveUndo()
    }
    
    /** DblClick Note Event  */
    removeNote(note: SequenceObject) {

        if(this.dragState.active && this.dragState.type?.includes('resize')) return

        this.sequencer.removeNote(note.id)

        this.update()

        this.saveUndo()
    }

    updateNoteYArray() {

        this.noteYArray.length = 0

        for(let n of this.sequence) {

            this.noteYArray.push(this.getNoteY(n))
        }
    }

    getBarWidth() {
        return (this.timelineRect.width / this.bars)
    }

    /**
     * Determine which grid lines to show based on pixel density
     * Prevents crowding when zoomed out
     */
    updateGridVisibility() {
        const MIN_PIXEL_SPACING = 8  // Minimum pixels between grid lines
        
        // Calculate pixel width per subdivision
        const pixelsPerQuarter = this.barWidth / 4
        const pixelsPerEighth = this.barWidth / 8
        const pixelsPerSixteenth = this.barWidth / 16
        
        // Show 8th notes if they're spaced at least MIN_PIXEL_SPACING pixels apart
        this.show8ths = pixelsPerEighth >= MIN_PIXEL_SPACING
        
        // Show 16th notes if they're spaced at least MIN_PIXEL_SPACING pixels apart
        this.show16ths = pixelsPerSixteenth >= MIN_PIXEL_SPACING
    }

    getBarLeftPosition(bar: number) {
        return (((this.timelineRect.width / this.bars) * bar) - 1)
    }

    notePointerDown(e, note: SequenceObject) {

        e.stopPropagation()

        // Reset stored click ID on mouse down
        this._clickedSequenceObjectID = null
        this.pointerMovedAmount = 0
        
        if(e.target instanceof HTMLInputElement) return
        
        this.noteEle = e.target.closest('.note')

        if (!this.noteEle) return

        this.noteRect = this.noteEle.getBoundingClientRect()

        this.isPointerDown = true
        
        this.draggedNoteElement = this.noteEle as HTMLElement

        this.selectedNote = note
        this.clickOffsetX = e.pageX - this.noteRect.left

        this.pointerPositionX = e.clientX
        this.pointerPositionY = e.clientY

        this.alteredSequenceObject = {

            id: this.selectedNote.id,
            note: this.selectedNote.note,
            time: this.selectedNote.time,
            length: this.selectedNote.length,
            velocity: this.selectedNote.velocity
        }
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(e) {
        
        e.stopPropagation()

        this.notePointerMove(e)
        this.resizeNoteMoveHandler(e)
    }

    notePointerMove(e) {
        
        if(!this.isPointerDown) return
        if(!this.noteEle) return
        if(this.dragState.active && this.dragState.type?.includes('resize')) return
        if(!this.selectedNote || !this.draggedNoteElement) return

        
        this.pointerMovedAmount += Math.sqrt(Math.pow(e.clientX - this.pointerPositionX, 2) + Math.pow(e.clientY - this.pointerPositionY, 2))

        this.pointerPositionX = e.clientX
        this.pointerPositionY = e.clientY
        
        // Only mark as drag if movement exceeds threshold
        if(this.pointerMovedAmount < 3) return
        
        this.isNoteDrag = true
        document.body.style.cssText = 'cursor: grabbing !important;'

        const width = this.timelineRect.width
        const stop = this.timelineRect.right
        const start = 0

        // Calculate position maintaining cursor offset
        // This ensures the note stays under the cursor while dragging
        let posX = e.clientX - this.timelineRect.left - this.clickOffsetX

        // Right boundary check
        if(posX + this.noteRect.width > width) {
            posX = width - this.noteRect.width
        }
        
        // Left boundary check
        if(posX < 0) {
            posX = 0
        }
        
        // Convert pixel position to time in bars
        const xPercent = posX / width
        let time = xPercent * this._bars

        // Quantize to grid if Shift is NOT held and quantization is enabled
        if(!e.shiftKey && this.gridQuantize !== null) {
            const gridInBars = this.gridQuantize
            time = Math.round(time / gridInBars) * gridInBars
        }

        // Only update if time actually changed
        const currentTime = typeof this.alteredSequenceObject.time === 'number' ? this.alteredSequenceObject.time : 0
        if(Math.abs(currentTime - time) > 0.0001) {
            this.alteredSequenceObject.time = time
            // Update DOM directly for smooth drag (no change detection)
            this.draggedNoteElement.style.left = posX + 'px'
        }

        this.updateWrapperHeight()
    }

    /** TODO - mouseup instead of pointerup. Pointerup doesnt work why? */
    @HostListener('document:mouseup', ['$event'])
    onDocPointerUp(e:PointerEvent) {

       e.stopPropagation()

       this.isPointerDown = false
       document.body.style.cursor = 'default'

       this.onPointerUp(e)
       this.resizeNoteEndHandler(e)
    }

    @HostListener('document:pointerleave', ['$event'])
    onPointerLeaveDocument(e:PointerEvent) {

       // End note drag if pointer leaves window
       if(this.isPointerDown && this.isNoteDrag) {
           
           // Commit the note at current position
           this.onPointerUp(e)
       }

       // End resize if pointer leaves window
       if(this.dragState.active && this.dragState.type?.includes('resize')) {
           
           this.resizeNoteEndHandler(e)
       }
    }

    onPointerUp = (e) => {

        if(this.dragState.active && this.dragState.type?.includes('resize')) return
        
        if(!this.isNoteDrag) return
        
        if(this.selectedNote && this.alteredSequenceObject && this.selectedNote.id == this.alteredSequenceObject.id) {

            if(this.selectedNote.time != this.alteredSequenceObject.time) {
                
                this.sequencer.updateNote(
                    this.alteredSequenceObject.id, 
                    this.alteredSequenceObject.note, 
                    this.alteredSequenceObject.time, 
                    this.alteredSequenceObject.length, 
                    this.alteredSequenceObject.velocity
                )

                this.updateWrapperHeight()
                
                this.saveUndo()
            }
        }

        if(this.isNoteDrag) {

            // Clear manual DOM styles so binding takes over
            if(this.draggedNoteElement) {
                this.draggedNoteElement.style.left = ''
            }

            this.selectedNote = null
            this.alteredSequenceObject = null
            
            this.clickOffsetX = 0
            
            this.noteRect = null

            this.isNoteDrag = false
            this.draggedNoteElement = null
            
            // Update view after drag ends
            this.cdr.markForCheck()
        }
    }

    notePointerUp(e: PointerEvent, note: SequenceObject) {

        e.stopPropagation()

        const maxRange = 1

        if(this.pointerMovedAmount < maxRange) {

            this._clickedSequenceObjectID = note.id
        }
        else this._clickedSequenceObjectID = null
    }

    /**
     * Start resizing a note (handle pointerdown)
     * @param e - Pointer event
     * @param note - Note being resized
     * @param which - 'start' or 'end' handle
     */
    resizeNoteStartHandler = (e: PointerEvent, note: SequenceObject, which: 'start' | 'end') => {

        e.stopPropagation()

        const target = e.currentTarget as HTMLElement
        
        // Get the note element (parent of drag handle)
        this.draggedNoteElement = target.closest('.note') as HTMLElement
        
        this.dragState = {
            active: true,
            type: which === 'start' ? 'resize-start' : 'resize-end',
            noteId: note.id,
            startClientX: e.clientX,
            startClientY: e.clientY,
            startTime: Tone.Time(note.time).toSeconds(),
            endTime: Tone.Time(note.time).toSeconds() + Tone.Time(note.length).toSeconds(),
            dragOffsetX: e.clientX - target.getBoundingClientRect().left,
            handle: which === 'start' ? 0 : 1
        }

        this.selectedNote = note
        this.alteredSequenceObject = { ...note }
    }

    /**
     * Handle resize drag movement
     * Hold Shift to bypass quantization (free-form resize)
     */
    resizeNoteMoveHandler = (e: PointerEvent) => {

        if(!this.dragState.active || !this.dragState.type?.includes('resize')) return
        if(!this.selectedNote || !this.draggedNoteElement) return

        const deltaX = e.clientX - this.dragState.startClientX
        // Convert pixels to bar units
        const pixelsPerBar = this.timelineRect.width / this._bars
        const deltaInBars = deltaX / pixelsPerBar

        let newStartTime = this.dragState.startTime
        let newEndTime = this.dragState.endTime
        const minDuration = 0.05  // Minimum note length in bars

        if(this.dragState.handle === 0) {
            // Dragging start handle
            newStartTime = this.dragState.startTime + deltaInBars
            newStartTime = Math.max(0, Math.min(newStartTime, newEndTime - minDuration))
            
            // Apply quantization if enabled and Shift not held
            if(!e.shiftKey && this.gridQuantize !== null) {
                newStartTime = Math.round(newStartTime / this.gridQuantize) * this.gridQuantize
            }
        } else {
            // Dragging end handle
            newEndTime = this.dragState.endTime + deltaInBars
            newEndTime = Math.max(newStartTime + minDuration, newEndTime)
            
            // Apply quantization if enabled and Shift not held
            if(!e.shiftKey && this.gridQuantize !== null) {
                newEndTime = Math.round(newEndTime / this.gridQuantize) * this.gridQuantize
            }
        }

        this.alteredSequenceObject.time = newStartTime
        this.alteredSequenceObject.length = newEndTime - newStartTime

        // Update DOM directly for smooth drag (no change detection)
        const newWidth = ((newEndTime - newStartTime) / this._bars) * this.timelineRect.width
        
        // Only update left position when dragging start handle
        if(this.dragState.handle === 0) {
            const newLeft = ((newStartTime / this._bars) * this.timelineRect.width)
            this.draggedNoteElement.style.left = newLeft + 'px'
        }
        
        this.draggedNoteElement.style.width = newWidth + 'px'
    }

    /**
     * End resize operation
     */
    resizeNoteEndHandler = (e: PointerEvent) => {

        if(!this.dragState.active || !this.dragState.type?.includes('resize')) return

        // Commit the change
        if(this.selectedNote && this.alteredSequenceObject) {
            this.sequencer.updateNote(
                this.selectedNote.id,
                this.alteredSequenceObject.note,
                this.alteredSequenceObject.time,
                this.alteredSequenceObject.length,
                this.alteredSequenceObject.velocity
            )

            this.updateWrapperHeight()
            this.saveUndo()
        }

        // Clear manual DOM styles so binding takes over (only for start handle)
        if(this.draggedNoteElement) {
            if(this.dragState.handle === 0) {
                this.draggedNoteElement.style.left = ''
            }
            this.draggedNoteElement.style.width = ''
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
            handle: 0
        }

        this.selectedNote = null
        this.alteredSequenceObject = null
        this.draggedNoteElement = null
        
        // Update view after drag ends
        this.cdr.markForCheck()
    }


    /** The Note component is filled with a SequenceObject. On some events like dragndrop 
     * the selected sequenceObject is replaced with an temporal sequenceObject to visualize the process
     * without manipulating the real sequence of the sequencer. */
    getSequenceObject(note: SequenceObject) : SequenceObject {

        if(this.alteredSequenceObject && this.alteredSequenceObject.id == note.id) return this.alteredSequenceObject
        return note
    }


    updateRows() {

        // rows = getMaxDifferentNotes(sequencer.sequence).length

        this.rows = this.sequence.length

        return this.rows
    }

    /** Returns the maximal amount of overlaps of the array */
    getMaxDifferentNotes(notes: SequenceObject[]) {

        let _notes = []
        for(let n of notes) {

            if(_notes.indexOf(n.note) == -1) _notes.push(n.note)
        }

        return _notes
    }    

    /** Returns an array with all notes (including the passed in note) that overlap with the passed in note. */
    getYOverlappingNotesByNote = (() => {

        let t1: number,
            t2: number,
            l1: number,
            l2: number
    
        return (note: SequenceObject) => {
        
            const notes: SequenceObject[] = [ note ]

            t1 = Tone.Time(note.time).toSeconds()
            l1 = Tone.Time(note.length).toSeconds()

            for(let n2 of this.sequencer.sequence) {

                t2 = Tone.Time(n2.time).toSeconds()
                l2 = Tone.Time(n2.length).toSeconds()

                if(t1 > t2 && t1 < t2 + l2 || t1 + l1 > t2 && t1 + l1 < t2 + l2) {

                    notes.push(n2)
                }
            }

            return notes
        }
    })()

    /** Returns the Y position for the passed in note. Y position is for HTML */
    getNoteY = (note: SequenceObject) => {

        // const diffNotes = getMaxDifferentNotes(sequencer.sequence)

        // diffNotes.sort((a, b) => {

        //     return Tone.Frequency(a.note).toFrequency() - Tone.Frequency(b.note).toFrequency() 
        // })

        // let i = diffNotes.indexOf(note.note)

        // console.log('y', note.note, i, wrapperHeight, rows,(wrapperHeight / rows) * i)
        // return (wrapperHeight / rows) * i

        // sequencer.sequence.sort((a, b) => {

        //     return Tone.Frequency(a.note).toFrequency() - Tone.Frequency(b.note).toFrequency() 
        // })

        let i = this.sequencer.sequence.indexOf(note)

        // console.log('y', note.note, i, wrapperHeight, rows,(wrapperHeight / rows) * i)
        return (this.wrapperHeight / this.rows) * i
    }

    /** Returns the HTML height for the passed in note */
    updateNoteHeight = () => {

        return this.noteHeight = this.wrapperHeight / this.rows
    }

    updateWrapperHeight() {

        if(this.rows < 3) return this.wrapperHeight = 100
        return this.wrapperHeight = this.rows * 33
    }

    /**
     * Quantize time value in bars to nearest grid position
     * @param timeInBars - Time in bar units
     * @returns Quantized time
     */
    quantizeToGrid(timeInBars: number): number {
        
        if(this.gridQuantize === null) return timeInBars
        return Math.round(timeInBars / this.gridQuantize) * this.gridQuantize
    }

    /**
     * Calculate row position based on overlapping notes
     * Notes that overlap get stacked vertically
     */
    calculateNoteRow(note: SequenceObject): number {

        const overlappingNotes = this.getYOverlappingNotesByNote(note)
        
        // Sort overlapping notes by time
        overlappingNotes.sort((a, b) => {
            const timeA = Tone.Time(a.time).toSeconds()
            const timeB = Tone.Time(b.time).toSeconds()
            return timeA - timeB
        })
        
        // Find this note's position in the overlap group
        return overlappingNotes.indexOf(note)
    }

    saveUndo = () => {

        Storage.saveUndo(JSON.stringify(this.sequencer.synthesizer.serializeOut()))
    }
}