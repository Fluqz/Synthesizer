import * as Tone from 'tone'
import { Synthesizer, type ISerialization, type ISerialize, type Channel, type IComponent } from "./synthesizer"
import { Node, type INodeSerialization } from './nodes/node'
import { InstrumentType, type Instrument, Delay } from './nodes'
import { Util } from '../util/util'

export interface ITrackSerialization extends ISerialization {

    enabled: boolean

    index: number
    channel: number
    octaveOffset: number
    volume: number
    instrument: INodeSerialization
    nodes: INodeSerialization[]

    isMuted: boolean
    soloEnabled: boolean
    hold: {
        enabled: HoldModeState
        activeKeys: string[]
    }

    isCollapsed: boolean
}

export type HoldModeState = 'OFF' | 'PLAY' | 'HOLD'

export class Track implements ISerialize<ITrackSerialization>, IComponent {

    /** Track count */
    static count: number = 0

    /** Tracks order number for the view */
    index: number 

    /** Type of component to differentiate Track & Sequencers */
    name: 'track' | 'sequencer' = 'track'

    /** Track UID */
    public id: number

    /** Synthesizer instance */
    public synthesizer: Synthesizer

    /** ToneJs Volume Node used for the track */
    public volumeNode: Tone.Volume

    /** Volume property */
    private _volume: number

    /** Overwriting Synthesizer's octave */
    public octaveOffset: number = 0

    /** Channel number to port to */
    public channel: Channel

    /** Instrument used */
    public instrument: Instrument

    /** Array of added nodes. Nodes are chained in array order  */
    public nodes: Node[]

    /** Mute this track */
    public isMuted: boolean

    /** Mute this track */
    public soloEnabled: boolean

    /** When enabled, the current instrument with current note/chord is played endlessly. */
    private _hold: HoldModeState

    /** Allow arpegiator to play this tracks instrument. */
    public arpEnabled: boolean

    /** Stack of currently pressed keys (maintains order for monophonic note priority) */
    public activeNotes: Tone.Unit.Frequency[] = []


    constructor(synthesizer: Synthesizer, instrument?: Instrument) {

        this.id = Track.count++

        this.synthesizer = synthesizer
        this.instrument = instrument

        this._volume = -3
        this.volumeNode = new Tone.Volume(this._volume)
        
        this.nodes = []

        this.isMuted = false
        this.soloEnabled = false
        this.channel = synthesizer.channel
        this._hold = 'OFF'
        this.octaveOffset = 0

        if(instrument) {

            this.setInstrument(instrument)
            this.connectNodes()
        }

        // this.addNode(Synthesizer.nodes.effects.Reverb())
        // this.addNode(Synthesizer.nodes.effects.Delay())
        // this.addNode(Synthesizer.nodes.effects.AutoFilter())
        // this.addNode(Synthesizer.nodes.effects.Phaser())
        // this.addNode(Synthesizer.nodes.effects.Chorus())
        // this.addNode(Synthesizer.nodes.effects.Distortion())
        // this.addNode(Synthesizer.nodes.effects.Tremolo())
        // this.addNode(Synthesizer.nodes.effects.Vibrato())
    }

    /** Get the track count/order number */
    get number() { return this.synthesizer ? this.synthesizer.tracks.indexOf(this) + 1 : -1 }

    /** Sets the tracks source instrument and connects them in chain. 
     * Instrument will always be the first element in the chain */
    setInstrument(instrument: Instrument) {

        if(this.instrument && this.instrument != instrument) {

            this.releaseNotes()

            this.instrument.disconnect()
            this.instrument.destroy()
        }

        this.instrument = instrument
        this.connectNodes()
    }

    /** VolumeNode value */
    get volume() { return this._volume }
    set volume(db: number) { 

        this._volume = db

        this.volumeNode.volume.exponentialRampTo(this._volume, .04, Tone.getContext().currentTime)
    }

    /** Silences/Unsilences the track volume */
    mute(m: boolean) {

        this.isMuted = m === true ? true : false

        if(m == true && this.soloEnabled == true) this.solo(false) 

        if(this.isMuted) this.volumeNode.volume.exponentialRampTo(Number.NEGATIVE_INFINITY, .15, Tone.getContext().currentTime)
        else {

            // Any track left in solo mode? then only change self volume back to normal
            let soloStillActive:boolean = false
            for(let t of this.synthesizer.tracks) {

                if(t.soloEnabled) soloStillActive = true
            }

            // Any track left in solo mode? Then keep this track shut
            if(soloStillActive) {

                // Set volume to -Infinity
                this.volumeNode.volume.exponentialRampTo(Number.NEGATIVE_INFINITY, .2, Tone.getContext().currentTime)
            }
            else {

                this.volumeNode.volume.exponentialRampTo(this._volume, .2, Tone.getContext().currentTime)
            }
        }
    }

    /** Activates solo mode. Only tracks in solo mode can be heard. */
    solo(s: boolean) {

        this.soloEnabled = s === true ? true : false

        if(this.soloEnabled == true && this.isMuted == true) this.mute(false)

        if(this.soloEnabled) { // SOLO

            // Set volume
            this.volumeNode.volume.exponentialRampTo(this._volume, .15, Tone.getContext().currentTime)

            for(let t of this.synthesizer.tracks) {

                // Ignore self
                if(t === this) continue
                // Ignore others in solo mode
                if(t.soloEnabled) continue
                // Silence every other track
                t.volumeNode.volume.exponentialRampTo(Number.NEGATIVE_INFINITY, .2, Tone.getContext().currentTime)
            }
        }
        else { // NOT SOLO

            // Any track left in solo mode? then only change self volume back to normal
            let staySoloMode:boolean = false
            for(let t of this.synthesizer.tracks) {

                if(t.soloEnabled) staySoloMode = true
            }

            // Any track left in solo mode? Then keep this track shut
            if(staySoloMode) {

                // Set volume to -Infinity
                this.volumeNode.volume.exponentialRampTo(Number.NEGATIVE_INFINITY, .2, Tone.getContext().currentTime)

            }
            else {

                // Unsilence every track
                for(let t of this.synthesizer.tracks) {

                    if(t.isMuted) continue
                    if(t.soloEnabled) continue

                    t.volumeNode.volume.exponentialRampTo(t._volume, .2, Tone.getContext().currentTime)
                }
            }
        }
    }

    /** Set Hold state of this track.
     * Hold has three states. PLAY, HOLD, OFF
     * PLAY: While 'PLAY' is active, all notes that are played will be triggered but not released.
     * HOLD: While 'HOLD' is active, new notes wont be triggered, but active notes will play endlessly.
     * OFF: All active notes will be released and nothing will be triggered. Its off
     */
    get hold() { return this._hold }
    set hold(hold: HoldModeState) { 

        this._hold = hold

        if(hold == 'PLAY') {


        }
        else if(hold == 'HOLD') {

        }
        else { // OFF

            this.releaseNotes()
        }
    }

    /** Set this track's channel number. Needs to release all triggered notes. */
    setChannel(c: Channel) {

        this.channel = c

        this.releaseNotes()
    }

    /** Releases all triggered notes */
    releaseNotes() {

        const notesToRelease = [...this.activeNotes] // Copy array before modifying
        for(let n of notesToRelease) this.triggerRelease(n, Tone.getContext().currentTime)

        if(this.instrument) this.instrument.releaseAll()
    }

    /** Triggers the instruments note */
    triggerAttack(note: Tone.Unit.Frequency, time: Tone.Unit.Time, velocity: number = 1) {

        if(note == undefined) return
        
        if(this.instrument == undefined) {
            
            console.error('track.ts releaseNotes() - instrument is undefined')
            return
        }

        // Prevent triggering while in HOLD Mode. Held sounds are already set 
        if(this.hold == 'HOLD') return

        let triggerNote = this.applyOctaveOffset(note)

        // Add note if not already in stack
        if(!this.activeNotes.includes(triggerNote)) {
            this.activeNotes.push(triggerNote)
        }

        this.instrument.triggerAttack(triggerNote, time, velocity)
    }

    /** Triggers the instruments note */
    triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity:number = 1): void {

        if(note == undefined) return

        if(this.instrument == undefined) {
            
            console.error('track.ts releaseNotes() - instrument is undefined')
            return
        }

        let triggerNote = this.applyOctaveOffset(note)
        
        if(!this.activeNotes.includes(triggerNote)) {
            this.activeNotes.push(triggerNote)
        }

        Tone.getTransport().scheduleOnce((t) => {

            Synthesizer.activeNotes.delete(triggerNote)

        // }, time)
        }, Tone.Time(time).toSeconds() + Tone.Time(duration).toSeconds())

        this.instrument.triggerAttackRelease(triggerNote, duration, time, velocity)
    }


    /** Stops the instruments note */
    triggerRelease(note: Tone.Unit.Frequency, time: Tone.Unit.Time) {

        if(note == undefined) return

        if(this.instrument == undefined) {
            
            console.error('track.ts releaseNotes() - instrument is undefined')
            return
        }
        // Prevent triggering while in HOLD Mode. Held sounds are already set 
        if(this.hold == 'HOLD' || this.hold == 'PLAY') return

        let triggerNote = this.applyOctaveOffset(note)

        // Check if this is the currently playing note (last in array)
        const isCurrentNote = this.activeNotes.length > 0 && this.activeNotes[this.activeNotes.length - 1] === triggerNote

        // Remove note from active notes
        const noteIndex = this.activeNotes.indexOf(triggerNote)
        if(noteIndex !== -1) {
            this.activeNotes.splice(noteIndex, 1)
        }

        // For monophonic instruments: handle note stacking
        if(this.instrument.type === InstrumentType.MONO) {
            
            // If releasing a non-current note, just ignore (don't release the instrument)
            if(!isCurrentNote) {
                return
            }
            
            // If there are still active notes, retrigger the last one
            if(this.activeNotes.length > 0) {
                
                const nextNote = this.activeNotes[this.activeNotes.length - 1] // Last-note-priority
                this.instrument.triggerAttack(nextNote, time, 1)
                return
            }
        }

        this.instrument.triggerRelease(triggerNote, time)
    }

    /** Adds a node to the node chain */
    addNode(n: Node) {

        this.nodes.push(n)

        n.onDelete.subscribe(this.removeNode.bind(this))

        this.connectNodes()
    }

    /** Connects all nodes in a chain starting with the instrument as source. */
    connectNodes() {

        if(this.instrument) {

            this.instrument.disconnect()

            // console.log('Connect Nodes', this.id)

            const nodes = []

            for(let n of this.nodes) {

                n.disconnect()

                nodes.push(n)
            }

            nodes.push(this.volumeNode)

            this.instrument.chain(nodes)

            // Node's Direct Bypass
            for(let n of this.nodes) {

                // if(n.directBypass === true) {

                //     for(let ci of Array.from(n.connectedInputs)) {

                //         for(let co of Array.from(n.connectedOutputs)) {

                //             ci.connect(co)
                //         }
                //     }
                // }
            }
        }
        else {
            
            console.error('track.ts releaseNotes() - instrument is undefined')
            return
        }
    }

    /** Remove a node from the node chain */
    removeNode(n: Node) {

        let i = this.nodes.indexOf(n)

        if(i == -1) return

        n.disconnect()

        this.nodes.splice(i, 1)

        n.destroy()
        
        this.connectNodes()
    }

    /** Move a node forward by one in the array. */
    shiftNodeForward(node: Node) {

        let i = this.nodes.indexOf(node)

        if(i <= 0) return

        let dNode: Node = this.nodes.splice(i, 1)[0]
        this.nodes.splice(i - 1, 0, dNode)
    }

    /** Move a node backward by one in the array. */
    shiftNodeBackward(node: Node) {

        let i = this.nodes.indexOf(node)

        if(i > this.nodes.length) return

        this.nodes.splice(i, 1)
        this.nodes.splice(i + 1, null, node)
    }


    /** Connect the output gain node to passed in output */
    connect(i: Node | Tone.ToneAudioNode) {
        
        this.volumeNode.connect(i instanceof Node ? i.input : i)
    }

    /** Disconnects the output gain node from passed in output */
    disconnect(i: Node | Tone.ToneAudioNode) {
        
        this.volumeNode.disconnect(i instanceof Node ? i.input : i)
    }

    /** Destroy this track. */
    destroy() {

        this.releaseNotes()

        for(let i = this.nodes.length; i >= 0; i--) this.removeNode(this.nodes[i])

        if(this.instrument) this.instrument.destroy()
    }

    /** Checks if octaveOffset should be aplied */
    private applyOctaveOffset(note: Tone.Unit.Frequency) : Tone.Unit.Frequency {

        let _note = note.toString()

        if(this.octaveOffset != 0) {

            const { n, o } = Util.removeOctaveFromNote(_note.toString())

            _note = n + Synthesizer.applyOctaveLimit(o + this.octaveOffset)
        }

        return _note as Tone.Unit.Frequency
    }

    serializeIn(o: ITrackSerialization) {

        this.destroy()

        // Release all notes from the obsolete instrument instance
        if(this.instrument) this.releaseNotes()

        if(o.index != undefined) this.index = o.index
        // if(o.name) this.name = o.name
        if(o.volume != undefined) this.volume = o.volume
        if(o.octaveOffset != undefined) this.octaveOffset = o.octaveOffset
        if(o.channel != undefined) this.channel = o.channel as Channel

        // if(o.enabled) this.enabled = o.enabled

        // if(o.arpeggiatorEnabled) this.arpeggiatorEnabled = o.arpeggiatorEnabled

        if(o.instrument) {

            let instrument: Instrument = Synthesizer.createNode(o.instrument.name) as Instrument
            instrument.serializeIn(o.instrument)
            this.setInstrument(instrument)
        }
        
        // if(o.isCollapsed) this.isCollapsed = o.isCollapsed

        if(o.nodes && o.nodes.length > 0) {

            this.nodes.length = 0
            
            for(let n of o.nodes) {

                let node: Node = Synthesizer.createNode(n.name)

                if(!node) { console.error('Track Serialize Node Error: Node is undefined. Node.name no match.'); continue}

                node.serializeIn(n)
                this.addNode(node)
            }
        }

        if(o.isMuted) this.mute(o.isMuted)
        if(o.soloEnabled) this.solo(o.soloEnabled)
        if(o.hold) {

            this.hold = o.hold.enabled
            
            if(this.hold != 'OFF') {

                this.hold = 'PLAY'

                for(let k of o.hold.activeKeys) {

                    this.triggerAttack(k, Tone.getContext().currentTime)
                }

                this.hold = 'HOLD'
            }
        }
    }

    serializeOut() : ITrackSerialization {

        let nodes: INodeSerialization[] = []
        for(let n of this.nodes) nodes.push(n.serializeOut())

        return {

            // name: this.name,
            enabled: true,

            index: this.index,

            octaveOffset: this.octaveOffset,
            channel: this.channel,

            volume: this.volume,
            instrument: this.instrument == null ? undefined : this.instrument.serializeOut(),
            nodes: nodes,

            soloEnabled: this.soloEnabled,
            hold: {
                enabled: this.hold,
                activeKeys: Array.from(this.activeNotes as Iterable<string>)
            },
            isMuted: this.isMuted,

            isCollapsed: false,
        }
    }
}