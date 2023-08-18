
import * as Tone from 'tone'

import * as RxJs from 'rxjs'

import { Key } from './key'

import { Sampler, Synth, DuoSynth, Instrument, FMSynth, AMSynth, Delay, Tremolo, Reverb, Chorus, Distortion, Oscillator, Effect, AutoFilter, Phaser, Vibrato, FatOscillator, FMOscillator, AMOscillator, Noise, PWMOscillator, PulseOscillator} from './nodes'

import { Track, type ITrackSerialization } from './track'
import { PresetManager, type IPreset } from './core/preset-manager'
import { writable, type Writable } from 'svelte/store'
import { Sequencer, type ISequencerSerialization } from './sequencer'

export interface ISerialize {

    /** Creates a obj with all information of this entity to eventually restore its current state with serializeIn(). */
    serializeOut: () => ISerialization
    /** Pass in a obj of serialized information to restore the entity's state */
    serializeIn: (o: ISerialization) => void
}

export type ISerialization = {}

export interface ISession {

    bpm: number
    volume: number
    octave: number
    channel: number
    tracks: ITrackSerialization[]
    sequencers: ISequencerSerialization[]
}

export interface ISynthesizerSerialization extends ISerialization {

    presets: IPreset[]
    currentSession: ISession
}

export type Channel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15


/** Synthesizer */
export class Synthesizer implements ISerialize {

    /** Array of keys on the synthesizer */
    static keyMap: string[] = [
        // Upper
        'q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'z', '7', 'u', 'i', '9', 'o', '0', 'p',

        //lower
        '<','a','y','s','x','d','c','v','g','b','h','n','m','k', ',', 'l', '.', 'ö', '-',
    ]

    /** Array of all notes */
    static notes: string[] = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ]

    /** 
     * This array is used to keep track which notes are currently triggered. 
     * There are some issues with polyphonic synths and releasing the note. 
     * In some occasions you can lose track and wont be able to release the note anymore.
     * The note will play for eternity.
     */
    static activeNotes: Set<Tone.Unit.Frequency> = new Set()

    public channel: Channel = 0
    static maxChannelCount: number = 16

    static nodes = {
        effects: {

            Delay: () => { return new Delay(1, .12, .8) },
            Tremolo: () => { return new Tremolo(1, 5, 1) },
            Distortion: () => { return new Distortion(1, .5) },
            Chorus: () => { return new Chorus(1, 4, 20, 1, 1) },
            AutoFilter: () => { return new AutoFilter(1) },
            Reverb: () => { return new Reverb(1) },
            Phaser: () => { return new Phaser(1) },
            Vibrato: () => { return new Vibrato(1) },
        },
        sources: {
	
            Synth: () => { return new Synth() },
            FMSynth: () => { return new FMSynth() },
            AMSynth: () => { return new AMSynth() },
            DuoSynth: () => { return new DuoSynth() },
            // MonoSynth: () => {},
            // MetalSynth:	() => {},
            // PluckSynth:	() => {},

            Oscillator: () => { return new Oscillator() },
            PulseOscillator: () => { return new PulseOscillator() },
            PWMOscillator: () => { return new PWMOscillator() },
            AMOscillator: () => { return new AMOscillator() },
            FMOscillator: () => { return new FMOscillator() },
            FatOscillator: () => { return new FatOscillator() },

            Noise: () => { return new Noise() },
            Sampler: () => { return new Sampler() },
        }
    }

    static createNode(name: string) {

        if(Synthesizer.nodes.sources[name]) return Synthesizer.nodes.sources[name]() as Instrument
        if(Synthesizer.nodes.effects[name]) return Synthesizer.nodes.effects[name]() as Effect
        return null
    }

    /** Array of created Key objects */
    static keys: Key[] = []
    
    /** Octave number */
    octave: number
    /** ToneJs Volume Node as Master Volume */
    volume: Tone.Volume
    /** Arpeggiator Tone.Pattern */
    arp: Tone.Pattern<string>
    /** Arpeggiator array */
    arpPattern: string[] = []
    /** Arpeggiator mode */
    arpMode: boolean = false
    /** Beats per minute */
    _bpm: number = 120
    
    tracks: Track[]

    sequencers: Sequencer[]

    isMuted: boolean = false

    /** ToneJs Recorder instance */
    recorder: Tone.Recorder
    /** Recording flag */
    isRecording: boolean

    presetManager: PresetManager

    // Events
    onKeyDownEvent
    onKeyUpEvent
    onRecordingStart
    onRecordingEnd
    onAddNode
    onRemoveNode


    constructor() {

        this.bpm = 120
        this.octave = 2
        
        // Synthesizer Master Volume
        this.volume = new Tone.Volume(-3)
        this.volume.toDestination()

        this.isRecording = false

        console.log('Register keys', Synthesizer.keyMap, Synthesizer.keyMap.length)
        let key
        let i = 0
        for(let keyMap of Synthesizer.keyMap) {

            key = new Key(
                Synthesizer.notes[i % Synthesizer.notes.length], 
                this.octave + Math.floor(i / Synthesizer.notes.length),
                keyMap
            )

            Synthesizer.keys.push(key)

            key.onTrigger.subscribe(k => {

                this.triggerAttack(k.note + k.octave, Tone.now(), this.channel)
            })

            key.onRelease.subscribe(k => {

                this.triggerRelease(k.note + k.octave, Tone.now(), this.channel)
            })

            i++
        }

        this.tracks = []
        this.addTrack(new Track(this, Synthesizer.nodes.sources.Oscillator()))
        // this.addTrack(new Track(this, Synthesizer.nodes.sources.Synth()))
        // this.addTrack(new Track(this, Synthesizer.nodes.sources.DuoSynth()))
        // this.addTrack(new Track(this, Synthesizer.nodes.sources.FMSynth()))
        // this.addTrack(new Track(this, Synthesizer.nodes.sources.AMSynth()))

        this.sequencers = []
        // this.addSequencer(new Sequencer(this))
        // this.addSequencer(new Sequencer(this, ['F#2', 'D1', 'F#2', 'C#3']))

        this.presetManager = new PresetManager(this)

        // Events
        this.onRecordingStart = new RxJs.Subject()
        this.onRecordingEnd = new RxJs.Subject()

        this.onAddNode = new RxJs.Subject()
        this.onRemoveNode = new RxJs.Subject()

        this.setVolume(-3)
    }

    get bpm() { return Tone.Transport.bpm.value }
    set bpm(bpm:number) { 

        // TODO - WTF Decimals all the time
        Tone.Transport.bpm.value = bpm
    }

    /** Set Master Volume */
    setVolume(v:number) {

        this.volume.volume.setValueAtTime(v, Tone.now())
    }

    /** Mute master */
    mute(m: boolean) {

        this.isMuted = m === true ? true : false

        if(this.isMuted) Tone.Destination.volume.exponentialRampTo(Number.NEGATIVE_INFINITY, .2, Tone.now())
        else Tone.Destination.volume.exponentialRampTo(this.volume.volume.value, .2, Tone.now())

        // Tone.Destination.mute = this.isMuted
    }

    /** Set the octave number */
    setOctave(o) {

        this.octave = o

        let i = 0
        for(let k of Synthesizer.keys) {

            k.setOctave(this.octave + Math.floor(i / Synthesizer.notes.length))

            i++
        }
    }

    /** Add a track to the synthesizer. */
    addTrack(track: Track, i?: number) {

        if(this.tracks.indexOf(track) == -1) this.tracks.push(track)

        track.synthesizer = this
        
        track.connect(this.volume)
    }

    /** Disconnects and removes track */
    removeTrack(track: Track) {
        
        this.tracks.splice(this.tracks.indexOf(track), 1)
        
        track.disconnect(this.volume)

        track.destroy()

        let i = 0
        for(let t of this.tracks) {
            console.log('id', i, t.id)
            i ++
        }
    }


    /** Add a track to the synthesizer. */
    addSequencer(sequencer: Sequencer, i?: number) {

        if(this.sequencers.indexOf(sequencer) == -1) this.sequencers.push(sequencer)

        sequencer.synthesizer = this
    }

    /** Disconnects and removes track */
    removeSequencer(sequencer: Sequencer) {

        this.sequencers.splice(this.sequencers.indexOf(sequencer), 1)

        sequencer.destroy()
    }



    isPlaying = false
    /** Trigger a note - Triggers all tracks */
    triggerAttack(note: Tone.Unit.Frequency, time: Tone.Unit.Time, channel: Channel = 0, velocity:number = 1) {

        // note = note.replace(/[0-9]/g, '')

        if(this.isPlaying == false) {
            Tone.start()
            Tone.Transport.start()
            this.isPlaying = true
        }

        note = Tone.Frequency(note).toNote()

        Synthesizer.activeNotes.add(note)

        for(let tr of this.tracks) {

            if(channel != tr.channel) continue

            this.triggerTrack(tr, note, time, velocity)
        }
    }
    
    /** Triggers and releases a note - Triggers all track's triggerAttackRelease function */
    triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, channel: Channel = 0, velocity:number = 1): void {

        if(this.isPlaying == false) {
            Tone.start()
            Tone.Transport.start()
            this.isPlaying = true
        }

        note = Tone.Frequency(note).toNote()

        Synthesizer.activeNotes.add(note)

        const n = note
        Tone.Transport.scheduleOnce((t) => {

            Synthesizer.activeNotes.delete(n)

            console.log('delete note', n)

        // }, time)
        }, Tone.Time(time).toSeconds() + Tone.Time(duration).toSeconds())

        for(let tr of this.tracks) {

            if(channel != tr.channel) continue

            this.triggerReleaseTrack(tr, note, duration, time, velocity)
        }

    }

    /** Releases note of all tracks */
    triggerRelease(note: Tone.Unit.Frequency, time: Tone.Unit.Time, channel: Channel = 0) {

        Tone.Frequency(note).toNote()
        
        Synthesizer.activeNotes.delete(note)
        
        for(let tr of this.tracks) {

            if(channel != tr.channel) continue

            this.releaseTrack(tr, note, time)
        }

    }

    /** Trigger note on one track specifically */
    triggerTrack(track: Track, note: Tone.Unit.Frequency, time: Tone.Unit.Time, velocity: number = 1) {

        track.triggerAttack(note, time, velocity)
    }

    /** Trigger and release note on one track specifically */
    triggerReleaseTrack(track: Track, note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity: number = 1) {

        track.triggerAttackRelease(note, duration, time, velocity)
    }
    
    /** Release note of one track specifically */
    releaseTrack(track: Track, note: Tone.Unit.Frequency, time: Tone.Unit.Time) {

        track.triggerRelease(note, time)
    }

    /** Will release all triggered notes that are stored in [activeNotes]. */
    releaseNotes() {

        for(let t of this.tracks) t.releaseNotes()
    }

    /** Will release all triggered notes of all tracks with the given channel. */
    releaseNotesByChannel(channel: Channel) {

        for(let t of this.tracks) {

            if(t.channel == channel) t.releaseNotes()
        }
    }

    /** Will stop all sequencers. */
    stopSequencers() {

        for(let s of this.sequencers) s.stop()

    }
    


    toggleArpMode(m) {

        this.arpMode = m == undefined ? !this.arpMode : m

        this.setArpChord([])

        // Tone.Transport.stop()

        // this.arp.stop(Tone.now())

        // console.log('ARP', this.arpMode)

    }

    setArpChord(chord: string[], onTrigger?: (...args) => void, onRelease?: (...args) => void) {

        // console.log('Set ARP', chord)

        const length = 60 / this.bpm

        this.stopArpeggiator(onRelease)

        if(!chord || chord.length == 0) return
        
        let lastNote
        this.arp = new Tone.Pattern((time, note) => {

            console.log('PATTERN NEXT NOTE', note)
            if(lastNote) {

                onRelease(note)
            }
            if(onTrigger) onTrigger(note, length)

            lastNote = note

        }, chord)

        Tone.Transport.bpm.setValueAtTime(this.bpm, Tone.now())
        this.arp.interval = length
        this.arp.start(Tone.now())

    }

    stopArpeggiator(onRelease) {

        if(this.arp) {
            this.arp.stop()
            this.arp.cancel()
            this.arp.dispose()
        }

        if(onRelease) onRelease()

    }





    /** Toggles the recording mode */
    toggleRecording(v?:boolean) {

        if(v != undefined) this.isRecording = !v

        if(!this.isRecording) this.startRecording()
        else this.stopRecording()
    }

    /** Will start recording  */
    startRecording() {

        this.isRecording = true

        console.log('START RECORDING')

        if(!this.recorder) this.recorder = new Tone.Recorder()

        Tone.Destination.connect(this.recorder)

        this.recorder.start()

        this.onRecordingStart.next()
    }

    /** Will stop recording and download the webm file  */
    stopRecording() {

        if(!this.recorder) return

        this.isRecording = false

        console.log('STOP RECORDING')

        window.setTimeout(async () => {

            const recording = await this.recorder.stop()

            this.onRecordingEnd.next()

            const url = URL.createObjectURL(recording);
            const anchor = document.createElement("a");
            anchor.download = "web-synth-recording.webm";
            anchor.href = url;
            anchor.click();

            Tone.Destination.disconnect(this.recorder)

        }, 0)
    }









    /** Resets the synthesizer to standard settings */
    reset() {

        this.setVolume(.5)
        this.setOctave(2)
        this.channel = 0

        this.mute(false)
        this.arpMode = false
        this.toggleRecording(false)

        // this.presetManager.reset()

        this.releaseNotes()
        this.stopSequencers()

        for(let t of this.tracks) t.destroy()
        this.tracks.length = 0

        for(let s of this.sequencers) s.destroy()
        this.sequencers.length = 0
    }

    /** Disconnects everything and removes all event listeners */
    dispose() {

        for(let track of this.tracks) track.destroy()
        delete this.tracks

        for(let key of Synthesizer.keys) key.dispose()
        // delete Synthesizer.keys

        for(let sequencer of this.sequencers) sequencer.destroy()
        delete this.sequencers

        this.volume.disconnect()
        this.volume.dispose()
        delete this.volume

        delete this.presetManager

        if(this.recorder) {
            
            this.recorder.disconnect()
            this.recorder.dispose()
        }
    }

    /** Get the current session as js object */
    getSessionObject() : ISession {

        let tracks: ITrackSerialization[] = []
        for(let t of this.tracks) tracks.push(t.serializeOut())

        let sequencers: ISequencerSerialization[] = []
        for(let s of this.sequencers) sequencers.push(s.serializeOut())

        return {
            bpm: this.bpm,
            volume: this.volume.volume.value,
            octave: this.octave,
            channel: this.channel,
            tracks: tracks,
            sequencers: sequencers,
        }
    }

    /** Loads a session */
    loadSessionObject(o: ISession) {

        if(o.volume) this.setVolume(o.volume)
        if(o.octave) this.setOctave(o.octave)
        if(o.bpm) this.bpm = o.bpm
        if(o.channel) this.channel = o.channel as Channel

        for(let i = this.tracks.length-1; i >= 0; i--) this.removeTrack(this.tracks[i])

        if(o.tracks && o.tracks.length > 0) {

            this.tracks.length = 0
            for(let t of o.tracks) {

                let track = new Track(this)
                track.serializeIn(t)
                this.addTrack(track)
            }
        }

        if(o.sequencers && o.sequencers.length > 0) {

            this.sequencers.length = 0
            for(let s of o.sequencers) {

                let sequencer = new Sequencer(this)
                sequencer.serializeIn(s)
                this.addSequencer(sequencer)

                sequencer.start()
            }
        }
    }

    serializeIn = (o: ISynthesizerSerialization) => {

        console.log('SerializeIn', o)
        
        if(o.presets && o.presets.length > 0) {
            
            this.presetManager.setPresets(o.presets)
        }

        const c = o.currentSession

        if(c) this.loadSessionObject(c)
    }

    serializeOut = () : ISynthesizerSerialization => {
        
        return {

            presets: this.presetManager.getPresets(),
            currentSession: this.getSessionObject()
        }
    }
}