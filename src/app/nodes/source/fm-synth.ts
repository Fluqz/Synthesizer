import * as Tone from 'tone'
import { Instrument } from './instrument';
import { Synthesizer } from '../../synthesizer';
import { InputType } from '../node';


/**  */
export class FMSynth extends Instrument {

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

    /** freq, detune, volume, waveform,  */
    constructor(options? = {}) {

        super('FMSynth')

        this.synth = new Tone.PolySynth(Tone.FMSynth)

        this.gain = new Tone.Gain(this.volume)

        this.synth.connect(this.gain)

        this.output = this.gain

        this.volume = options.volume ? options.volume : 3
        this.detune = options.detune ? options.detune : .5
        this.portamento = options.portamento ? options.portamento : 0


        console.log(this.synth)

        this.props.set('volume', { type: InputType.KNOB, name: 'Volume', get: () =>  this.volume, set: (v) => this.volume = v })
        this.props.set('detune', { type: InputType.KNOB, name: 'Detune', get: () =>  this.detune, set: (v) => this.detune = v })
        this.props.set('portamento', { type: InputType.KNOB, name: 'Portamento', get: () =>  this.portamento, set: (v) => this.portamento = v })
        
        // this.props.set('sampleTime', { type: InputType.KNOB, name: 'sampleTime', get: () =>  this.sampleTime, set: (v) => this.sampleTime = v })
    
        // this.props.set('wave', { type: InputType.DROPDOWN, name: 'Wave', get: () => this.wave, set: (v:string) => this.wave = v, options: ['triangle', 'sine', 'square', 'sawtooth'], group: 1 })
        // this.props.set('wavePartial', { type: InputType.DROPDOWN, name: 'Wave Partial', get: () => this.wavePartial, set: (v:string) => this.wavePartial = v, options: ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], group: 1 })

        this.props.set('detune', { type: InputType.KNOB, name: 'Detune', get: () => this.detune, set: (v:number) => this.detune = v, group: 2 })
        this.props.set('phase', { type: InputType.KNOB, name: 'Phase', get: () => this.phase, set: (v:number) => this.phase = v, group: 2 })
        
        this.props.set('attack', { type: InputType.KNOB, name: 'Attack', get: () => this.attack, set: (v:number) => this.attack = v, group: 4 })
        this.props.set('decay', { type: InputType.KNOB, name: 'Decay', get: () => this.decay, set: (v:number) => this.decay = v, group: 4 })
        this.props.set('sustain', { type: InputType.KNOB, name: 'Sustain', get: () => this.sustain, set: (v:number) => this.sustain = v, group: 4 })
        this.props.set('release', { type: InputType.KNOB, name: 'Release', get: () => this.release, set: (v:number) => this.release = v, group: 4 })
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







    triggerNote(note: string) {

        this.synth.triggerAttack(note, Tone.now())
    }

    releaseNote(note: string) {

        this.synth.triggerRelease(note, Tone.now())
    }


    serializeIn(o) {

        if(o.enabled) this.enabled = o.enabled
        if(o.volume) this.volume = o.volume
        if(o.detune) this.detune = o.detune
        if(o.portamento) this.portamento = o.portamento
    }

    serializeOut() {

        return {

            name: this.name,
            enabled: this.enabled,
            volume: this.volume,
            detune: this.detune,
            portamento: this.portamento
        }
    }
}