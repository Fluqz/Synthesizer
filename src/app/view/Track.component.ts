

import * as Tone from "tone"

import { Track } from "../synthesizer/track";
import { Synthesizer as Synth, type Channel } from "../synthesizer/synthesizer";
import { Instrument, type Node as _Node } from "../synthesizer/nodes";

import { Storage } from "../core/storage";
import { getChannelColor } from "../core/colors";
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output } from "@angular/core";
import { DropdownComponent } from "./Dropdown.component";
import { KnobComponent } from "./Knob.component";
import { LevelMeterComponent } from './LevelMeter.component'
import { NodeComponent } from "./Node.component";
import { CommonModule } from "@angular/common";


@Component({

    selector: 'sy-track',
    standalone: true,
    imports: [ CommonModule, DropdownComponent, KnobComponent, NodeComponent, LevelMeterComponent ],
    template: `

    <div class="track-wrapper" (click)="onClick($event)">

        <div class="node track-options" [style]="'background-color:' + color" [class.playing]="false" > <!-- todo - not reactive -->

            <!-- { track.number } -->
            <!-- { track.id } -->
            <!-- { track.instrument.name } -->

            <!-- Instrument select -->
            <sy-dropdown
                [name]="''"
                [value]="track.instrument.name"
                [options]="sources"
                (onSelect)="onChangeInstrument($event)"
            />

            <!-- Volume Knob -->
            <sy-knob 
                [name]="'Volume'" 
                [value]="track.volume"
                [min]="-70"
                [max]="6"
                (onChange)="onVolumeChange($event)" />


            <!-- <LevelMeter output={track.volumeNode} /> -->

            <!-- <Oscilloscope output={track.volumeNode} /> -->


            <div class="track-btns">

                <!-- Channel Nr -->
                <div 
                    (click)="onChannel($event)"
                    class="btn"
                    title="Channel">{{track.channel}}</div>

                <!-- Mute -->
                <div 
                    (click)="onMute($event)"
                    class="btn"
                    title="Mute" 
                    [class.active]="track.isMuted">M</div>

                <!-- Solo -->
                <div 
                    (click)="onSolo($event)"
                    class="btn"
                    title="Solo" 
                    [class.active]="track.soloEnabled">S</div>

                <!-- Hold -->
                <div 
                    (click)="onHold($event)"
                    class="btn"
                    title="Hold Mode - OFF: Play as usual; PLAY - Play keys to hold; HOLD: Will play activated keys endlessly"
                    [class.play]="track.hold == 'PLAY'"
                    [class.hold]="track.hold == 'HOLD'">{{track.hold.charAt(0)}}</div>

                <!-- Duplicate -->
                <div 
                    (click)="onDuplicateHandler()"
                    title="Duplicate"
                    class="btn">D</div>

                <!-- OctaveOffset Nr -->
                <div 
                    (click)="onOctaveOffset($event)"
                    class="btn"
                    title="Octave offset">{{track.octaveOffset}}</div>
                <!-- Delete -->
                <div 
                    class="btn"
                    title="Delete" 
                    (click)="onDeleteHandler($event)">&#x2715;</div>
            </div>

        </div>

        <!-- Node -->
        <!-- Instrument -->
        <sy-node [node]="track.instrument" [index]="0" />

        <!-- Nodes -->
        <div *ngFor="let node of track.nodes; let i = index;">

            <sy-node [node]="node" [collapsed]="node.collapsed" [index]="i + 1" (onShiftForward)="shiftForward($event)" (onShiftBack)="shiftBack($event)" (onDeleteNode)="deleteNode($event)" />

        </div>

        <!-- Add node -->
        <div class="add-node-btn">

            <div class="addable-nodes">

                <div *ngFor="let ef of effects" class="addable-node" [title]="ef" (click)="addNode($event, ef)">

                    <!-- <div class="addable-node-inner"> -->

                        {{ ef.substring(0, 2) }}

                    <!-- </div> -->

                </div>

            </div>

        </div>

    </div>

`,
    styles: `

    .track-wrapper {

        display: flex;

        min-width: inherit;
        height: inherit;

        /* padding: 5px; */

        background-color: var(--c-g);
        color: var(--c-w);
        
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;

        border: .5px solid var(--c-b);
    }

    .track-wrapper .track-options {

        min-width: 250px;

        display: inline-flex;
        align-items: center;

        background-color: var(--c-y);
        color: var(--c-b);
    }

    .track-wrapper .track-options.playing {
        background-color: var(--c-o);
    }

    .track-wrapper .track-options .track-btns {

        display: inline-block;
        width: 100px;
    }

    .track-wrapper .add-node-btn {

        position: relative;

        min-width: inherit;
        width: auto;

        height: inherit;
        line-height: inherit;

        background-color: var(--c-w);
        color: var(--c-b);
        transition: .4s background-color, .4s color;

        cursor: pointer;
    }
    .track-wrapper .add-node-btn:hover {

        color: var(--c-b);
        background-color: var(--c-y);
    }

    .track-wrapper .add-node-btn .addable-nodes {
        
        position: absolute;
        left: 0px;
        top: 0px;
        width: auto;
        height: 100%;

        display: flex;
        justify-content: start;
        align-items: center;
    }

    .track-wrapper .add-node-btn .addable-nodes .addable-node {

        display: flex;
        justify-content: center;
        align-items: center;

        width: 75px;
        height: 75px;
        line-height: 75px;
        text-align: center;

        background-color: var(--c-w);
        color: var(--c-b);

        transition: .2s background-color, .2s color;

        cursor: pointer;
    }

    .track-wrapper .add-node-btn .addable-nodes .addable-node:hover {

        background-color: var(--c-b);
        color: var(--c-y);
    }



    /* 
    .track-wrapper .add-node-btn .addable-nodes .addable-node .addable-node-inner {

        width: 100%;
        height: 100%;
        line-height: inherit;
        text-align: center;

        transition: .2s background-color, .2s color, .2s border-radius, .2s line-height, .2s height, .2s width;

        cursor: pointer;
    } */


    /* 

    .track-wrapper .add-node-btn .addable-nodes .addable-node:hover .addable-node-inner {

        background-color: var(--c-b);
        color: var(--c-y);

        border-radius: 100%;

        width: 50px;
        height: 50px;
        line-height: 50px;
    } 

    */

    .btn.play {

        background-color: var(--c-o);
    }

    .btn.hold {

        background-color: var(--c-bl);
        color: var(--c-w);
    }
`,
})
export class TrackComponent implements AfterViewInit, OnDestroy {

    @Input('track') track: Track

    @Output('onDuplicate') onDuplicate: EventEmitter<Track> = new EventEmitter()
    @Output('onDelete') onDelete: EventEmitter<Track> = new EventEmitter()

    color: string

    sources: string[]
    effects: string[]

    constructor() {

        this.sources = Object.keys(Synth.nodes.sources)
        this.effects = Object.keys(Synth.nodes.effects)
    }

    
    ngAfterViewInit() {
        
        this.color = getChannelColor(this.track.channel)
    }
    ngOnDestroy() {

        console.error('ngOnDestroy')
    }

    onVolumeChange = (e) => {

        this.track.volume = e.detail

        this.track.volumeNode.volume.value = this.track.volume

        this.saveUndo()
    }

    onChannel = (e) => {

        if(!e.shiftKey) this.track.channel++
        if(e.shiftKey) this.track.channel--

        if(this.track.channel >= Synth.maxChannelCount) this.track.channel = 0
        else if(this.track.channel < 0) this.track.channel = (Synth.maxChannelCount - 1) as Channel

        this.track.setChannel(this.track.channel)

        this.color = getChannelColor(this.track.channel)

        this.saveUndo()
    }

    onMute = (e) => {

        this.track.mute(!this.track.isMuted)
        this.track.isMuted = this.track.isMuted

        this.saveUndo()
    }

    onSolo = (e) => {

        this.track.solo(!this.track.soloEnabled)
        this.track.soloEnabled = this.track.soloEnabled

        this.saveUndo()
    }

    onHold = (e) => {

        if(this.track.hold == 'OFF') {

            this.track.hold = 'PLAY'
        } 
        else if(this.track.hold == 'PLAY') {

            this.track.hold = 'HOLD'
        }
        else {

            this.track.hold = 'OFF'
        }
        this.track = this.track

        this.saveUndo()
    }

    onDuplicateHandler = () => {

        this.onDuplicate.next(this.track)
    }

    onOctaveOffset = (e) => {

        this.track.releaseNotes()

        const maxOffset = 5

        if(!e.shiftKey) this.track.octaveOffset++
        if(e.shiftKey) this.track.octaveOffset--

        if(this.track.octaveOffset > maxOffset) this.track.octaveOffset = -maxOffset
        else if(this.track.octaveOffset < -maxOffset) this.track.octaveOffset = maxOffset

        this.track = this.track

        this.saveUndo()
    }

    onDeleteHandler = (e) => {

        this.onDelete.next(this.track)
    }
    
    addNode = (e, name?: string) => {

        if(!this.effects.includes(name)) return

        if(name != undefined) this.track.addNode(Synth.nodes.effects[name]())
        else this.track.addNode(Synth.nodes.effects.Delay())

        this.saveUndo()
    }

    deleteNode = (e) => {

        this.track.removeNode(e.detail)

        this.track = this.track

        this.saveUndo()
    }

    /** Shift node forward in array */
    shiftForward = (e) => {

        this.track.shiftNodeForward(e.detail)

        this.track.connectNodes()

        this.saveUndo()
    }

    /** Shift node back in array */
    shiftBack = (e) => {

        this.track.shiftNodeBackward(e.detail)

        this.track.connectNodes()

        this.saveUndo()
    }

    // Change Tracks Instrument
    onChangeInstrument = (e) => {

        if(this.track.instrument) this.track.instrument.releaseAll()

        const ele = e.target

        const source = ele.value

        if(!Object.hasOwn(Synth.nodes.sources, source)) return

        const instrument: Instrument = Synth.nodes.sources[source]()

        this.track.setInstrument(instrument)

        ele.blur()

        this.saveUndo()
    }

    saveUndo = () => {

        Storage.saveUndo(JSON.stringify(this.track.synthesizer.serializeOut()))
    }

    onClick = (e) => {

        // if(!e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) e.preventDefault()

        // console.log('click', track.id, track.volumeNode, track.volumeNode.volume.value)

    }
}