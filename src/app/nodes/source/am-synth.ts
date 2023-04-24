import * as Tone from 'tone'
import { Instrument } from './instrument';
import { Synthesizer } from '../../synthesizer';
import { ParamType } from '../node';



const o = {
    "volume": 0, 
    "detune": 0, 
    "portamento": 0, 
    "harmonicity": 3,
    "oscillator": { "partialCount": 0, "partials": [], "phase": 0, "type": "sine" }, 
    "envelope": { "attack": 0.01, "attackCurve": "linear", "decay": 0.01, "decayCurve": "exponential", "release": 0.5, "releaseCurve": "exponential", "sustain": 1 }, 
    "modulation": { "partialCount": 0, "partials": [], "phase": 0, "type": "square" }, 
    "modulationEnvelope": { "attack": 0.5, "attackCurve": "linear", "decay": 0, "decayCurve": "exponential", "release": 0.5, "releaseCurve": "exponential", "sustain": 1 }
}



/** 
 * { "volume": 0, "detune": 0, "portamento": 0, "harmonicity": 3, "oscillator": { "partialCount": 0, "partials": [], "phase": 0, "type": "sine" }, "envelope": { "attack": 0.01, "attackCurve": "linear", "decay": 0.01, "decayCurve": "exponential", "release": 0.5, "releaseCurve": "exponential", "sustain": 1 }, "modulation": { "partialCount": 0, "partials": [], "phase": 0, "type": "square" }, "modulationEnvelope": { "attack": 0.5, "attackCurve": "linear", "decay": 0, "decayCurve": "exponential", "release": 0.5, "releaseCurve": "exponential", "sustain": 1 } }
 */
export class AMSynth extends Instrument {

    synth: Tone.PolySynth
    /** How loud */
    _volume: number
    /** Gain node */
    gain: Tone.Gain
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
    constructor(options: any = {}) {

        super('AMSynth')

        this.synth = new Tone.PolySynth(Tone.AMSynth)

        this.gain = new Tone.Gain(this.volume)

        this.synth.connect(this.gain)

        this.output = this.gain

        
        this.volume = options.volume != undefined ? options.volume : 3

        this.detune = options.detune != undefined ? options.detune : this.synth.get().detune
        this.portamento = options.portamento != undefined ? options.portamento : this.synth.get().portamento
        this.harmonicity = options.harmonicity != undefined ? options.harmonicity : this.synth.get().harmonicity
        this.phase = options.phase != undefined ? options.phase : this.synth.get().oscillator.phase

        this.attack = options.attack != undefined ? options.attack : this.synth.get().envelope.attack
        this.decay = options.decay != undefined ? options.decay : this.synth.get().envelope.decay
        this.sustain = options.sustain != undefined ? options.sustain : this.synth.get().envelope.sustain
        this.release = options.release != undefined ? options.release : this.synth.get().envelope.release


        this.props.set('volume', { type: ParamType.KNOB, name: 'Volume', get: () => this.volume, set: (v) => this.volume = v })
        this.props.set('detune', { type: ParamType.KNOB, name: 'Detune', get: () => this.detune, set: (v) => this.detune = v })
        this.props.set('portamento', { type: ParamType.KNOB, name: 'Portamento', get: () => this.portamento, set: (v) => this.portamento = v })

        // this.props.set('sampleTime', { type: ParamType.KNOB, name: 'sampleTime', get: () =>  this.sampleTime, set: (v) => this.sampleTime = v })

        // this.props.set('wave', { type: ParamType.DROPDOWN, name: 'Wave', get: () => this.wave, set: (v:string) => this.wave = v, options: ['triangle', 'sine', 'square', 'sawtooth'], group: 1 })
        // this.props.set('wavePartial', { type: ParamType.DROPDOWN, name: 'Wave Partial', get: () => this.wavePartial, set: (v:string) => this.wavePartial = v, options: ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], group: 1 })

        this.props.set('harmonicity', { type: ParamType.KNOB, name: 'Harmonicity', get: () => this.harmonicity, set: (v: number) => this.harmonicity = v, min: 0, max: 5, group: 2 })

        this.props.set('phase', { type: ParamType.KNOB, name: 'Phase', get: () => this.phase, set: (v: number) => this.phase = v, group: 2 })

        this.props.set('attack', { type: ParamType.KNOB, name: 'Attack', get: () => this.attack, set: (v: number) => this.attack = v, min: 0, max: 5, group: 4 })
        this.props.set('decay', { type: ParamType.KNOB, name: 'Decay', get: () => this.decay, set: (v: number) => this.decay = v, min: 0, max: 5, group: 4 })
        this.props.set('sustain', { type: ParamType.KNOB, name: 'Sustain', get: () => this.sustain, set: (v: number) => this.sustain = v, min: 0, max: 5, group: 4 })
        this.props.set('release', { type: ParamType.KNOB, name: 'Release', get: () => this.release, set: (v: number) => this.release = v, min: 0, max: 5, group: 4 })
    }

    set volume(v: number) {

        this._volume = v
        this.gain.gain.setValueAtTime(this.volume, Tone.now())
    }
    get volume() { return this._volume }

    // set sampleTime(v: number) {

    //     this._sampleTime = v 
    //     this.synth.set({ sampleTime: this._sampleTime })
    // }
    // get sampleTime() { return this._sampleTime }


    set harmonicity(d: number) {
        this._harmonicity = d
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
        this.synth.set({ oscillator: { phase: this._phase } })
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







    triggerNote(note: string) {

        this.synth.triggerAttack(note, Tone.now())
    }

    releaseNote(note: string) {

        this.synth.triggerRelease(note, Tone.now())
    }
    

    serializeIn(o) {

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

    serializeOut() {

        return {

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