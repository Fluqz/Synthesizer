
import * as Tone from "tone";
import { Synthesizer } from "../synthesizer/synthesizer";
import { Sequencer, type SequenceObject } from "../synthesizer/sequencer";
import { Storage } from "../core/storage";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, input, Input, OnDestroy, Output } from "@angular/core";
import { CommonModule } from "@angular/common";



@Component({

    selector: 'sy-note',
    standalone: true,
    imports: [ CommonModule ],     
    changeDetection: ChangeDetectionStrategy.OnPush,
    
    template: `
        
    <div *ngIf="sequencer != undefined" class="note-wrapper">

        <div class="note" 
            [class.selected]="isSelected"
            (dblclick)="onNoteDblClick($event, note)"
            [style.top.px]="yPos"
            [style.height.px]="height"
            [style.left.px]="((getSeconds(note.time) / sequencer.bars) * timelineRect.width)"
            [style.width.px]="getNoteWidth()">
            
            <!-- Compact view (default) -->
            <div class="note-display">
                {{ noteDisplayText + octaveDisplayText }}
            </div>

            <ng-content></ng-content>

            <!-- Expanded view (on hover via CSS) -->
            <div class="note-controls" [class.selected]="isSelected" [style.bottom.px]="-height" [style.line-height.px]="height" (dblclick)="onNoteControlDblClick($event)">
                <div class="control-group">
                    <div class="btn note-btn"
                            title="Note - Click to increase; Shift - Click to decrease" 
                            (pointerdown)="$event.stopPropagation()"
                            (pointerup)="$event.stopPropagation()"
                            (click)="onChangeNote($event, note)">
                        {{ noteDisplayText }}
                    </div>
                    <div class="btn octave-btn"
                            title="Octave - Click to increase; Shift - Click to decrease" 
                            (pointerdown)="$event.stopPropagation()"
                            (pointerup)="$event.stopPropagation()"
                            (click)="onOctaveClick($event, note)">
                        {{ octaveDisplayText }}
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
        color: var(--c-b);

        text-align: center;
        display: flex;
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
        line-height: 1;
        white-space: nowrap;
        opacity: 1;
    }

    /* Expanded controls - hidden by default, shown on hover */
    .note-controls {
        position: absolute;
        bottom: -75px;
        left: 0px;
        background-color: var(--c-y);
        z-index: 10;
        display: flex;
        flex-direction: center;
        justify-content: center;
        align-items: center;

        overflow: hidden;
        width: 0px;
        height: 0px;
        pointer-events: none;
    }

    .note-controls.selected {
        width: 100%;
        height: 100%;
        pointer-events: auto;
    }

    .note-controls .control-group {
        display: flex;
        width: 100%;
        height: 100%;
        pointer-events: auto;
    }

    .note .btn {
        z-index: 2;
        min-width: 30px;
        width: 50%;
        height: 100%;
        cursor: pointer;
        color: inherit;
        pointer-events: auto;
        line-height:inherit;
    }

    .note .btn:hover {
        background-color: rgba(0, 0, 0, 0.4);
        color: var(--c-b);
    }

    .note .btn:active {
        background-color: rgba(0, 0, 0, 0.6);
    }

    /* Resize handles on left and right edges - much larger and more visible */
    ::ng-deep .note .drag-handle {
        position: absolute;
        top: 0px;
        height: 100%;
        width: 5px;
        cursor: ew-resize;
        user-select: none;
        touch-action: none;
        z-index: 20;
        pointer-events: auto;
        opacity: 0;

        background-color: var(--c-g);
    }

    ::ng-deep .note .drag-handle:hover {
        width: 10px;
        opacity: .6;
    }

    ::ng-deep .note .drag-handle:active {
        opacity: .9;
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

        const oldNote = this._note
        this._note = note

        if(oldNote != note) {
            
            this.noteDisplayText = this.getNote(this._note)
            this.octaveDisplayText = this.getOctave(this._note)
        }
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

    public noteDisplayText: string = ''
    public octaveDisplayText: string = ''

    constructor(public cdr: ChangeDetectorRef) {}


    getSeconds(t: Tone.Unit.Time) {

        return Tone.Time(t).toSeconds()
    }

    onNoteClick(e, note: SequenceObject) {

        e.stopPropagation()

    }

    /** DblClick Note Event 
     * TODO _------ -PUT IN TIMELINE!!!!!!
     */
    onNoteDblClick(e, note: SequenceObject) {

        e.stopPropagation()

        this.onDelete.next(this.note)
    }

    onNoteControlDblClick(e) {

        e.stopPropagation()
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
    onChangeNote(e: MouseEvent, note: SequenceObject) {

        e.stopPropagation()

        const fullNote = Tone.Frequency(this._note.note).toNote().toString()
        
        // Extract octave (last digit(s))
        const octaveMatch = fullNote.match(/\d+$/)
        const octave = octaveMatch ? octaveMatch[0] : ''
        // Current note is everything except the octave
        const currentNote = fullNote.substring(0, fullNote.length - octave.length)

        let i = Synthesizer.notes.indexOf(currentNote)

        // Navigate note list
        if(!e.shiftKey) i++
        if(e.shiftKey) i--

        // Wrap around
        if(i > Synthesizer.notes.length - 1) i = 0
        else if(i < 0) i = Synthesizer.notes.length - 1

        const newNote = Synthesizer.notes[i] + octave

        // Update display text BEFORE updating note to prevent it being overwritten
        this.noteDisplayText = Synthesizer.notes[i]

        // Update via sequencer (not direct mutation)
        this.sequencer.updateNote(
            this._note.id,
            newNote,
            this._note.time,
            this._note.length,
            this._note.velocity
        )

        // Update internal note reference with the new note value
        this._note.note = newNote

        this.cdr.detectChanges()

        this.saveUndo()
    }

    /**
     * Change octave on click
     * Click: next octave, Shift+Click: previous octave
     */
    onOctaveClick(e: MouseEvent, note: SequenceObject) {

        e.stopPropagation()

        const fullNote = Tone.Frequency(this._note.note).toNote().toString()
        // Extract octave (last digit(s))
        const octaveMatch = fullNote.match(/\d+$/)
        const octave = octaveMatch ? octaveMatch[0] : ''
        // Current note is everything except the octave
        const currentNote = fullNote.substring(0, fullNote.length - octave.length)

        let i = Synthesizer.octaves.indexOf(+octave)

        // Navigate octave list
        if(!e.shiftKey) i++
        if(e.shiftKey) i--

        // Wrap around
        if(i > Synthesizer.octaves.length - 1) i = 0
        else if(i < 0) i = Synthesizer.octaves.length - 1

        const newNote = currentNote + Synthesizer.octaves[i]

        // Update display text BEFORE updating note to prevent it being overwritten
        this.octaveDisplayText = Synthesizer.octaves[i].toString()

        // Update via sequencer (not direct mutation)
        this.sequencer.updateNote(
            this._note.id,
            newNote,
            this._note.time,
            this._note.length,
            this._note.velocity
        )

        // Update internal note reference with the new note value
        this._note.note = newNote

        this.cdr.detectChanges()

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