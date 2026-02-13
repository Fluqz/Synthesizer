import * as Tone from 'tone'
import { Instrument, InstrumentType } from './instrument';
import { Synthesizer } from '../../synthesizer';
import { ParamType } from '../node';


/** 
 * 
// detune: 0
// envelope: Object { attack: 0.001, attackCurve: "exponential", decay: 0.4, … }
// ​attack: 0.001
// ​attackCurve: "exponential"
// ​decay: 0.4
// ​decayCurve: "exponential"
// ​release: 1.4
// ​releaseCurve: "exponential"
// ​sustain: 0.01
// octaves: 10
// oscillator: Object { partialCount: 0, phase: 0, type: "sine", … }
// ​partialCount: 0
// ​partials: Array []
// ​phase: 0
// ​type: "sine"
// pitchDecay: 0.05
// portamento: 0
// volume: 0
 * 
 */
export class MembraneSynth extends Instrument {

    synth: Tone.PolySynth
    /** How loud */
    _volume: number
    /** Slight detuning of the note */
    _detune: number
    /** Offset of the wave */
    _portamento: number
    _phase: number
    _wave: string
    _sampleTime: number
    _pitchDecay: number
    _octaves: number

    _attack: number
    _decay: number
    _sustain: number
    _release: number

    /** freq, detune, volume, waveform,  */
    constructor(options:any = {}) {

        super('MembraneSynth', InstrumentType.POLY)

        this.synth = new Tone.PolySynth(Tone.MembraneSynth)
        this.output = this.synth

        console.log('MembranceSynth',this.synth.get())

        const data = this.synth.get()

        this.volume = options.volume ? options.volume : .5
        this.detune = options.detune ? options.detune : .5
        this.portamento = options.portamento ? options.portamento : 0

        this.detune = options.detune != undefined ? options.detune : data.detune
        this.portamento = options.portamento != undefined ? options.portamento : data.portamento
        this.phase = options.phase != undefined ? options.phase : data.oscillator.phase
        this.wave = options.pitchDecay != undefined ? options.pitchDecay : data.oscillator.type
        // @ts-ignore
        this.octaves = options.octaves != undefined ? options.octaves : data.octaves
        // @ts-ignore
        this.pitchDecay = options.pitchDecay != undefined ? options.pitchDecay : data.pitchDecay

        this.attack = options.attack != undefined ? options.attack : data.envelope.attack
        this.decay = options.decay != undefined ? options.decay : data.envelope.decay
        this.sustain = options.sustain != undefined ? options.sustain : data.envelope.sustain
        this.release = options.release != undefined ? options.release : data.envelope.release

        this.props.set('volume', { type: ParamType.KNOB, name: 'Volume', get: () => this.volume, set: (v) => this.volume = v, min: -70, max: 6, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('detune', { type: ParamType.KNOB, name: 'Detune', get: () => { return this.detune }, set: (v) => this.detune = v, min: -100, max: 100, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('portamento', { type: ParamType.KNOB, name: 'Portamento', get: () => this.portamento, set: (v) => this.portamento = v, min: 0, max: 100, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('octaves', { type: ParamType.KNOB, name: 'octaves', get: () => this.octaves, set: (v) => this.octaves = v,min: 0, max: 20, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('pitchDecay', { type: ParamType.KNOB, name: 'pitchDecay', get: () => this.pitchDecay, set: (v) => this.pitchDecay = v, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })

        this.props.set('wave', { type: ParamType.DROPDOWN, name: 'Wave', get: () => this.wave, set: (v:string) => this.wave = v, options: [ 'sine', 'square', 'sawtooth', 'triangle', 'pulse', ], groupID: 1 })
        this.props.set('phase', { type: ParamType.KNOB, name: 'Phase', get: () => this.phase, set: (v:number) => this.phase = v, min:0, max: 100, groupID: 1 })
        
        this.props.set('attack', { type: ParamType.KNOB, name: 'Attack', get: () => this.attack, set: (v:number) => this.attack = v, min: 0, max: 5, step: 0.01, precision: 2, groupID: 2 })
        this.props.set('decay', { type: ParamType.KNOB, name: 'Decay', get: () => this.decay, set: (v:number) => this.decay = v, min: 0, max: 5, step: 0.01, precision: 2, groupID: 2 })
        this.props.set('sustain', { type: ParamType.KNOB, name: 'Sustain', get: () => this.sustain, set: (v:number) => this.sustain = v, min: 0, max: 1, step: 0.01, precision: 2, groupID: 2 })
        this.props.set('release', { type: ParamType.KNOB, name: 'Release', get: () => this.release, set: (v:number) => this.release = v, min: 0, max: 5, step: 0.01, precision: 2, groupID: 2 })
    }

    set volume(v: number) {

        this._volume = v 
        this.synth.volume.setValueAtTime(this.volume, Tone.getContext().currentTime)
        // this.gain.gain.setValueAtTime(this.volume, Tone.getContext().currentTime)
    }
    get volume() { return this._volume }

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

    get octaves() { return this._octaves }
    set octaves(p) {

        this._octaves = p

        this.synth.set({
        // @ts-ignore
            octaves: this._octaves
        })
    }

    get pitchDecay() { return this._pitchDecay }
    set pitchDecay(p) {

        this._pitchDecay = p
        
        this.synth.set({
        // @ts-ignore
            pitchDecay: this._pitchDecay
        })
    }

    get phase() { return this._phase }
    set phase(d) {

        this._phase = d

        this.synth.set({ 

            oscillator: {

                phase: this._phase 
            }
        })
    }

    get wave() { return this._wave }
    set wave(d) {

        this._wave = d

        this.synth.set({ 

            oscillator: {
                
        // @ts-ignore
                type: this._wave 
            }
        })
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
            // @ts-ignore
            harmonicity: this.harmonicity,
            phase: this.phase,

            attack: this.attack,
            decay: this.decay,
            sustain: this.sustain,
            release: this.release,
        }
    }
}