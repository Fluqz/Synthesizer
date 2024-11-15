import * as Tone from 'tone'
import { Instrument, InstrumentType } from './instrument';
import { Synthesizer } from '../../synthesizer';
import { ParamType, Node } from '../node';
import type { ToneWithContextOptions } from 'tone/build/esm/core/context/ToneWithContext';



/** 
 * 
 */
export class Oscillator extends Instrument {

    public envelope: Tone.AmplitudeEnvelope

    public osc: Tone.Oscillator

    /** Gain node */
    public gain: Tone.Gain

    /** How loud */
    private _volume: number
    /** Frequency */
    private _frequency: number
    /** Slight detuning of the note */
    private _detune: number
    /** The phase is the starting position within the oscillator's cycle. 
     * For example a phase of 180 would start halfway through the oscillator's cycle. */
    private _phase: number = 0

    /** Wave types. Sine, Triangle, Square, Saw */
    private _wave: Tone.ToneOscillatorType = 'sine'

    /** Wave types. Sine, Triangle, Square, Saw */
    private _wavePartial: string = ''


    private _attack: number
    private _decay: number
    private _sustain: number
    private _release: number


    /** freq, detune, volume, waveform,  */
    constructor(volume?: number, frequency?: number, detune?: number) {

        super('Oscillator', InstrumentType.MONO)

        this.osc = new Tone.Oscillator(this.frequency)
        this.osc.start(Tone.getContext().currentTime)

        this.envelope = new Tone.AmplitudeEnvelope()
        this.gain = new Tone.Gain(1)

        this.output = this.gain

        this.volume = volume ? volume : .4
        this.detune = this.osc.get().detune
        this.phase = this.osc.get().phase
        this.attack = this.envelope.get().attack as number
        this.decay = this.envelope.get().decay as number
        this.sustain = this.envelope.get().sustain
        this.release = this.envelope.get().release as number
        this._wave = 'sine'
        this._wavePartial = ''


        this.props.set('volume', { type: ParamType.KNOB, name: 'Volume', get: () => this.volume, set: (v:number) => this.volume = v, min: 0, max:1, groupID: 0 })

        // @ts-ignore
        this.props.set('wave', { type: ParamType.DROPDOWN, name: 'Wave', get: () => this.wave, set: (v:string) => this.wave = v, options: [ 'sine', 'square', 'sawtooth', 'triangle', 'pulse', ], groupID: 1 })
        this.props.set('wavePartial', { type: ParamType.DROPDOWN, name: 'Wave Partial', get: () => this.wavePartial, set: (v:string) => this.wavePartial = v, options: ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], groupID: 1 })

        this.props.set('detune', { type: ParamType.KNOB, name: 'Detune', get: () => { return this.detune }, set: (v) => this.detune = v, min: -1000, max: 1000, groupID: 2 })
        this.props.set('phase', { type: ParamType.KNOB, name: 'Phase', get: () => this.phase, set: (v:number) => this.phase = v, min: 0, max: 100, groupID: 2 })
        
        this.props.set('attack', { type: ParamType.KNOB, name: 'Attack', get: () => this.attack, set: (v:number) => this.attack = v, min: .1, max: 5, groupID: 4 })
        this.props.set('decay', { type: ParamType.KNOB, name: 'Decay', get: () => this.decay, set: (v:number) => this.decay = v, min: 0, max: 5, groupID: 4 })
        this.props.set('sustain', { type: ParamType.KNOB, name: 'Sustain', get: () => this.sustain, set: (v:number) => this.sustain = v, min: 0, max: 1, groupID: 4 })
        this.props.set('release', { type: ParamType.KNOB, name: 'Release', get: () => this.release, set: (v:number) => this.release = v, min: 0, max: 5, groupID: 4 })
    }

    get frequency() { return this._frequency }
    set frequency(f) {

        this._frequency = f

        this.osc.frequency.setValueAtTime(this._frequency, Tone.getContext().currentTime)
        // this.osc.frequency.exponentialRampToValueAtTime(this._frequency, Tone.getContext().currentTime)
    }

    get volume() { return this._volume }
    set volume(v) {

        this._volume = v

        this.gain.gain.setValueAtTime(this._volume, Tone.getContext().currentTime)
    }

    get wave() { return this._wave }
    set wave(w) {

        this._wave = w
        this.osc.set({ type: this._wave })
    }

    get wavePartial() { return this._wavePartial }
    set wavePartial(w) {

        this._wavePartial = w
        this.osc.set({ type: this._wave })
    }

    get detune() { return this._detune }
    set detune(d) {


        this._detune = d

        this.osc.detune.setValueAtTime(this._detune, Tone.getContext().currentTime)
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

    triggerAttack(note: Tone.Unit.Frequency, time: Tone.Unit.Time, velocity: number = 1) {

        this.frequency = Tone.Frequency(note).toFrequency()

        this.isPlaying = true

        this.envelope.triggerAttack(time, velocity)
    }

    triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity:number = 1): void {
        
        this.frequency = Tone.Frequency(note).toFrequency()

        this.envelope.triggerAttackRelease(duration, time, velocity)

        this.isPlaying = true

        Tone.Transport.scheduleOnce((time) => {

            this.isPlaying = false
            
        }, Tone.Time(time).toSeconds() + Tone.Time(duration).toSeconds())
    }

    triggerRelease(note: Tone.Unit.Frequency, time: Tone.Unit.Time) {

        this.isPlaying = false

        // const otherPlayedNote = Array.from(Synthesizer.activeNotes).pop()
        // if(this.isPlaying || Synthesizer.activeNotes.size > 0 && otherPlayedNote != note) {

        //     // console.log('play other note', Synthesizer.activeNotes)
        //     this.triggerAttack(otherPlayedNote, time)
        //     return
        // }
        
        this.envelope.triggerRelease(time)
    }

    releaseAll() {
        
        this.envelope.triggerRelease(Tone.getContext().currentTime)
    }

    override connect(n: Node | Tone.ToneAudioNode<ToneWithContextOptions>): void {

        this.osc.connect(this.envelope)

        this.envelope.connect(this.gain)

        this.output = this.gain

        super.connect(n)
    }

    override chain(nodes: Node[] | Tone.ToneAudioNode[]) {

        if(!nodes.length || nodes.length == 0) return // this.connect(nodes)

        this.osc.connect(this.envelope)

        this.envelope.connect(this.gain)

        this.output = this.gain

        super.chain(nodes)
    }

    override destroy() {

        this.envelope.triggerRelease(Tone.getContext().currentTime)
        this.envelope.disconnect()
        this.envelope.dispose()

        this.osc.stop(Tone.getContext().currentTime + this.envelope.toSeconds(this.envelope.release))

        this.osc.disconnect()
        this.osc.dispose()
        // @ts-ignore
        this.osc.context._timeouts.cancel(0)

        super.destroy()
    }
 
    override serializeIn(o) {

        super.serializeIn(o)
        
        if(o.name != undefined) this.name = o.name
        if(o.enabled != undefined) this.enabled = o.enabled
        if(o.volume != undefined) this.volume = o.volume

        if(o.detune != undefined) this.detune = o.detune
        if(o.phase != undefined) this.phase = o.phase
        if(o.wave != undefined) this.wave = o.wave
        if(o.wavePartial != undefined) this.wavePartial = o.wavePartial

        if(o.attack != undefined) this.attack = o.attack
        if(o.decay != undefined) this.decay = o.decay
        if(o.sustain != undefined) this.sustain = o.sustain
        if(o.release != undefined) this.release = o.release
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,

            name: this.name,
            enabled: this.enabled,
            volume: this.volume,
            
            detune: this.detune,
            phase: this.phase,
            wave: this.wave,
            wavePartial: this.wavePartial,

            attack: this.attack,
            decay: this.decay,
            sustain: this.sustain,
            release: this.release,
        }
    }
}