
import * as Tone from 'tone'
import type { Instrument, InstrumentOptions } from 'tone/Tone/instrument/Instrument'

import * as RxJs from 'rxjs'

import { Key } from './key'

import { G } from './core/globals'

import { Delay } from './nodes/effects/delay'
import { Tremolo } from './nodes/effects/tremolo'
import { Reverb } from './nodes/effects/reverb'
import { Chorus } from './nodes/effects/chorus'
import { Distortion } from './nodes/effects/distortion'
// import { Oscillator } from './nodes/source/oscillator'
import { Synth } from './nodes/source/synth'
import { Track } from './track'
import { DuoSynth } from './nodes/source/duo-synth'

/** Synthesizer */
export class Synthesizer {

    /** Array of keys on the synthesizer */
    static keyMap: string[] = [
        // Upper
        'q',
        '2',
        'w',
        '3',
        'e',
        'r',
        '5',
        't',
        '6',
        'z',
        '7',
        'u',
        'i',
        '9',
        'o',
        '0',
        'p',

        //lower
        '<',
        'a',
        'y',
        's',
        'x',
        'd',
        'c',
        'v',
        'g',
        'b',
        'h',
        'n',
        'm',
        'k',
        ',',
        'l',
        '.',
        'ö',
        '-',
    ]

    /** Array of all notes */
    static notes: string[] = [
        'C',
        'C#',
        'D',
        'D#',
        'E',
        'F',
        'F#',
        'G',
        'G#',
        'A',
        'A#',
        'B',
    ]

    /** 
     * This array is used to keep track which notes are currently triggered. 
     * There are some issues with polyphonic synths and releasing the note. 
     * In some occasions you can lose track and wont be able to release the note anymore.
     * The note will play for eternity.
     */
    static activeNotes: string[]

    static synths = {
        Synth: Tone.Synth,
        FMSynth: Tone.FMSynth,
        DuoSynth: Tone.DuoSynth,
        MembraneSynth: Tone.MembraneSynth,
    }

    static nodes = {
        effects: {

            delay: () => { return new Delay(1, .12, .8) },
            tremolo: () => { return new Tremolo(1, 5, 1) },
            distortion: () => { return new Distortion(1, .5) },
            chorus: () => { return new Chorus(1, 4, 20, 1) },
        },
        source: {

            // oscillator: () => { return new Oscillator() },
            synth: () => { return new Synth() },
            duosynth: () => { return new DuoSynth() },
        }
    }

    /** Array of created Key objects */
    static keys: Key[] = []
    
    /** Octave number */
    octave: number
    /** Master volume node */
    volume: number
    /** ToneJs Gain Node as Master Gain */
    gain: Tone.Gain
    /** Arpeggiator Tone.Pattern */
    arp: Tone.Pattern<string>
    /** Arpeggiator array */
    arpPattern: string[] = []
    /** Arpeggiator mode */
    arpMode: boolean = false
    /** Presets */
    presets: {}[]
    /** Beats per minute */
    bpm: number = 400
    
    tracks: Track[]


    /** ToneJs Recorder instance */
    recorder: Tone.Recorder
    /** Recording flag */
    isRecording: boolean


    // Events
    onKeyDownEvent
    onKeyUpEvent
    onRecordingStart
    onRecordingEnd
    onSavePreset
    onRemovePreset
    onAddNode
    onRemoveNode


    constructor() {

        // Synthesizer Volume
        this.volume = .7
        this.octave = 2
        
        this.gain = new Tone.Gain(this.volume)
        this.gain.toDestination()

        this.presets = []
        Synthesizer.activeNotes = []

        this.isRecording = false


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

                this.triggerNote(k.note, k.octave)
            })

            key.onRelease.subscribe(k => {

                this.releaseNote(k.note, k.octave)
            })

            i++
        }


        this.tracks = []
        this.addTrack(new Track(Synthesizer.nodes.source.duosynth()))



        // Events
        this.onRecordingStart = new RxJs.Subject()
        this.onRecordingEnd = new RxJs.Subject()

        this.onSavePreset = new RxJs.Subject()
        this.onRemovePreset = new RxJs.Subject()

        this.onAddNode = new RxJs.Subject()
        this.onRemoveNode = new RxJs.Subject()
    }



    /** Set Master Volume */
    setVolume(v) {

        this.volume = v
        this.gain.gain.setValueAtTime(this.volume, Tone.context.currentTime)
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

    /** Add a instrument to the synthesizer. */
    addTrack(track: Track, instrument?: Instrument<InstrumentOptions>) {

        this.stopAll()

        if(track == undefined) track = new Track(instrument)
        else if(instrument != undefined) track.instrument = instrument
        
        if(this.tracks.indexOf(track) == -1) this.tracks.push(track)

        track.connect(this.gain)
    }

    removeTrack(track: Track) {

        this.tracks.splice(this.tracks.indexOf(track), 1)

        track.disconnect(this.gain)

        track.destroy()
    }

    isRunning = false


    /** Trigger note */
    triggerNote(note, octave) {

        if(this.isRunning == false) {
            Tone.start()
            this.isRunning = true
        }

        Synthesizer.activeNotes.push(note + octave)

        console.log('Synthesizer.trigger', Synthesizer.activeNotes)

        if(this.arpMode) {

            this.setArpSequence(Synthesizer.activeNotes, (time, note) => {

                for(let tr of this.tracks) tr.triggerNote(note)

            }, () => {

                for(let tr of this.tracks) tr.releaseNote(note)

            })
        }
        else 
            for(let tr of this.tracks) tr.triggerNote(note + octave)
    }

    /** Release note */
    releaseNote(note:string, octave?:number) {

        Synthesizer.activeNotes.splice(Synthesizer.activeNotes.indexOf(note + octave), 1)

        if(this.arpMode) {
            
            this.setArpSequence(Synthesizer.activeNotes, (time, note, length) => {

                for(let tr of this.tracks) tr.triggerNote(note)

            }, () => {

                for(let tr of this.tracks) tr.releaseNote(note)

            })
        }
        else for(let tr of this.tracks) tr.releaseNote(note + octave)
    }

    /** Will release all triggered notes that are stored in [activeNotes] */
    stopAll() {

        for(let i = Synthesizer.activeNotes.length-1; i >= 0; i--) this.releaseNote(Synthesizer.activeNotes[i])
    }



    toggleArpMode(m) {

        this.arpMode = m == undefined ? !this.arpMode : m

        this.setArpSequence([])

        Tone.Transport.stop()

        console.log('ARP', this.arpMode)
    }

    setArpSequence(sequence: string[], onTrigger?: (...args) => void, onRelease?: (...args) => void) {

        console.log('Set ARP', sequence)

        const length = 60 / this.bpm

        this.stopArpeggiator(onRelease)

        if(!sequence || sequence.length == 0) return
        
        this.arp = new Tone.Pattern((time, note) => {

            if(onTrigger) onTrigger(time, note, length)

        }, sequence)

        this.arp.interval = length
        this.arp.start()
        Tone.Transport.bpm.setValueAtTime(this.bpm, Tone.context.currentTime)
        Tone.Transport.start()
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
    toggleRecording() {

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

        this.gain.gain.setValueAtTime(this.volume, Tone.context.currentTime)

        for(let n of Synthesizer.activeNotes) this.releaseNote(n)
        Synthesizer.activeNotes = []

        for(let t of this.tracks) 
            this.removeTrack(t)
    }

    /** Disconnects everything and removes all event listeners */
    dispose() {

        for(let key of Synthesizer.keys) {

            key.dispose()
        }
    }

    presetID = 0
    savePreset(name) {

        for(let p of this.presets) { if(p.name === name) return }

        const p = this.getSessionObject()
        p.id = this.presetID + 1,
        p.name = name
        this.presets.push(p)

        this.onSavePreset.next(this.presets[this.presets.length-1])
    }

    loadPreset(name) {

        let preset
        for(let p of this.presets) {

            if(p.name == name) { 
                preset = p
                break
            }
        }

        if(!preset) return

        this.serializeIn({
            currentSession: preset,
            presets: this.presets
        })
    }

    removePreset(name) {

        if(!name) return

        for(let i = 0; i < this.presets.length; i++) {

            if(name && this.presets[i].name == name) {
                this.onRemovePreset.next(this.presets[i])
                this.presets.splice(i, 1)
            }
        }
    }

    getSessionObject() {

        let tracks = []
        for(let t of this.tracks) tracks.push(t.serializeOut())

        return {
            volume: this.volume,
            octave: this.octave,
            tracks: tracks
        }
    }

    /** Load settings */
    serializeIn = o => {

        console.log('SerializeIn', o)

        this.reset()

        const c = o['currentSession']

        if(c['volume']) this.setVolume(c['volume'])
        if(c['octave']) this.setOctave(c['octave'])

        if(c['tracks'] && c['tracks'].length > 0) {

            for(let t of c['tracks']) {

                let track = new Track()
                track.serializeIn(t)
                this.addTrack(track)
            }
        }

        if(o['presets'] && o['presets'].length > 0) {

            this.presets = o['presets']
        }
    }

    /** Save settings */
    serializeOut = () => {
        
        return {
            presets: this.presets,
            currentSession: this.getSessionObject()
        }
    }
}