import * as Tone from 'tone'

import { Track } from '../synthesizer/track'
import { Sequencer as _Sequencer, Sequencer } from '../synthesizer/sequencer'
import { Node as _Node } from '../synthesizer/nodes/'
import { Synthesizer, type Channel, type ComponentType } from '../synthesizer/synthesizer'
import { BeatMachine } from '../synthesizer/beat-machine'
import { G } from '../globals';
import { Storage } from '../core/storage';
import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input } from '@angular/core'
import { DropdownComponent } from './Dropdown.component'
import { KnobComponent } from './Knob.component'
import { TrackComponent } from './Track.component'
import { SequencerComponent } from './Sequencer.component'
import { KeyComponent } from './Key.component'
import { LevelMeterComponent } from './LevelMeter.component'
import { OscilloscopeComponent } from './Oscilloscope.component'
import { CommonModule } from '@angular/common'
import { Key } from '../synthesizer/key'

@Component({

     selector: 'sy-synthesizer',
     standalone: true,
     changeDetection: ChangeDetectionStrategy.OnPush,
     imports: [ CommonModule, DropdownComponent, KnobComponent, TrackComponent, SequencerComponent, KeyComponent, LevelMeterComponent, OscilloscopeComponent ],
    template: `


@if (synthesizer != undefined) {
    

    <div class="synthesizer">

        <slot></slot>

        <div class="synthesizer-menu">

            <div class="add-track btn" title="Add Track" (click)="addTrack()">&#x2b;</div>

            <div class="add-sequencer btn" title="Add Sequencer" (click)="addSequencer()">&#x2b;</div>

            <div class="toggle-sequencers btn" [class.active]="areSequencersPlaying" title="Play / Stop all Sequencers" (click)="toggleSequencersPlayStop()">{{ areSequencersPlaying ? '⏸' : '▶' }}</div>

            <div id="mute" class="btn" [class.active]="synthesizer.isMuted" title="Mute" (click)="mute()">M</div>

            <div id="bpm-btn" title="BPM">
                <sy-knob 
                    [name]="'BPM'"
                    [value]="synthesizer.bpm"
                    [min]="1" 
                    [max]="240" 
                    [step]="0.1"
                    [precision]="1"
                    [scaleType]="'linear'"
                    (onChange)="synthesizer.bpm = $event.detail" />
            </div>

            <div id="channel-btn" class="btn" title="Channel - Key: Arrow Up / Down | Click to increase | Click with SHIFT to decrease" (click)="onChannel($event)">{{ synthesizer.channel }}</div>

            <div>
                <div id="octave-down" class="btn" title="Octave Down - Key: Arrow Left" (click)="octaveDown()">{{'<'}}</div>
                <div id="octave" class="btn deactivated" title="Octave">{{synthesizer.octave}}</div>
                <div id="octave-up" class="btn" title="Octave Up - Key: Arrow Right" (click)="octaveUp()">{{'>'}}</div>
            </div>

            <!-- <div id="arpeggiator" class="btn" title="Arpeggiator" (click)={onArpChange}>Arp</div> -->

            <div id="record" class="btn" title="Toggle recording - Key: Space" (click)="toggleRecording($event)" [class.recording]="isRecording">&#x2609;</div>
            

            <div id="presets">

                <div>
                    <!-- <label for="savePreset">Save Preset</label> -->
                    <input id="save-preset" type="text" placeholder="Save Preset" name="savePreset" [(ngModel)]="presetInputValue" (keydown)="onPresetInput($event)"/>
                </div>
            
                <div *ngIf="presets.length > 0" id="load-preset">

                    <!-- <label for="loadPreset">Load</label> -->
                    
                    <!-- Presets -->
                    <sy-dropdown
                        [value]="''"
                        [options]="presets"
                        [deletableOptions]="true"
                        (onSelect)="onChangePresets($event)" 
                        (onDeleteOption)="onDeletePresetOption($event)"
                        />
                </div>

            </div>


            <sy-oscilloscope [output]="synthesizer.volume"></sy-oscilloscope>

            <!-- <DCMeter output={synthesizer.volume} /> -->

            
            <div id="volume" title="Master volume">
                
                <sy-knob 
                    [name]="''"
                    [value]="synthesizer.volume.volume.value"
                    [min]="-70" 
                    [max]="6" 
                    [step]="1"
                    [precision]="1"
                    [scaleType]="'logarithmic'"
                    (onChange)="synthesizer.setVolume($event.detail)" />
            </div>
            
            <!-- <LevelMeter output={synthesizer.volume} value={synthesizer.volume.volume.value} /> -->
            
            <div id="reset" class="btn" title="ALT - Delete; Click: SHIFT -> DEFAULT, META -> RESET PRESETS" (click)="reset($event)">&#x2715;</div>


        </div>


        <div class="mixer">

            @for(component of components; track component) {

                <div *ngIf="component.name == 'track'" class="track">

                    <sy-track [track]="getTrack(component)" (onDelete)="deleteTrack($event)" (onDuplicate)="duplicateTrack($event)" />

                </div>

                <div *ngIf="component.name == 'sequencer'" class="sequencer">

                    <sy-sequencer [sequencer]="getSequencer(component)" (onDeleteSequencer)="deleteSequencer($event)" (onDuplicate)="duplicateSequencer($event)"/>

                </div>

            }

        </div>


        
        <div *ngIf="synthesizer.tracks.length > 0" class="keys">

            <div *ngIf="showKeyboard">

                @for(key of keys; track key) {

                    <sy-key [key]="key" />

                }

            <!-- <div (click)={() => keyboardVisible = !keyboardVisible}>:</div> -->

            </div>

        </div>

    </div>


}

`,
    styles: `

    .synthesizer {

        z-index: 1;

        width: 100%;
        height: auto;

        -webkit-user-select: none;  
        -moz-user-select: none;    
        -ms-user-select: none;      
        user-select: none;
    }

    .synthesizer > .mixer {

        width: 100%;
    }

    .synthesizer > .mixer-menu {

        display: flex;
        align-items: center;
        justify-content: center;
    }

    .synthesizer-menu {

        padding: 5px 0px;

        display: flex;
        align-items: center;
        justify-content: space-evenly;

        background-color: var(--c-g);
    }

    .synthesizer-menu .btn {

        background-color: transparent;
        color: var(--c-y);
    }

    .synthesizer-menu .btn:hover {

        background-color: var(--c-y);;
        color: var(--c-b);
    }

    #presets>div {
        display: inline-block;
    }
    #record.recording {

        background-color: red;
    }

    .track {

        width: 100%;

        min-width: 75px;
        height: 75px;
    }

    #volume .knob-wrapper {

        margin: 0;
    }

    /** Level meter - make global to overwrite defaults */
    :global(.synthesizer-menu .level-meter) {

        border: 2px solid var(--c-y);

        width: 50px;
        height: 50px;
        line-height: 50px;
    }

    .mixer .add-sequencer-btn {

        width: 75px;
        min-width: 75px;
        height: 75px;
        line-height: 75px;

        cursor: pointer;

        text-align: center;

        background-color: var(--c-w);
        color: var(--c-b);
    }

    #bpm-btn {

        width: 50px;
        text-align: center;
    }
    #bpm-btn input {

        width: 100%;
        height: 100%;
        border: none;
    }

`,
    host: {
        '(window:scroll)': 'onScroll($event)',
    }

})
export class SynthesizerComponent implements AfterViewInit, AfterContentInit {

    @Input('synthesizer') synthesizer: Synthesizer

    components: ComponentType[]

    presets: string[] = []

    isRecording = false

    sequencersCollapsed: boolean = false

    presetInputValue: string

    keys: Key[]

    private _scrollTOID

    get isPlaying() : boolean { return G.isPlaying }

    get areSequencersPlaying(): boolean {
        return this.synthesizer?.sequencers.some(seq => seq.isPlaying) ?? false
    }

    get showKeyboard() { return G.showKeyboard }

    constructor(private cdr: ChangeDetectorRef) {

    }

    ngAfterViewInit() {

        this.keys = Synthesizer.keys

        this.synthesizer.onComponentsChange.subscribe((c) => {

            this.components = c
            this.cdr.markForCheck()
        })

        // Subscribe to all preset changes (save, delete, load from storage)
        this.synthesizer.presetManager.presetsChanged.subscribe(() => {
            this.setPresets()
            this.cdr.markForCheck()
        })

        this.setPresets()

        // Force initial change detection after loading
        setTimeout(() => this.cdr.detectChanges(), 0)
        
        // Events
        // document.addEventListener('keydown', onKeyDown, false)
        // document.addEventListener('keyup', onKeyUp, false)
    }

    ngAfterContentInit(): void {

        this.scrollToBottom()
    }

    addTrack() {

        const t = new Track(this.synthesizer, Synthesizer.nodes.sources.Oscillator())
        this.synthesizer.addTrack(t)

        this.scrollToBottom()

        this.saveUndo()

        return t
    }

    deleteTrack(track: Track) {

        console.log('s delete track', track.id)

        this.synthesizer.removeTrack(track)

        this.saveUndo()
    }

    duplicateTrack(track: Track) {

        let duplicate = this.addTrack()

        track.releaseNotes()

        duplicate.serializeIn(track.serializeOut())

        duplicate.index = this.components[this.components.length - 1].index

        duplicate.releaseNotes()

        this.saveUndo()
    }

    addSequencer() {

        const s = new _Sequencer(this.synthesizer)
        this.synthesizer.addSequencer(s)

        this.scrollToBottom()

        this.saveUndo()

        return s
    }
    
    deleteSequencer(sequencer: Sequencer) {

        this.synthesizer.removeSequencer(sequencer)

        this.saveUndo()
    }
    
    duplicateSequencer(sequencer: Sequencer) {

        let duplicate = this.addSequencer()

        duplicate.serializeIn(sequencer.serializeOut())

        this.scrollToBottom()

        this.saveUndo()
    }

    startAllSequencers() {

        if(this.synthesizer.sequencers.length === 0) return

        // If transport is already running, stop it first, then reset and restart
        if(Tone.getTransport().state === 'started') {
            Tone.getTransport().stop()
            Tone.getTransport().cancel()
        }

        // Reset transport position to 0
        // Notes are scheduled at absolute positions, so transport must start from 0
        Tone.getTransport().position = 0

        // Start BeatMachine (global transport)
        BeatMachine.start()

        _Sequencer.startTime = undefined
        _Sequencer.bulkStarting = true

        // Start all sequencers immediately (no delay)
        for(let seq of this.synthesizer.sequencers) {
            seq.start()
        }

        _Sequencer.bulkStarting = false

        this.synthesizer = this.synthesizer
        this.synthesizer.sequencers = this.synthesizer.sequencers
        this.synthesizer.components = this.synthesizer.components
    }

    stopAllSequencers() {

        _Sequencer.startTime = undefined

        // Stop all sequencers
        for(let seq of this.synthesizer.sequencers) seq.stop()

        // Stop global transport
        BeatMachine.stop()
    }

    /**
     * Toggle play/stop for all sequencers
     */
    toggleSequencersPlayStop() {
        if(this.areSequencersPlaying) {
            this.stopAllSequencers()
        } else {
            this.startAllSequencers()
        }
        this.cdr.markForCheck()
    }

    /**
     * Set BPM on the synthesizer
     */
    setBpm(e: Event) {
        const input = e.target as HTMLInputElement
        const bpmValue = parseInt(input.value)
        
        if(isNaN(bpmValue) || bpmValue < 1 || bpmValue > 400) return
        
        this.synthesizer.bpm = bpmValue
        this.saveUndo()
    }

    onScroll(e) {

        if(this._scrollTOID) clearTimeout(this._scrollTOID)
    }
    
    scrollToBottom() {

        this._scrollTOID = setTimeout(() => {

            window.scrollTo({
                top: window.innerHeight,
                left: 0,
                behavior: 'smooth',
                
            });

            this._scrollTOID = null

        }, 0)
    }

    onChannel(e) {

        if(!e.shiftKey) this.synthesizer.channel++
        if(e.shiftKey) this.synthesizer.channel--

        if(this.synthesizer.channel >= Synthesizer.maxChannelCount) this.synthesizer.channel = 0
        else if(this.synthesizer.channel < 0) this.synthesizer.channel = (Synthesizer.maxChannelCount - 1) as Channel

        this.saveUndo()
    }

    octaveDown() {

        this.synthesizer.setOctave(this.synthesizer.octave - 1)

        this.saveUndo()
    }
    octaveUp() {

        this.synthesizer.setOctave(this.synthesizer.octave + 1)

        this.saveUndo()
    }


    onArpChange(e) {

        // this.synthesizer.toggleArpMode(e.target.checked)
    }


    // Toggle recording button
    toggleRecording(e) {

        this.synthesizer.onRecordingStart.subscribe(() => {

            this.isRecording = this.synthesizer.isRecording
        })
        this.synthesizer.onRecordingEnd.subscribe(() => {

            this.isRecording = this.synthesizer.isRecording
        })

        this.synthesizer.toggleRecording()
    }


    /** Reset synthesizer button */
    reset(e) {

        this.synthesizer.reset()

        if(e.shiftKey) {

            console.log('RESET - SHIFT -> LOAD DEFAULT')

            this.synthesizer.presetManager.loadPreset('default')

            this.scrollToBottom()
        }
        else if (e.metaKey) {

            console.log('RESET - META -> RESET PRESETS')

            this.synthesizer.presetManager.reset()
        }

        this.synthesizer = this.synthesizer

        this.saveUndo()
    }

    /** Reset synthesizer button */
    mute() {

        this.synthesizer.mute(!this.synthesizer.isMuted)
    }


    @HostListener('document:keydown', ['$event'])
    /** Keydown event */
    onKeyDown(e) {

        if(!e) return
        if(e.repeat) return
        if(e.target instanceof HTMLInputElement) return

        // console.log('onKeyDown: key', e.key)

        if(e.key == 'ArrowRight') this.synthesizer.setOctave(this.synthesizer.octave + 1)
        if(e.key == 'ArrowLeft') this.synthesizer.setOctave(this.synthesizer.octave - 1)
        if(e.key == ' ') this.toggleRecording(e)
    }

    @HostListener('document:keyup', ['$event'])
    /** Keyup event */
    onKeyUp(e) {

        // if(G.debug) console.log('keyUp: key', e.key)

        if(!e) return
    }

    setPresets() {

        if(this.presets == undefined) this.presets = []
        else this.presets.length = 0

        this.presets.push('')
        
        for(let p of this.synthesizer.presetManager.getPresets()) this.presets.push(p.name)
    }


    onPresetInput(e) {

        e.stopPropagation()

        if(e.key == 'Enter' && e.target.value) {

            const name = e.target.value
            const existing = this.synthesizer.presetManager.getPresetByName(name)
            
            if(existing) {
                // Preset already exists, ask for confirmation
                const isDefault = this.synthesizer.presetManager.isDefaultPreset(name)
                const message = isDefault 
                    ? `⚠️ "${name}" is a default app preset. Overwrite it?`
                    : `⚠️ Preset "${name}" already exists. Overwrite it?`
                
                const confirmed = confirm(message)
                if(!confirmed) return
                
                this.synthesizer.presetManager.overwritePreset(name)
                this.presetInputValue = ''
            } else if(this.synthesizer.presetManager.savePreset(name)) {
                this.presetInputValue = ''
            }
        }
    }

    onChangePresets(e: InputEvent) {

        const isMuted = this.synthesizer.isMuted
        const presetName = (e.target as HTMLSelectElement).value

        this.synthesizer.mute(true)

        setTimeout(() => {

            this.synthesizer.presetManager.loadPreset(presetName)
            
            this.scrollToBottom()

            setTimeout(() => {
                
                this.synthesizer.mute(isMuted)

            }, 200)
            
        }, 200)

        this.saveUndo()
    }

    onDeletePresetOption(e)  {

        this.synthesizer.presetManager.removePreset(e.detail.target.value)

        this.synthesizer = this.synthesizer

        this.saveUndo()
    }

    getTrack(c: ComponentType) {

        if(c == null || !(c instanceof Track)) return null

        for(let t of this.synthesizer.tracks) {

            if(t == c) return t
        }

        return null
    }

    getSequencer(c: ComponentType) {

        if(c == null || !(c instanceof Sequencer)) return null

        for(let s of this.synthesizer.sequencers) {

            if(s == c) return s
        }

        return null
    }

    saveUndo() {

        Storage.saveUndo(JSON.stringify(this.synthesizer.serializeOut()))
    }
}