
import * as Tone from "tone";
import { Synthesizer } from "../synthesizer/synthesizer";
import { Sequencer, type SequenceObject } from "../synthesizer/sequencer";
import { Storage } from "../core/storage";
import { Component, EventEmitter, Input, OnDestroy, Output } from "@angular/core";
import { CommonModule } from "@angular/common";



@Component({

    selector: 'sy-note',
    standalone: true,
    imports: [ CommonModule ],
    template: `
        
    <div *ngIf="sequencer != undefined" class="note-wrapper">

    <div class="note" 
           [class.selected]="isSelected"
           (dblclick)="onNoteDblClick($event, note)"
           [style.top.px]="yPos"
           [style.height.px]="height"
           [style.left.px]="((getSeconds(note.time) / sequencer.bars) * timelineRect.width)"
           [style.width.px]="getNoteWidth()">

        <ng-content></ng-content>

        <!-- Compact view (default) -->
        <div class="note-display">
            {{ getNote(note) }}{{ getOctave(note) }}
        </div>

        <!-- Expanded view (on hover via CSS) -->
        <div class="note-controls">
            <div class="control-group">
                <div class="btn note-btn"
                        title="Note - Click to increase; Shift - Click to decrease" 
                        (pointerup)="onNoteClick($event, note)">
                    {{ getNote(note) }}
                </div>
                <div class="btn octave-btn"
                        title="Octave - Click to increase; Shift - Click to decrease" 
                        (pointerup)="onOctaveClick($event, note)">
                    {{ getOctave(note) }}
                </div>
            </div>
        </div>
        
        <div class="velocity" [style.height]="velocity * 100 + '%'"></div>
        
    </div>

    </div>

    `,

styles: `

    :host {

        display: inline-block;
        width: auto;
        height: auto;
    }

    .note {
        z-index: 2;
        position: absolute;

        width: 50px;
        min-width: 2px;
        height: 100%;

        background-color: var(--c-y);
        color: var(--c-o);

        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        overflow: visible;
        cursor: grab;
    }

    .note.selected {
        background-color: var(--c-o);
        z-index: 4;
    }

    .note.expanded {
        overflow: visible;
        z-index: 5;
    }

    /* Compact display - small text showing note+octave */
    .note-display {
        font-size: 10px;
        font-weight: bold;
        line-height: 1;
        white-space: nowrap;
        opacity: 1;
    }

    /* Hide compact display on hover over center area */
    .note:hover:not(:hover .drag-handle) .note-display {
        opacity: 0;
        pointer-events: none;
    }

    /* Expanded controls - hidden by default, shown on hover */
    .note-controls {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--c-y);
        z-index: 10;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 1px;
        padding: 2px;
        opacity: 0;
        pointer-events: none;
    }

    /* Show expanded controls when hovering over the note */
    .note:hover .note-controls {
        opacity: 1;
    }

    /* Only buttons are clickable in controls, not the overlay itself */
    .note-controls {
        pointer-events: none;
    }

    .note-controls .btn {
        pointer-events: auto;
    }

    /* Drag handles always on top and interactive */
    ::ng-deep .note .drag-handle {
        z-index: 20;
        pointer-events: auto;
    }

    .note-controls .control-group {
        display: flex;
        flex-direction: column;
        gap: 1px;
        width: 100%;
    }

    .note .btn {
        z-index: 2;
        padding: 1px 2px;
        min-width: 30px;
        width: 50%;
        font-size: 8px;
        cursor: pointer;
        color: inherit;
        line-height: 1;
    }

    .note .btn:hover {
        background-color: rgba(0, 0, 0, 0.4);
        color: var(--c-b);
    }

    .note .btn:active {
        transform: scale(0.95);
    }

    /* Resize handles on left and right edges - much larger and more visible */
    ::ng-deep .note .drag-handle {
        z-index: 3;
        position: absolute;
        top: 0px;
        height: 100%;
        width: 12px;
        cursor: ew-resize;
        background: rgba(255, 255, 255, 0.2);
        user-select: none;
        touch-action: none;
    }

    ::ng-deep .note .drag-handle:hover {
        width: 16px;
        background: rgba(255, 255, 255, 0.6);
    }

    ::ng-deep .note .drag-handle:active {
        background: rgba(255, 255, 255, 0.9);
    }

    ::ng-deep .note .drag-start {
        left: 0px;
    }

    ::ng-deep .note .drag-end {
        right: 0px;
    }

    ::ng-deep .note .drag-velocity {

        left: 0px;

        width: 100%;
        height: 10px;

        cursor: row-resize;
    }

    ::ng-deep .note .velocity {

        position:absolute;
        bottom: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
    }
    ::ng-deep .note .velocity.changed {

        background-color: #fff;
        opacity: .7;
    }

    .edit-note {

        width: 50px;
        height: 25px;
    }

    `,

})
export class NoteComponent implements OnDestroy {

    private _note: SequenceObject
    @Input('note') 
    set note(note: SequenceObject) {

        this._note = note
    }
    get note(): SequenceObject { return this._note }

    @Input('isSelected') isSelected: boolean = false
    @Input('timelineRect') timelineRect: DOMRect
    @Input('yPos') yPos: number = 0
    @Input('height') height: number = 0
    @Input('sequencer') sequencer: Sequencer

    @Output('onDelete') onDelete: EventEmitter<SequenceObject> = new EventEmitter()
    @Output('onDeleteSequencer') onDeleteSequencer: EventEmitter<Sequencer> = new EventEmitter()

    currentNote: string
    currentOctave: string
    width = 0
    velocity = .7
    rows: number = 1
    wrapperHeight: number = 100


    constructor() {}


    getSeconds(t: Tone.Unit.Time) {

        return Tone.Time(t).toSeconds()
    }

    /** DblClick Note Event 
     * TODO _------ -PUT IN TIMELINE!!!!!!
     */
    onNoteDblClick(e, note: SequenceObject) {

        e.stopPropagation()

        this.onDelete.next(this.note)
    }

    getNote(note: SequenceObject) {

        let n = Tone.Frequency(note.note).toNote().toString()

        const o = n[n.length - 1]

        n = n.replace(o, '')

        return n
    }

    getNoteWidth() {

        return this.width = ((Tone.Time(this.note.length).toSeconds() / this.sequencer.bars) * this.timelineRect.width)
    }

    getOctave(note: SequenceObject) {

        let n = Tone.Frequency(note.note).toNote().toString()

        const o = n[n.length - 1]

        return o
    }

    /**
     * Change note (key) on click
     * Click: next note, Shift+Click: previous note
     */
    onNoteClick(e: MouseEvent, note: SequenceObject) {

        e.stopPropagation()

        const fullNote = Tone.Frequency(note.note).toNote().toString()
        const octave = fullNote[fullNote.length - 1]
        const currentNote = fullNote.replace(octave, '')

        let i = Synthesizer.notes.indexOf(currentNote)

        // Navigate note list
        if(!e.shiftKey) i++
        if(e.shiftKey) i--

        // Wrap around
        if(i > Synthesizer.notes.length - 1) i = 0
        else if(i < 0) i = Synthesizer.notes.length - 1

        const newNote = Synthesizer.notes[i] + octave

        // Update via sequencer (not direct mutation)
        this.sequencer.updateNote(
            note.id,
            newNote,
            note.time,
            note.length,
            note.velocity
        )

        this.saveUndo()
    }

    /**
     * Change octave on click
     * Click: next octave, Shift+Click: previous octave
     */
    onOctaveClick(e: MouseEvent, note: SequenceObject) {

        e.stopPropagation()

        const fullNote = Tone.Frequency(note.note).toNote().toString()
        const octave = fullNote[fullNote.length - 1]
        const currentNote = fullNote.replace(octave, '')

        let i = Synthesizer.octaves.indexOf(+octave)

        // Navigate octave list
        if(!e.shiftKey) i++
        if(e.shiftKey) i--

        // Wrap around
        if(i > Synthesizer.octaves.length - 1) i = 0
        else if(i < 0) i = Synthesizer.octaves.length - 1

        const newNote = currentNote + Synthesizer.octaves[i]

        // Update via sequencer (not direct mutation)
        this.sequencer.updateNote(
            note.id,
            newNote,
            note.time,
            note.length,
            note.velocity
        )

        this.saveUndo()
    }

    onDeleteHandler() {

        this.onDeleteSequencer.next(this.sequencer)
    }

    saveUndo() {

        Storage.saveUndo(JSON.stringify(this.sequencer.synthesizer.serializeOut()))
    }


    ngOnDestroy(): void {
        
    }
}