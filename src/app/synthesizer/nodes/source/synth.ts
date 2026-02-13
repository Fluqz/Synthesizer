import * as Tone from 'tone'
import { Instrument, InstrumentType } from './instrument';
import { Synthesizer } from '../../synthesizer';
import { ParamType } from '../node';


/** {
 * 
 * 
  "volume": 0,
  "detune": 0.5,
  "portamento": 0,
  "envelope": {
    "attack": 0.005,
    "attackCurve": "linear",
    "decay": 0.1,
    "decayCurve": "exponential",
    "release": 1,
    "releaseCurve": "exponential",
    "sustain": 0.3
  },
  "oscillator": {
    "partialCount": 0,
    "partials": [],
    "phase": 0,
    "type": "triangle"
  }

  
}  */
export class Synth extends Instrument {

    synth: Tone.PolySynth
    /** How loud */
    _volume: number
    /** Slight detuning of the note */
    _detune: number
    /** Attack  */
    _attack: number
    /** Attack  */
    _attackCurve: string | number[]
    /** Decay */
    _decay: number
    /** Decay Curve */
    _decayCurve: string | number[]
    /** Release */
    _release: number
    /** Release Curve */
    _releaseCurve: string | number[]
    /** Sustain */
    _sustain: number
    /** Partials */
    _partials: number[]
    /** Partial Count */
    _partialCount: number
    /** Wave Type */
    _waveType: string
    /** Phase */
    _phase: number
    /** Gliding */
    _portamento: number

    /** freq, detune, volume, waveform,  */
    constructor() {

        super('Synth', InstrumentType.MONO)

        this.synth = new Tone.PolySynth(Tone.Synth)
        this.output = this.synth

        // this.gain = new Tone.Gain(this.volume)

        // this.synth.connect(this.gain)

        // this.output = this.gain

        this.volume = 3
        this.detune = .5
        this.portamento = 0

        const data = this.synth.get() as Tone.SynthOptions

        this.volume == data.volume
        this.detune == data.detune
        this.attack == data.envelope.attack
        this.attackCurve == data.envelope.attackCurve
        this.decay == data.envelope.decay
        this.decayCurve == data.envelope.decayCurve
        this.release == data.envelope.release
        this.releaseCurve == data.envelope.releaseCurve
        this.sustain == data.envelope.sustain
        // this.partialCount == data.oscillator.partialCount
        // this.partials == data.oscillator.partials
        this.phase == data.oscillator.phase
        this.waveType == data.oscillator.type
        this.portamento == data.portamento

        this.props.set('volume', { type: ParamType.KNOB, name: 'Volume', get: () => { return this.volume }, set: (v) => this.volume = v, min: -70, max: 6, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('detune', { type: ParamType.KNOB, name: 'Detune', get: () => { return this.detune }, set: (v) => this.detune = v, min: -100, max: 100, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('portamento', { type: ParamType.KNOB, name: 'Portamento', get: () => { return this.portamento }, set: (v) => this.portamento = v, min: 0, max: 100, step: 0.01, precision: 2, groupID: 1 })

        this.props.set('attack', { type: ParamType.KNOB, name: 'Attack', get: () => { return this.attack }, set: (v) => { this.attack = v }, min: 0, max: 1, step: 0.01, precision: 2, groupID: 1 })
        this.props.set('attackCurve', { type: ParamType.KNOB, name: 'AttackCurve', get: () => { return this.attackCurve }, set: (v) => { this.attackCurve = v }, min: 0, max: 1, step: 0.01, precision: 2, groupID: 1 })
        this.props.set('decay', { type: ParamType.KNOB, name: 'Decay', get: () => { return this.decay }, set: (v) => { this.decay = v }, min: 0, max: 1, step: 0.01, precision: 2, groupID: 1 })
        this.props.set('decayCurve', { type: ParamType.KNOB, name: 'DecayCurve', get: () => { return this.decayCurve }, set: (v) => { this.decayCurve = v }, min: 0, max: 1, step: 0.01, precision: 2, groupID: 1 })
        this.props.set('release', { type: ParamType.KNOB, name: 'Release', get: () => { return this.release }, set: (v) => { this.release = v }, min: 0, max: 1, step: 0.01, precision: 2, groupID: 1 })
        this.props.set('releaseCurve', { type: ParamType.KNOB, name: 'ReleaseCurve', get: () => { return this.releaseCurve }, set: (v) => { this.releaseCurve = v }, min: 0, max: 1, step: 0.01, precision: 2, groupID: 1 })
        this.props.set('sustain', { type: ParamType.KNOB, name: 'Sustain', get: () => { return this.sustain }, set: (v) => { this.sustain = v }, min: 0, max: 1, step: 0.01, precision: 2, groupID: 1 })
        this.props.set('phase', { type: ParamType.KNOB, name: 'Phase', get: () => { return this.phase }, set: (v) => { this.phase = v }, min: 0, max: 100, step: 0.01, precision: 2, groupID: 2 })

        this.props.set('wave', { type: ParamType.DROPDOWN, name: 'Wave', get: () => this.waveType, set: (v:string) => this.waveType = v, options: [ 'sine', 'square', 'sawtooth', 'triangle', 'pulse', ], groupID: 2 })
        // this.props.set('wavePartial', { type: ParamType.DROPDOWN, name: 'Wave Partial', get: () => this.partials, set: (v) => this.partials = v, options: ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], group: 2 })
        // this.props.set('partialCount', { type: ParamType.KNOB, name: 'PartialCount', get: () => { return this.partialCount }, set: (v) => { this.partialCount = v }, min: 0, max: 1, steps: '1', groupID: 2 })
    }

    set volume(v: number) {

        this._volume = v
        // this.gain.gain.setValueAtTime(this.volume, Tone.getContext().currentTime)
        this.synth.volume.setValueAtTime(this.volume, Tone.getContext().currentTime)
    }
    get volume() { return this._volume }


    set detune(d: number) {
        this._detune = d
        this.synth.set({ detune: this._detune })
    }
    get detune() { return this._detune }

    set attack(d: number) {
        this._attack = d
        this.synth.set({ envelope: { attack: this._attack } })
    }
    get attack() { return this._attack }

    set attackCurve(d) {
        this._attackCurve = d
        // @ts-ignore
        this.synth.set({ envelope: { attackCurve: this._attackCurve } })
    }
    get attackCurve() { return this._attackCurve }

    set decay(d: number) {
        this._decay = d
        this.synth.set({ envelope: { decay: this._decay } })
    }
    get decay() { return this._decay }

    set decayCurve(d) {
        this._decayCurve = d
        // @ts-ignore
        this.synth.set({ envelope: { decayCurve: this._decayCurve } })
    }
    get decayCurve() { return this._decayCurve }

    set release(d: number) {
        this._release = d
        this.synth.set({ envelope: { release: this._release } })
    }
    get release() { return this._release }

    set releaseCurve(d) {
        this._releaseCurve = d
        // @ts-ignore
        this.synth.set({ envelope: { releaseCurve: this._releaseCurve } })
    }
    get releaseCurve() { return this._releaseCurve }

    set sustain(d: number) {
        this._sustain = d
        this.synth.set({ envelope: { sustain: this._sustain } })
    }
    get sustain() { return this._sustain }

    get partials() { return this._partials }
    set partials(p) {

        this._partials = p
        this.synth.set({ oscillator: { partials: this._partials } })
    }

    get partialCount() { return this._partialCount }
    set partialCount(p) {

        this._partialCount = p
        this.synth.set({ oscillator: { partialCount: this._partialCount } })
    }

    get phase() { return this._phase }
    set phase(p) {

        this._phase = p
        this.synth.set({ oscillator: { phase: this._phase } })
    }

    get waveType() { return this._waveType }
    set waveType(p) {

        this._waveType = p
        // @ts-ignore
        this.synth.set({ oscillator: { type: this._waveType } })
    }

    get portamento() { return this._portamento }
    set portamento(p) {

        this._portamento = p
        this.synth.set({ portamento: this._portamento })
    }

    triggerAttack(note: Tone.Unit.Frequency, time: Tone.Unit.Time, velocity: number = 1) {

        this.synth.triggerAttack(note, time, velocity)
    }

    triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity: number = 1): void {

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

        if (o.name != undefined) this.name = o.name
        if (o.enabled != undefined) this.enabled = o.enabled
        if (o.volume != undefined) this.volume = o.volume
        if (o.detune != undefined) this.detune = o.detune
        if (o.attack != undefined) this.attack = o.attack
        if (o.attackCurve != undefined) this.attackCurve = o.attackCurve
        if (o.decay != undefined) this.decay = o.decay
        if (o.decayCurve != undefined) this.decayCurve = o.decayCurve
        if (o.release != undefined) this.release = o.release
        if (o.releaseCurve != undefined) this.releaseCurve = o.releaseCurve
        if (o.sustain != undefined) this.sustain = o.sustain
        if (o.partialCount != undefined) this.partialCount = o.partialCount
        if (o.partials != undefined) this.partials = o.partials
        if (o.phase != undefined) this.phase = o.phase
        if (o.type != undefined) this.type = o.type
        if (o.portamento != undefined) this.portamento = o.portamento
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,

            name: this.name,
            enabled: this.enabled,
            volume: this.volume,
            detune: this.detune,
            attack: this.attack,
            attackCurve: this.attackCurve,
            decay: this.decay,
            decayCurve: this.decayCurve,
            release: this.release,
            releaseCurve: this.releaseCurve,
            sustain: this.sustain,
            partialCount: this.partialCount,
            partials: this.partials,
            phase: this.phase,
            type: this.type,
            portamento: this.portamento,
        }
    }
}