

import * as Tone from "tone";


import { Synthesizer, type Channel } from "../synthesizer/synthesizer";
import { type NoteLength, type SequenceObject, Sequencer } from "../synthesizer/sequencer";
import { Storage } from "../core/storage";
import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from "@angular/core";
import { TimelineComponent } from "./Timeline.component";
import { getChannelColor } from "../core/colors";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";


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


@Component({


    selector: 'sy-sequencer',
    standalone: true,
    imports: [ CommonModule, TimelineComponent, FormsModule ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `

    <div *ngIf="sequencer != undefined" class="sequencer-wrapper">

        <div class="sequencer-menu">

            <div class="btn delete" (click)="onDelete()">&#x2715;</div>
            
            <div class="btn duplicate" (click)="onDuplicateHandler($event)">D</div>

            <div class="btn play" [class.active]="sequencer.isPlaying" title="Play" (click)="toggleStartStop()">{{ !sequencer.isPlaying ? 'Play' : 'Stop'}}</div>

            <div class="btn noteLength" (click)="onNoteLength($event)">{{sequencer.noteLength}}</div>

            <div class="channels-container">

                <div class="channel-input-group">
                    <input 
                        type="number" 
                        class="channel-input"
                        min="0" 
                        max="15"
                        placeholder="+" 
                        [(ngModel)]="channelInputValue"
                        (keydown)="onChannelInputKeydown($event)"
                        title="Add channel (0-15)"
                    />
                </div>

                <div class="active-channels">
                    @for(channelNum of sequencer.channels; track channelNum; let i = $index) {
                        <div 
                            class="channel-badge"
                            [style.background-color]="getChannelColor(channelNum)"
                            [title]="'Channel ' + channelNum + ' - Click to toggle, Double-click to remove'"
                            (click)="toggleChannel(channelNum)"
                            (dblclick)="removeChannel(channelNum)">
                            {{ channelNum }}
                        </div>
                    }
                </div>

            </div>

        </div>
            
        <div class="sequence">

            <div class="sequence-wrapper">

                <sy-timeline [sequencer]="sequencer" [sequence]="sequencer.sequence" [bars]="bars" (onAddNote)="addNote($event)" />

                <div class="add-remove-cont">

                    <div class="add-bar" (click)="addBar($event)">+</div>
                    <div class="remove-bar" (click)="removeBar($event)">-</div>

                </div>

            </div>

        </div>

    </div>

`,
    styles: `


    .sequencer-wrapper {

        display: inline-flex;
        align-items: center;

        /* height: 75px; */
        min-width: 400px;
        width: 100%;
        height: auto;

        background-color: var(--c-b);
    }

    .sequencer-menu {

        width: 250px;

        display: inline-block;
    }

    .sequencer-wrapper .sequence {

        width: calc(100% - 250px);
        height: 100%;
    }

    .sequencer-wrapper .sequence-wrapper {

        position: relative;

        width: 100%;
        height: 100%;

        display: inline-flex;

        justify-content: center;
        align-items: center;
    }

    .sequencer-wrapper .sequence .add-remove-cont {

        width: 50px;
        align-self: stretch;
    }
    
    .sequencer-wrapper .sequence .remove-bar,
    .sequencer-wrapper .sequence .add-bar {

        display: inline-flex;
        justify-content: center;
        align-items: center;

        cursor: pointer;

        width: 50px;
        height: 50%;
        background-color: var(--c-w);
        color: var(--c-b);
    }

    .sequencer-wrapper .sequence .remove-bar:hover,
    .sequencer-wrapper .sequence .add-bar:hover {

        background-color: var(--c-b);
        color: var(--c-y);
    }

    /* Channel management UI */
    .channels-container {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        background-color: var(--c-b);
    }

    .channel-input-group {
        display: flex;
        align-items: center;
    }

    .channel-input {
        width: 50px;
        height: 40px;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: var(--c-b);
        color: var(--c-w);
        font-weight: bold;
        text-align: center;
        font-size: 16px;
        cursor: text;
    }

    .channel-input:focus {
        outline: none;
        border-color: var(--c-y);
        box-shadow: 0 0 4px var(--c-y);
    }

    .channel-input::placeholder {
        color: var(--c-w);
        opacity: 0.6;
    }

    .active-channels {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        flex: 1;
    }

    .channel-badge {
        min-width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        color: var(--c-b);
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        user-select: none;
    }

    .channel-badge:hover {
        transform: scale(1.1);
        border-color: rgba(255, 255, 255, 0.7);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
    }

    .channel-badge:active {
        transform: scale(0.95);
    }

`,
})
export class SequencerComponent implements AfterViewInit, OnDestroy {

    private _sequencer: Sequencer
    @Input('sequencer') 
    set sequencer(s: Sequencer) {

        this._sequencer = s

        this.updateBars()
        this.updateChannel()
    }
    get sequencer() : Sequencer { return this._sequencer }

    bars: number = 0

    @Input('channelColors') channelColors: string

    @Output('onDuplicate') onDuplicate: EventEmitter<Sequencer> = new EventEmitter()
    @Output('onDeleteSequencer') onDeleteSequencer: EventEmitter<Sequencer> = new EventEmitter()
    
    /** Input field value for adding new channels */
    channelInputValue: number | null = null
    
    /** Set default note length*/
    noteLengths: NoteLength[] = ['1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64']


    constructor() {
    }

    ngAfterViewInit() {

        this.updateChannel()
        this.updateBars()
    }

    ngOnDestroy() {
        Tone.getTransport().cancel()
    }

    getChannelColor(i) {

        return getChannelColor(i)
    }

    /**
     * Update the component when sequencer channels change.
     * This is called whenever the sequencer's channel list is modified.
     */
    updateChannel() {
        // Channels are now directly shown from sequencer.channels array
        this.channelInputValue = null
    }

    updateBars() {

        this.bars = this.sequencer.bars
    }

    onNoteLength(e: MouseEvent) {

        let i = this.noteLengths.indexOf(this.sequencer.noteLength)

        if(i == -1) return this.sequencer.noteLength = this.noteLengths[0]

        if(!e.shiftKey) i++
        if(e.shiftKey) i--

        if(i >= this.noteLengths.length) i = 0
        else if(i < 0) i = (this.noteLengths.length - 1)

        this.sequencer.noteLength = this.noteLengths[i]

        this.saveUndo()
    }

    /** Add a new bar to sequencer */
    addBar(e) {
        
        this.sequencer.addBar()
        
        this.updateBars()

        this.saveUndo()
    }

    /** Remove one bar from sequencer */
    removeBar(e) {
        
        this.sequencer.removeBar()
        
        const notesToDelete = this.getNotesInBar(this.sequencer.bars)
        
        for(let n of notesToDelete) this.sequencer.removeNote(n.id)
            
        this.updateBars()

        this.saveUndo()
    }
    
    getNotesInBar(bar: number) {
        console.log('getNotesInBar', bar, this.sequencer.bars)
        
        const notes: SequenceObject[] = []
        
        for(let s of this.sequencer.sequence) {
            
            console.log('s', Tone.Time(s.time).toSeconds(), bar)
            if(Tone.Time(s.time).toSeconds() > bar) notes.push(s)
        }
        
        return notes
    }
    
    
    /** Toggle sequencer on/off */
    toggleStartStop() {
        
        if(!this.sequencer.isPlaying) {
            this.sequencer.start()
        }
        else this.sequencer.stop()
    }
    
    /**
     * Handle Enter key in channel input field to add a new channel
     */
    onChannelInputKeydown(e: KeyboardEvent) {
        
        if(e.key !== 'Enter') return
        if(this.channelInputValue === null) return
        
        const channelNum = this.channelInputValue as Channel
        
        // Validate channel number
        if(channelNum < 0 || channelNum >= Synthesizer.maxChannelCount) {
            console.warn(`Invalid channel number: ${channelNum}. Must be 0-${Synthesizer.maxChannelCount - 1}`)
            return
        }
        
        // Add the channel if not already present
        if(this.sequencer.channels.indexOf(channelNum) === -1) {
            this.sequencer.activateChannel(channelNum)
            this.updateChannel()
            this.saveUndo()
        } else {
            console.warn(`Channel ${channelNum} already active`)
        }
    }
    
    /**
     * Toggle a channel on/off (single click)
     */
    toggleChannel(channelNum: Channel) {
        
        if(this.sequencer.channels.indexOf(channelNum) !== -1) {
            // Channel is active, deactivate it
            this.sequencer.deactivateChannel(channelNum)
        } else {
            // Channel is inactive, activate it
            this.sequencer.activateChannel(channelNum)
        }
        
        this.updateChannel()
        this.saveUndo()
    }
    
    /**
     * Remove a channel (double click)
     */
    removeChannel(channelNum: Channel) {
        
        this.sequencer.deactivateChannel(channelNum)
        this.updateChannel()
        this.saveUndo()
    }
    
    /** Duplicate Sequence */
    onDuplicateHandler(e) {
        
        this.onDuplicate.next(this.sequencer)
    }
    
    /** Delete sequencer */
    onDelete() {
        
        this.onDeleteSequencer.next(this.sequencer)
    }
    
    saveUndo() {
        
        Storage.saveUndo(JSON.stringify(this.sequencer.synthesizer.serializeOut()))
    }
}