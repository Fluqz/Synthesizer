import * as Tone from 'tone'
import { Instrument } from './instrument';
import { Synthesizer } from '../../synthesizer';
import { ParamType, Node } from '../node';
import type { ToneWithContextOptions } from 'tone/build/esm/core/context/ToneWithContext';



/** 
 * 
fadeIn : Time	
fadeOut : Time	
playbackRate : Positive	
type : NoiseType	
volume : Decibels	

 */
export class Noise extends Instrument {

    public envelope: Tone.AmplitudeEnvelope

    public noise: Tone.Noise

    /** Gain node */
    public gain: Tone.Gain

    /** How loud */
    private _volume: number
    /** Wave types. Sine, Triangle, Square, Saw */
    private _wave: Tone.NoiseType

    private _fadeIn: Tone.Unit.Time
    private _fadeOut: Tone.Unit.Time
    private _playbackRate: number

    private _attack: number
    private _decay: number
    private _sustain: number
    private _release: number

    /** Is the osc already playing */
    private isPlaying: boolean


    /** freq, detune, volume, waveform,  */
    constructor(volume?: number, frequency?: number, detune?: number) {

        super('Noise')

        this.noise = new Tone.Noise()
        this.noise.start(Tone.now())

        this.envelope = new Tone.AmplitudeEnvelope()
        this.gain = new Tone.Gain(1)

        this.output = this.gain

        this.isPlaying = false

        const noiseDefaults = this.noise.get()
        const envDefaults = this.envelope.get()

        this.volume = volume ? volume : .4
        this.fadeIn = noiseDefaults.fadeIn
        this.fadeOut = noiseDefaults.fadeOut
        this.playbackRate = noiseDefaults.playbackRate
        this.attack = envDefaults.attack as number
        this.decay = envDefaults.decay as number
        this.sustain = envDefaults.sustain
        this.release = envDefaults.release as number
        this.wave = noiseDefaults.type


        this.props.set('volume', { type: ParamType.KNOB, name: 'Volume', get: () => this.volume, set: (v:number) => this.volume = v, min: 0, max:1, groupID: 0 })

        this.props.set('fadeIn', { type: ParamType.KNOB, name: 'Fade In', get: () => this.fadeIn, set: (v:number) => this.fadeIn = v, min: 0, max:1, groupID: 0 })
        this.props.set('fadeOut', { type: ParamType.KNOB, name: 'Fade Out', get: () => this.fadeOut, set: (v:number) => this.fadeOut = v, min: 0, max:1, groupID: 0 })
        this.props.set('playbackRate', { type: ParamType.KNOB, name: 'Playback Rate', get: () => this.playbackRate, set: (v:number) => this.playbackRate = v, min: 0, max:1, groupID: 0 })

        this.props.set('wave', { type: ParamType.DROPDOWN, name: 'Wave', get: () => this.wave, set: (v:string) => this.wave = v, options: [ 'white', 'brown', 'pink' ], groupID: 1 })
        
        this.props.set('attack', { type: ParamType.KNOB, name: 'Attack', get: () => this.attack, set: (v:number) => this.attack = v, min: .1, max: 5, groupID: 4 })
        this.props.set('decay', { type: ParamType.KNOB, name: 'Decay', get: () => this.decay, set: (v:number) => this.decay = v, min: 0, max: 5, groupID: 4 })
        this.props.set('sustain', { type: ParamType.KNOB, name: 'Sustain', get: () => this.sustain, set: (v:number) => this.sustain = v, min: 0, max: 1, groupID: 4 })
        this.props.set('release', { type: ParamType.KNOB, name: 'Release', get: () => this.release, set: (v:number) => this.release = v, min: 0, max: 5, groupID: 4 })
    }

    get volume() { return this._volume }
    set volume(v) {

        this._volume = v

        this.gain.gain.setValueAtTime(this._volume, Tone.now())
    }

    get fadeIn() { return this._fadeIn }
    set fadeIn(f) {

        this._fadeIn = f

        this.noise.set({ fadeIn: this._fadeIn })
    }

    get fadeOut() { return this._fadeOut }
    set fadeOut(f) {

        this._fadeOut = f

        this.noise.set({ fadeOut: this._fadeOut })
    }

    get playbackRate() { return this._playbackRate }
    set playbackRate(f) {

        this._playbackRate = f

        this.noise.set({ playbackRate: this._playbackRate })
    }

    get wave() { return this._wave }
    set wave(w) {

        this._wave = w
        this.noise.set({ type: this._wave })
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

        this.isPlaying = true

        this.envelope.triggerAttack(time, velocity)
    }

    triggerReleaseNote(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity:number = 1): void {
        
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

        this.noise.connect(this.envelope)

        this.envelope.connect(this.gain)

        this.output = this.gain

        this.output.connect(n instanceof Node ? n.input : n)
    }

    chain(nodes: Node[] | Tone.ToneAudioNode[]) {

        if(!nodes.length || nodes.length == 0) return // this.connect(nodes)

        this.noise.connect(this.envelope)

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

        this.noise.stop(Tone.now() + this.envelope.toSeconds(this.envelope.release))

        this.noise.disconnect()
        this.noise.dispose()

        super.destroy()
    }
 
    serializeIn(o) {

        super.serializeIn(o)
        
        if(o.name != undefined) this.name = o.name
        if(o.enabled != undefined) this.enabled = o.enabled
        if(o.volume != undefined) this.volume = o.volume

        if(o.wave != undefined) this.wave = o.wave
        if(o.fadeIn != undefined) this.fadeIn = o.fadeIn
        if(o.fadeOut != undefined) this.fadeOut = o.fadeOut
        if(o.playbackRate != undefined) this.playbackRate = o.playbackRate

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

            wave: this.wave,
            
            fadeIn: this.fadeIn,
            fadeOut: this.fadeOut,
            playbackRate: this.playbackRate,

            attack: this.attack,
            decay: this.decay,
            sustain: this.sustain,
            release: this.release,
        }
    }
}