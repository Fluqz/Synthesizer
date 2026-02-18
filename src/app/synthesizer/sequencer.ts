
import * as Tone from 'tone'
import { Synthesizer, type Channel, type ISerialize, type IComponent, type ISerialization } from './synthesizer'
import { BeatMachine } from './beat-machine'

export type NoteLength = '1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32' | '1/64'

export type REST = ''

export type SequenceObject = { 
    id: number,
    note: Tone.Unit.Frequency | REST,
    time: Tone.Unit.Time,
    length: Tone.Unit.Time,
    velocity?: number
}

export interface ISequencerSerialization extends ISerialization {

    index: number
    channel: Channel[]
    sequence: SequenceObject[]
    humanize: boolean
    bars: number
    noteLength: NoteLength
}

export class Sequencer implements ISerialize<ISequencerSerialization>, IComponent {

    /** Sequencer count */
    static count: number = 0

    /** Starting time of the first sequencer */
    static startTime: number
    
    /** Flag to indicate if this is a bulk start (all sequencers at once) vs adding one sequencer to playing ones */
    static bulkStarting: boolean = false

    /** Starting time of this sequencer */
    public startTime: number

    /** Sequencer count */
    private count: number = 0

    index: number
    name: 'track' | 'sequencer' = 'sequencer'

    /** Sequencer UID */
    id: number

    synthesizer: Synthesizer

    sequence: SequenceObject[]

    _bars: number

    toneSequence: Tone.Part
    
    /** Temporary loop used to delay a subsequent sequencer start until the next bar */
    private delayedStartLoop: Tone.Loop

    channels: Channel[]

    noteLength: NoteLength

    isPlaying: boolean

    loop: boolean

    humanize: boolean = false

    constructor(synthesizer: Synthesizer, sequence?: SequenceObject[], channels?: Channel[]) {

        this.synthesizer = synthesizer
        this.sequence = sequence == undefined ? [] : sequence

        this.id = Sequencer.count++

        this.bars = this.sequence.length == 0 ? 4 : this.sequence.length

        this.channels = channels == undefined ? [0] : channels

        this.isPlaying = false
        this.loop = true

        this.noteLength = '1/4'
        this.bars = 2
    }


    get bars() { return this._bars }
    set bars(v: number) { 

        this._bars = v

        if(this.toneSequence) {

            this.toneSequence.loopEnd = this._bars
        }
    }

    /** Add a channel to send through */
    activateChannel(channel: Channel) {

        if(this.channels.indexOf(channel) != -1) return

        this.channels.push(channel)
    }
    /** Remove a channel */
    deactivateChannel(channel: Channel) {

        if(this.channels.indexOf(channel) == -1) return false

        this.channels.splice(this.channels.indexOf(channel), 1)

        for(let tr of this.synthesizer.tracks) {

            if(tr.channel == channel) tr.releaseNotes()
        }

        return true
    }

    getUnusedChannels = (() => {

        const channels: Channel[] = []

        return () => {

            channels.length = 0

            for(let i = 0; i < Synthesizer.maxChannelCount; i++) {
                
                if(this.channels.indexOf(i as Channel) == -1) channels.push(i as Channel) 
            }
            
            return channels
        }
    })()

    /** Add a note to the sequence */
    addNote(note: Tone.Unit.Frequency, time: Tone.Unit.Time, length: Tone.Unit.Time, velocity: number) {

        if(!Tone.isNote(note)) return

        const n = { id: this.count++, note, time, length, velocity }

        this.sequence.push(n)
        
        if(this.toneSequence) this.toneSequence.add(n)
    }

    updateNote(id:number, note: Tone.Unit.Frequency, time: Tone.Unit.Time, length: Tone.Unit.Time, velocity: number) {

        if(!Tone.isNote(note)) return

        for(let s of this.sequence) {
            
            if(s.id == id) {

                let i = this.sequence.indexOf(s)

                // Trigger Release for this note
                for(let c of this.channels) this.synthesizer.triggerRelease(Tone.Frequency(this.sequence[i].note).toNote(), Tone.getContext().currentTime, c)

                if(this.toneSequence) this.toneSequence.remove(this.sequence[i].time)

                // Update note
                this.sequence[i].note = note
                this.sequence[i].time = time
                this.sequence[i].length = length
                this.sequence[i].velocity = velocity

                if(this.toneSequence) this.toneSequence.at(this.sequence[i].time, this.sequence[i])

                return this.sequence[i]
            }
        }

        return null
    }

    /** Remove a note from the sequence */
    removeNote(id:number) {

        for(let s of this.sequence) {
            
            if(s.id == id) {

                let i = this.sequence.indexOf(s)

                // Trigger Release for this note
                for(let c of this.channels) this.synthesizer.triggerRelease(Tone.Frequency(this.sequence[i].note).toNote(), Tone.getContext().currentTime, c)

                // Remove from tone sequencer
                if(this.toneSequence) this.toneSequence.remove(this.sequence[i].time)
                
                // Remove note
                this.sequence.splice(i, 1)

                return true
            }
        }

        return false
    }

    /** Add a bar to the sequencer */
    addBar() {

        this.bars++

        if(this.toneSequence) this.toneSequence.loopEnd = this.bars
    }

    /** Remove a bar from the sequencer */
    removeBar() {

        this.bars--

        if(this.bars <= 0) this.bars = 1

        if(this.toneSequence) this.toneSequence.loopEnd = this.bars
    }

    /**
     * Start this sequencer independently.
     * Playback will begin at the next bar boundary (4/4 beat) for timing accuracy.
     */
    start() {

        BeatMachine.start()

        if(this.toneSequence) {

            this.toneSequence.cancel(Tone.getContext().currentTime)
            this.toneSequence.stop(Tone.getContext().currentTime)
            this.toneSequence.clear()
            this.toneSequence.dispose()
        }

        this.startSequence(this.sequence)
    }

    /**
     * Start this sequencer at a specific Tone.js beat time.
     * Used for synchronized multi-sequencer playback where all sequencers start together.
     * @param beatTime - The Tone.js transport time when playback should begin
     */
    startAtTime(beatTime: number) {

        if(this.toneSequence) {

            this.toneSequence.cancel(Tone.getContext().currentTime)
            this.toneSequence.stop(Tone.getContext().currentTime)
            this.toneSequence.clear()
            this.toneSequence.dispose()
        }

        this.toneSequence = this.createToneSequence()

        this.toneSequence.start(beatTime, 0)

        if(Sequencer.startTime == undefined) Sequencer.startTime = beatTime
        
        this.startTime = beatTime

        this.isPlaying = true

        console.log('Sequencer', this.id, 'started at beat time:', beatTime)
    }

    private lastNote: Tone.Unit.Frequency
    
    /** Create and configure the Tone.Part for this sequence */
    private createToneSequence(): Tone.Part {

        const toneSequence = new Tone.Part((time, value) => {

            for(let channel of this.channels) {

                this.synthesizer.triggerAttackRelease(Tone.Frequency(value.note).toNote(), value.length, time, channel, value.velocity)
            }
            
        }, this.sequence)

        toneSequence.loop = this.loop
        toneSequence.loopEnd = this.bars
        toneSequence.humanize = this.humanize
        toneSequence.probability = 1

        return toneSequence
    }

    /** Internal: Start sequence immediately (no delay) */
    private startSequence(sequence: SequenceObject[]) {

        if(this.toneSequence) {
            
            this.toneSequence.cancel(Tone.getContext().currentTime)
            this.toneSequence.clear()
            this.toneSequence.stop(Tone.getContext().currentTime)
            this.toneSequence.dispose()
        }

        // Clean up any previous delayed start loop
        if(this.delayedStartLoop) {
            this.delayedStartLoop.dispose()
            this.delayedStartLoop = null
        }

        this.toneSequence = this.createToneSequence()

        // Get current transport position in seconds
        const transportPos = Tone.getTransport().position
        const transportSeconds = typeof transportPos === 'number' ? transportPos : Tone.Time(transportPos).toSeconds()
        
        // Bar duration in seconds
        const barDurationSeconds = Tone.Time('1b').toSeconds()
        
        // Determine start position
        const isFirstSequencer = Sequencer.startTime == undefined
        const isBulkStart = Sequencer.bulkStarting
        
        if(isFirstSequencer) {
            // First sequencer: snap to nearest bar boundary and start immediately
            const snappedPos = Math.round(transportSeconds / barDurationSeconds) * barDurationSeconds
            this.toneSequence.start(snappedPos, 0)
            
            Sequencer.startTime = snappedPos
            this.startTime = snappedPos
        } else if(isBulkStart) {
            // Bulk start: all sequencers start together at the same position
            // Don't use delayed start logic when starting multiple at once
            this.toneSequence.start(Sequencer.startTime, 0)
            this.startTime = Sequencer.startTime
        } else {
            // Subsequent sequencer added while others playing: delay until next bar
            const nextBarPos = Math.ceil(transportSeconds / barDurationSeconds) * barDurationSeconds
            
            // Start the sequence at the SAME position as the first sequencer
            // This ensures notes play at the same times globally
            this.startTime = Sequencer.startTime
            
            // Use a one-shot loop to trigger the start at the next bar boundary
            this.delayedStartLoop = new Tone.Loop((time) => {
                // Start the toneSequence at the first sequencer's start position
                // The transport will have caught up to handle the scheduling correctly
                this.toneSequence.start(Sequencer.startTime, 0)
                
                // Dispose the loop after it fires once
                if(this.delayedStartLoop) {
                    this.delayedStartLoop.dispose()
                    this.delayedStartLoop = null
                }
            }, barDurationSeconds)
            
            // Start this loop at the next bar
            this.delayedStartLoop.start(nextBarPos)
        }
        
        this.isPlaying = true
        return this.toneSequence
    }

    stop() {

        // ARE ACTIVENOTES REMOVED ??? Visuals continue playing

        if(this.toneSequence) {
            
            this.toneSequence.cancel(Tone.getContext().currentTime)
            this.toneSequence.clear()
            this.toneSequence.stop(Tone.getContext().currentTime)
            this.toneSequence.dispose()
        }

        // Clean up delayed start loop if it exists
        if(this.delayedStartLoop) {
            this.delayedStartLoop.dispose()
            this.delayedStartLoop = null
        }

        for(let channel of this.channels) this.synthesizer.triggerRelease(this.lastNote, Tone.getContext().currentTime, channel)
        
        for(let ch of this.channels) {
            
            for(let tr of this.synthesizer.tracks) {

                if(ch == tr.channel) tr.releaseNotes()
            }
        }

        this.isPlaying = false

        // If no more sequencers are playing, reset transport and stop it
        if(this.synthesizer.getActiveSequencers().length == 0) {
            Sequencer.startTime = null
            Tone.getTransport().stop()
            Tone.getTransport().position = 0
            BeatMachine.stop()
        }
    }

    destroy() {

        this.stop()

        if(this.toneSequence) this.toneSequence.dispose()
    }

    serializeOut(): ISequencerSerialization {

        return {

            index: this.index,
            channel: this.channels,
            sequence: this.sequence,
            humanize: this.humanize,
            bars: this.bars,
            noteLength: this.noteLength
        }
    }

    serializeIn(o: ISequencerSerialization) {

        this.destroy()

        if(o.index) this.index = o.index
        if(o.noteLength) this.noteLength = o.noteLength
        if(o.channel && o.channel.length) this.channels = o.channel
        this.sequence.length = 0
        if(o.sequence && o.sequence.length) {

            for(let s of o.sequence) this.addNote(s.note, s.time, s.length, s.velocity)
        }
        if(o.humanize) this.humanize = o.humanize
        if(o.bars) this.bars = o.bars
    }
}