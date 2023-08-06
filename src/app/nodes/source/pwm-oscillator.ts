import * as Tone from 'tone'
import { Instrument } from './instrument';
import { Synthesizer } from '../../synthesizer';
import { ParamType, Node } from '../node';
import type { ToneWithContextOptions } from 'tone/build/esm/core/context/ToneWithContext';



/** 
 * 
count : Positive	
detune : Cents	
frequency : Frequency	
partialCount : number	
partials : number	[]	
phase : Degrees	
modulationFrequency : Cents	
type : ToneOscillatorType	
volume : Decibels	

 */
export class PWMOscillator extends Instrument {

    public envelope: Tone.AmplitudeEnvelope

    public osc: Tone.PWMOscillator

    /** Gain node */
    public gain: Tone.Gain

    /** How loud */
    private _volume: number
    /** Frequency */
    private _frequency: Tone.Unit.Frequency
    /** Slight detuning of the note */
    private _detune: number
    /** The phase is the starting position within the oscillator's cycle. 
     * For example a phase of 180 would start halfway through the oscillator's cycle. */
    private _phase: number = 0

    /** Measured in Cents */
    private _modulationFrequency: Tone.Unit.Frequency


    private _attack: number
    private _decay: number
    private _sustain: number
    private _release: number

    /** Is the osc already playing */
    private isPlaying: boolean


    /** freq, detune, volume, waveform,  */
    constructor(volume?: number, frequency?: number, detune?: number) {

        super('PWMOscillator')

        this.osc = new Tone.PWMOscillator(this.frequency)
        this.osc.start(Tone.now())

        this.envelope = new Tone.AmplitudeEnvelope()
        this.gain = new Tone.Gain(1)

        this.output = this.gain

        this.isPlaying = false

        const oscDefaults = this.osc.get()
        const envDefaults = this.envelope.get()

        this.volume = volume ? volume : .4
        this.detune = oscDefaults.detune
        this.phase = oscDefaults.phase
        this.attack = envDefaults.attack as number
        this.decay = envDefaults.decay as number
        this.sustain = envDefaults.sustain
        this.release = envDefaults.release as number
        this._modulationFrequency = oscDefaults.modulationFrequency


        this.props.set('volume', { type: ParamType.KNOB, name: 'Volume', get: () => this.volume, set: (v:number) => this.volume = v, min: 0, max:1, groupID: 0 })

        this.props.set('modulationFrequency', { type: ParamType.KNOB, name: 'Mod Freq', get: () => this.modulationFrequency, set: (v:number) => this.modulationFrequency = v, min: 0, max: 100, groupID: 0 })

        this.props.set('detune', { type: ParamType.KNOB, name: 'Detune', get: () => { return this.detune }, set: (v) => this.detune = v, min: -100, max: 100, groupID: 2 })
        this.props.set('phase', { type: ParamType.KNOB, name: 'Phase', get: () => this.phase, set: (v:number) => this.phase = v, min: 0, max: 1, groupID: 2 })
        
        this.props.set('attack', { type: ParamType.KNOB, name: 'Attack', get: () => this.attack, set: (v:number) => this.attack = v, min: .1, max: 5, groupID: 4 })
        this.props.set('decay', { type: ParamType.KNOB, name: 'Decay', get: () => this.decay, set: (v:number) => this.decay = v, min: 0, max: 5, groupID: 4 })
        this.props.set('sustain', { type: ParamType.KNOB, name: 'Sustain', get: () => this.sustain, set: (v:number) => this.sustain = v, min: 0, max: 1, groupID: 4 })
        this.props.set('release', { type: ParamType.KNOB, name: 'Release', get: () => this.release, set: (v:number) => this.release = v, min: 0, max: 5, groupID: 4 })
    }
    

    get frequency() { return this._frequency }
    set frequency(f) {

        this._frequency = f

        this.osc.frequency.setValueAtTime(this._frequency, Tone.now())
    }

    get volume() { return this._volume }
    set volume(v) {

        this._volume = v

        this.gain.gain.setValueAtTime(this._volume, Tone.now())
    }

    get modulationFrequency() { return this._modulationFrequency }
    set modulationFrequency(v) {

        this._modulationFrequency = v

        this.osc.set({ modulationFrequency: this._modulationFrequency})
    }


    get detune() { return this._detune }
    set detune(d) {


        this._detune = d

        this.osc.detune.set({ detune: this._detune })
    }

    get phase() { return this._phase }
    set phase(d) {

        this._phase = d
        this.osc.set({ phase: this._phase })
    }

    get attack() { return this._attack }
    set attack(d) {

        this._attack = d
        this.envelope.set({ attack: this._attack })
    }

    get decay() { return this._decay }
    set decay(d) {

        this._decay = d
        this.envelope.set({ decay: this._decay })
    }

    get sustain() { return this._sustain }
    set sustain(d) {

        this._sustain = d
        this.envelope.set({ sustain: this._sustain })
    }

    get release() { return this._release }
    set release(d) {

        this._release = d
        this.envelope.set({ release: this._release })
    }


    triggerNote(note: Tone.Unit.Frequency, time: Tone.Unit.Time, velocity: number = 1) {

        this.frequency = Tone.Frequency(note).toFrequency()

        this.isPlaying = true

        this.envelope.triggerAttack(time, velocity)
    }

    triggerReleaseNote(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity:number = 1): void {
        
        this.frequency = Tone.Frequency(note).toFrequency()

        // this.isPlaying ?

        this.envelope.triggerAttackRelease(duration, time, velocity)
    }

    releaseNote(note: Tone.Unit.Frequency, time: Tone.Unit.Time) {

        this.isPlaying = false

        if(this.isPlaying || Synthesizer.activeNotes.size > 0) {

            // console.log('play other note', Synthesizer.activeNotes)
            this.triggerNote(Array.from(Synthesizer.activeNotes).pop(), time)
            return
        }

        this.envelope.triggerRelease(time)
    }

    releaseAll() {
        
        this.envelope.triggerRelease(Tone.now())
    }

    connect(n: Node | Tone.ToneAudioNode<ToneWithContextOptions>): void {

        this.osc.connect(this.envelope)

        this.envelope.connect(this.gain)

        this.output = this.gain

        this.output.connect(n instanceof Node ? n.input : n)
    }

    chain(nodes: Node[] | Tone.ToneAudioNode[]) {

        if(!nodes.length || nodes.length == 0) return // this.connect(nodes)

        this.osc.connect(this.envelope)

        this.envelope.connect(this.gain)

        this.output = this.gain

        this.output.connect(nodes[0] instanceof Node ? nodes[0].input : nodes[0])

        let lastNode: Tone.ToneAudioNode = nodes[0] instanceof Node ? nodes[0].output : nodes[0]

        nodes.shift()

        // console.log('chain', this.output.name, 'to', lastNode.name)

        for(let n of nodes) {
            
            if(n instanceof Node) {

                // console.log('chain Node', lastNode.name, 'to', n.name)

                lastNode.connect(n.input)
                lastNode = n.output
            }
            else {
                
                // console.log('chain ToneNode', lastNode.name, 'to', n.name)

                lastNode.connect(n)
                lastNode = n
            }
        }
    }

    disconnect(n?: Node | Tone.ToneAudioNode<ToneWithContextOptions>): void {
        
        if(n == undefined) {

            if(n instanceof Node) this.output.disconnect(n.input)
            else this.output.disconnect(n)
        }
        else this.output.disconnect()
    }

    destroy() {

        this.envelope.triggerRelease(Tone.now())
        this.envelope.disconnect()
        this.envelope.dispose()

        this.osc.stop(Tone.now() + this.envelope.toSeconds(this.envelope.release))

        this.osc.disconnect()
        this.osc.dispose()

        super.destroy()
    }
 
    serializeIn(o) {

        super.serializeIn(o)
        
        if(o.name != undefined) this.name = o.name
        if(o.enabled != undefined) this.enabled = o.enabled
        if(o.volume != undefined) this.volume = o.volume

        if(o.modulationFrequency != undefined) this.modulationFrequency = o.modulationFrequency
        if(o.detune != undefined) this.detune = o.detune
        if(o.phase != undefined) this.phase = o.phase

        if(o.attack != undefined) this.attack = o.attack
        if(o.decay != undefined) this.decay = o.decay
        if(o.sustain != undefined) this.sustain = o.sustain
        if(o.release != undefined) this.release = o.release
    }

    serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,

            name: this.name,
            enabled: this.enabled,
            
            detune: this.detune,
            modulationFrequency: this.modulationFrequency,
            phase: this.phase,

            attack: this.attack,
            decay: this.decay,
            sustain: this.sustain,
            release: this.release,
        }
    }
}