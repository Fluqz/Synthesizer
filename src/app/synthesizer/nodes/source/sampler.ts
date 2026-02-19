import * as Tone from 'tone'
import { Instrument, InstrumentType } from './instrument';
import { NodeName } from '../../synthesizer';
import { ParamType } from '../node';
import { DB } from './../../../core/db';
import { G } from '../../../globals';

const samples = [

    { path: G.PATH + 'assets/samples/synth/SweepFm7.wav', name: 'Sweep Fm7' },
    { path: G.PATH + 'assets/samples/synth/Back_Home_F_01.wav', name: 'Back Home F'},
    { path: G.PATH + 'assets/samples/drums/kick/Boxed_Ear_Vertice_11.wav', name: 'Kick1'},
    { path: G.PATH + 'assets/samples/drums/kick/grit_3.wav', name: 'Kick2'},
    { path: G.PATH + 'assets/samples/drums/kick/hip-hop-kick.wav', name: 'Kick3'},
    { path: G.PATH + 'assets/samples/drums/snare/Wu_1p.wav', name: 'Snare1'},
    { path: G.PATH + 'assets/samples/drums/snare/dilla_snare.wav', name: 'Snare2'},
    { path: G.PATH + 'assets/samples/drums/snare/g.wav', name: 'Snare3'},
    { path: G.PATH + 'assets/samples/drums/snare/snare2.wav', name: 'Snare4'},
    { path: G.PATH + 'assets/samples/drums/snare/snare5.wav', name: 'Snare5'},
    { path: G.PATH + 'assets/samples/drums/snare/snare6.wav', name: 'Snare6'},

    { path: G.PATH + 'assets/samples/drums/hihat/WU_HH_179.wav', name: 'Hihat1'},
    { path: G.PATH + 'assets/samples/drums/hihat/Wu_1p1.wav', name: 'Hihat2'},
    { path: G.PATH + 'assets/samples/drums/hihat/Wu_1p2.wav', name: 'Hihat3'},
    { path: G.PATH + 'assets/samples/drums/hihat/Wu_1p3.wav', name: 'Hihat4'},
    { path: G.PATH + 'assets/samples/drums/hihat/hat_1.wav', name: 'Hihat5'},
    { path: G.PATH + 'assets/samples/drums/hihat/hat_3.wav', name: 'Hihat6'},
    { path: G.PATH + 'assets/samples/drums/hihat/hat_4.wav', name: 'Hihat7'},

    { path: G.PATH + 'assets/samples/drums/perc/Boxed_Ear_Vertice_72.wav', name: 'perc1'},
    { path: G.PATH + 'assets/samples/drums/perc/Percussion_08.wav', name: 'perc2'},
    { path: G.PATH + 'assets/samples/drums/perc/WU_HH_191.wav', name: 'perc3'},
    { path: G.PATH + 'assets/samples/drums/perc/perc5.wav', name: 'perc4'},

    { path: G.PATH + 'assets/samples/drums/cymbal/Ride.wav', name: 'Cymbal1'},
    { path: G.PATH + 'assets/samples/drums/cymbal/WU_HH_177.wav', name: 'Cymbal2'},
    { path: G.PATH + 'assets/samples/drums/cymbal/WU_HH_198.wav', name: 'Cymbal3'},
    { path: G.PATH + 'assets/samples/drums/cymbal/WU_HH_199.wav', name: 'Cymbal4'},
]

export class Sampler extends Instrument {

    sampler: Tone.Sampler
    /** How loud */
    _volume: number
    /** Gain node */
    // gain: Tone.Gain
    /** Slight detuning of the note */
    _detune: number
    /** Offset of the wave */
    _portamento: number
    _attack
    _release

    _sample: string

    /** freq, detune, volume, waveform,  */
    constructor() {

        super(NodeName.Sampler, InstrumentType.MONO)

        // this.gain = new Tone.Gain(this.volume)

        // this.output = this.gain

        this.volume = .5

        const opts = samples.map((a) => { return a.name })
        this.sample = opts[0]

        this.attack = this.sampler.get().attack
        this.release = this.sampler.get().release

        this.props.set('volume', { type: ParamType.KNOB, name: 'Volume', get: () =>  this.volume, set: (v) => this.volume = v, min: -70, max: 6, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('attack', { type: ParamType.KNOB, name: 'Attack', get: () =>  this.attack, set: (v) => this.attack = v, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('release', { type: ParamType.KNOB, name: 'Release', get: () =>  this.release, set: (v) => this.release = v, min: 0, max: 5, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('sample', { type: ParamType.DROPDOWN, name: 'Sample', get: () =>  this.sample, set: (v) => this.sample = v, fileUploadHandler: this.fileUploadHandler.bind(this), options: opts, fileUpload: true, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
    }

    set volume(v: number) {

        this._volume = v 
        if(this.sampler) this.sampler.volume.setValueAtTime(this.volume, Tone.getContext().currentTime)
        // this.gain.gain.setValueAtTime(this.volume, Tone.getContext().currentTime)
    }
    get volume() { return this._volume }

    set sample(v: string) {

        console.log('set sample', v)

        if(v == this._sample) return

        this._sample = v

        const path = this._getSamplePath(this._sample)

        console.log('sample path', path)

        if(path == undefined) {

            console.log('GET FROM DB', this._sample)

            // DB.get(this._sample).then(path => {

            //     console.log('RESULT', path)

            //     this._setSampler(path)
            // })
        }
        else {

            this._setSampler(path)
        }

    }
    get sample() { return this._sample }

    private _setSampler(path: string | Tone.ToneAudioBuffer) {

        if(this.sampler != undefined) this.sampler.dispose()
        this.sampler = new Tone.Sampler({

            urls: {
                F2: path,
            }
        })

        this.output = this.sampler

        this.chain(Array.from(this.connectedOutputs.values()).reverse())
    }

    private _getSamplePath(key: string) {

        for(let s of samples) {

            if(s.name == key) return s.path
        }
        
        return undefined
    }


    get attack() { return this._attack }
    set attack(d) {

        this._attack = d
        this.sampler.set({ attack: this._attack })
    }

    get release() { return this._release }
    set release(d) {

        this._release = d
        this.sampler.set({ release: this._release })
    }

    triggerAttack(note: Tone.Unit.Frequency, time: Tone.Unit.Time, velocity: number = 1) {

        if(!this.sampler.loaded) return

        this.sampler.triggerAttack(note, time, velocity)
    }

    triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity:number = 1): void {
        
        if(!this.sampler.loaded) return
        
        this.sampler.triggerAttackRelease(note, duration, time, velocity)
    }

    triggerRelease(note: Tone.Unit.Frequency, time: Tone.Unit.Time) {

        if(!this.sampler.loaded) return

        this.sampler.triggerRelease(note, time)
    }
    
    releaseAll() {
        
        this.sampler.releaseAll()
    }

    fileUploadHandler(file: File) {

        console.log('Fileuploadhandler', file)

        const url = URL.createObjectURL(file)

        DB.set(file.name, url)

        this.sample = file.name
    }

    
    
    override destroy() {
        
        this.sampler.releaseAll()
        this.sampler.disconnect()
        
        this.sampler.dispose()
        // @ts-ignore
        this.sampler.context._timeouts.cancel(0)
        
        super.destroy()
    }

    override serializeIn(o) {

        super.serializeIn(o)

        if(o.name != undefined) this.name = o.name
        if(o.enabled != undefined) this.enabled = o.enabled
        if(o.volume != undefined) this.volume = o.volume

        console.log('SERIALIZE IN ', o.sample)
        if(o.sample != undefined) this.sample = o.sample
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,
            name: this.name,
            enabled: this.enabled,
            volume: this.volume,
            sample: this.sample,
        }
    }
}