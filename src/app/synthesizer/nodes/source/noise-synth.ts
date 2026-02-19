import * as Tone from 'tone'
import { Instrument, InstrumentType } from './instrument';
import { Synthesizer, NodeName } from '../../synthesizer';
import { ParamType } from '../node';


/**  
 * envelope: Object { attack: 0.01, attackCurve: "linear", decay: 0.1, … }
​​
attack: 0.01
​​
attackCurve: "linear"
​​
decay: 0.1
​​
decayCurve: "exponential"
​​
release: 1
​​
releaseCurve: "exponential"
​​
sustain: 0
​​
<prototype>: Object { … }
​
noise: Object { fadeIn: 0, fadeOut: 0, playbackRate: 1, … }
​​
fadeIn: 0
​​
fadeOut: 0
​​
playbackRate: 1
​​
type: "white"
​​
<prototype>: Object { … }
​
volume: 0
*/
export class NoiseSynth extends Instrument {

    synth: Tone.PolySynth
    /** How loud */
    _volume: number
    /** Gain node */
    // gain: Tone.Gain
    /** Slight detuning of the note */
    _detune: number
    /** Offset of the wave */
    _portamento: number

    _sampleTime: number
    _attack: number
    _decay: number
    _sustain: number
    _release: number
    _phase: number
    _harmonicity: number

    /** freq, detune, volume, waveform,  */
    constructor(options:any = {}) {

        super(NodeName.NoiseSynth, InstrumentType.POLY)

        // @ts-ignore
        this.synth = new Tone.PolySynth(Tone.NoiseSynth)
        this.output = this.synth


        const data = this.synth.get()

        this.volume = options.volume ? options.volume : .5
        this.detune = options.detune ? options.detune : .5
        this.portamento = options.portamento ? options.portamento : 0


        this.detune = options.detune != undefined ? options.detune : data.detune
        this.portamento = options.portamento != undefined ? options.portamento : data.portamento
        // @ts-ignore
        this.harmonicity = options.harmonicity != undefined ? options.harmonicity : data.harmonicity
        this.phase = options.phase != undefined ? options.phase : data.oscillator.phase

        this.attack = options.attack != undefined ? options.attack : data.envelope.attack
        this.decay = options.decay != undefined ? options.decay : data.envelope.decay
        this.sustain = options.sustain != undefined ? options.sustain : data.envelope.sustain
        this.release = options.release != undefined ? options.release : data.envelope.release



        this.props.set('volume', { type: ParamType.KNOB, name: 'Volume', get: () => this.volume, set: (v) => this.volume = v, min: -70, max: 6, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('detune', { type: ParamType.KNOB, name: 'Detune', get: () => { return this.detune }, set: (v) => this.detune = v, min: -100, max: 100, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('portamento', { type: ParamType.KNOB, name: 'Portamento', get: () => this.portamento, set: (v) => this.portamento = v, min: 0, max: 100, step: 0.01, precision: 2, groupID: 0 })

        // this.props.set('sampleTime', { type: ParamType.KNOB, name: 'sampleTime', get: () =>  this.sampleTime, set: (v) => this.sampleTime = v })
    
        // this.props.set('wave', { type: ParamType.DROPDOWN, name: 'Wave', get: () => this.wave, set: (v:string) => this.wave = v, options: [ 'sine', 'square', 'sawtooth', 'triangle', 'pulse', ], group: 1 })
        // this.props.set('wavePartial', { type: ParamType.DROPDOWN, name: 'Wave Partial', get: () => this.wavePartial, set: (v:string) => this.wavePartial = v, options: ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], group: 1 })

        this.props.set('harmonicity', { type: ParamType.KNOB, name: 'Harmonicity', get: () => this.harmonicity, set: (v:number) => this.harmonicity = v, min: 0, max: 5, step: 0.01, precision: 2, groupID: 2 })

        this.props.set('phase', { type: ParamType.KNOB, name: 'Phase', get: () => this.phase, set: (v:number) => this.phase = v, min:0, max: 1, groupID: 2 })
        
        this.props.set('attack', { type: ParamType.KNOB, name: 'Attack', get: () => this.attack, set: (v:number) => this.attack = v, min: 0, max: 5, step: 0.01, precision: 2, groupID: 4 })
        this.props.set('decay', { type: ParamType.KNOB, name: 'Decay', get: () => this.decay, set: (v:number) => this.decay = v, min: 0, max: 5, step: 0.01, precision: 2, groupID: 4 })
        this.props.set('sustain', { type: ParamType.KNOB, name: 'Sustain', get: () => this.sustain, set: (v:number) => this.sustain = v, min: 0, max: 1, step: 0.01, precision: 2, groupID: 4 })
        this.props.set('release', { type: ParamType.KNOB, name: 'Release', get: () => this.release, set: (v:number) => this.release = v, min: 0, max: 5, step: 0.01, precision: 2, groupID: 4 })
    }

    set volume(v: number) {

        this._volume = v 
        this.synth.volume.setValueAtTime(this.volume, Tone.getContext().currentTime)
        // this.gain.gain.setValueAtTime(this.volume, Tone.getContext().currentTime)
    }
    get volume() { return this._volume }

    // set sampleTime(v: number) {

    //     this._sampleTime = v 
    //     this.synth.set({ sampleTime: this._sampleTime })
    // }
    // get sampleTime() { return this._sampleTime }


    set harmonicity(d: number) { 
        this._harmonicity = d 
        // @ts-ignore
        this.synth.set({ harmonicity: this._harmonicity })
    }
    get harmonicity() { return this._harmonicity }



    set detune(d: number) { 
        this._detune = d 
        this.synth.set({ detune: this._detune })
    }
    get detune() { return this._detune }


    get portamento() { return this._portamento }
    set portamento(p) {

        this._portamento = p
        this.synth.set({ portamento: this._portamento })
    }

    get phase() { return this._phase }
    set phase(d) {

        this._phase = d
        // @ts-ignore
        this.synth.set({ phase: this._phase })
    }

    get attack() { return this._attack }
    set attack(d) {

        this._attack = d
        this.synth.set({ envelope: { attack: this._attack } })
    }
    get decay() { return this._decay }
    set decay(d) {

        this._decay = d
        this.synth.set({ envelope: { decay: this._decay } })
    }

    get sustain() { return this._sustain }
    set sustain(d) {

        this._sustain = d
        this.synth.set({ envelope: { sustain: this._sustain } })
    }

    get release() { return this._release }
    set release(d) {

        this._release = d
        this.synth.set({ envelope: { release: this._release } })
    }

    triggerAttack(note: Tone.Unit.Frequency, time: Tone.Unit.Time, velocity: number = 1) {

        this.synth.triggerAttack(note, time, velocity)
    }

    triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity:number = 1): void {
        
        this.synth.triggerAttackRelease(note, duration, time, velocity)
    }

    triggerRelease(note: Tone.Unit.Frequency, time: Tone.Unit.Time) {

        this.synth.triggerRelease(note, time)
    }

    releaseAll() {
        
        this.synth.releaseAll()
    }

    override destroy() {
        
        this.synth.releaseAll()
        this.synth.disconnect()
        
        this.synth.dispose()
        // @ts-ignore
        this.synth.context._timeouts.cancel(0)
        
        super.destroy()
    }

    override serializeIn(o) {

        super.serializeIn(o)

        if(o.name != undefined) this.name = o.name
        if(o.enabled != undefined) this.enabled = o.enabled
        if(o.volume != undefined) this.volume = o.volume

        if(o.detune != undefined) this.volume = o.volume
        if(o.portamento != undefined) this.volume = o.volume
        if(o.harmonicity != undefined) this.volume = o.volume
        if(o.phase != undefined) this.volume = o.volume
        if(o.attack != undefined) this.volume = o.volume
        if(o.decay != undefined) this.volume = o.volume
        if(o.sustain != undefined) this.volume = o.volume
        if(o.release != undefined) this.volume = o.volume
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,
            name: this.name,
            enabled: this.enabled,

            volume: this.volume,

            detune: this.detune,
            portamento: this.portamento,
            harmonicity: this.harmonicity,
            phase: this.phase,

            attack: this.attack,
            decay: this.decay,
            sustain: this.sustain,
            release: this.release,
        }
    }
}