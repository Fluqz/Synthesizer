
import * as Tone from 'tone'
import { Synthesizer, type Channel, type ISerialize, type IComponent, type ISerialization } from './synthesizer'


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
}

export class Sequencer implements ISerialize, IComponent {

    /** Sequencer count */
    static count: number = 0

    /** Starting time of the first sequencer */
    static startTime: number

    private count: number = 0

    index: number
    name: 'track' | 'sequencer' = 'sequencer'

    /** Sequencer UID */
    id: number

    synthesizer: Synthesizer


    sequence: SequenceObject[]

    _bars: number

    toneSequence: Tone.Part

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
        this.bars = 1
    }


    get bars() { return this._bars }
    set bars(v: number) { 

        this._bars = v

        if(this.toneSequence) {

            this.toneSequence.loopEnd = this._bars
        }
    }

    /** Add a channel to send through */
    addChannel(channel: Channel) {

        if(this.channels.indexOf(channel) != -1) return

        this.channels.push(channel)
    }
    /** Remove a channel */
    removeChannel(channel: Channel) {

        if(this.channels.indexOf(channel) == -1) return false

        this.channels.splice(this.channels.indexOf(channel), 1)

        for(let tr of this.synthesizer.tracks) {

            if(tr.channel == channel) tr.releaseNotes()
        }

        return true
    }

    getUnusedChannels() {

        const channels: Channel[] = []

        for(let i = 0; i < Synthesizer.maxChannelCount; i++) {

            if(this.channels.indexOf(i as Channel) == -1) channels.push(i as Channel) 
        }

        return channels
    }

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
                for(let c of this.channels) this.synthesizer.triggerRelease(Tone.Frequency(this.sequence[i].note).toNote(), Tone.now(), c)

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
                for(let c of this.channels) this.synthesizer.triggerRelease(Tone.Frequency(this.sequence[i].note).toNote(), Tone.now(), c)

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

    start() {

        if(this.toneSequence) {

            this.toneSequence.cancel(Tone.now())
            this.toneSequence.stop(Tone.now())
            this.toneSequence.clear()
            this.toneSequence.dispose()

        }

        this.startSequence(this.sequence)
    }

    private lastNote: Tone.Unit.Frequency
    private startSequence(sequence: SequenceObject[]) {

        if(this.toneSequence) {
            
            this.toneSequence.cancel(Tone.now())
            this.toneSequence.clear()
            this.toneSequence.stop(Tone.now())
            this.toneSequence.dispose()
        }

        const now = Tone.now()

        this.toneSequence = new Tone.Part((time, value) => {

            // console.log('t', time.toFixed(5), Tone.now().toFixed(5), this.toneSequence.progress.toFixed(5), this.toneSequence.toSeconds().toFixed(5))

            console.log('time', this.id, time, Sequencer.startTime)

            for(let channel of this.channels) {

                this.synthesizer.triggerAttackRelease(Tone.Frequency(value.note).toNote(), value.length, time, channel, value.velocity)

                // console.log('SEQUENCER at Channel', channel, Tone.Frequency(value.note).toNote(), time, value, sequence)
            }
            
        }, sequence)


        // Tone.Transport.scheduleRepeat((time) => {

        //     console.log('progress', 
            
        //     ((Tone.now() - Tone.Time(Sequencer.startTime).toSeconds()) % Tone.Time('1m').toSeconds()).toFixed(2))
            
        // }, .01)


        this.toneSequence.loop = this.loop

        this.toneSequence.loopEnd = this.bars

        this.toneSequence.humanize = this.humanize
        this.toneSequence.probability = 1

        let startTime

        if(Sequencer.startTime == null) {
            
            Sequencer.startTime = now
            startTime = Sequencer.startTime

            console.log('Starting first', Sequencer.startTime)
        }
        else {
            
            const duration = (now - Tone.Time(Sequencer.startTime).toSeconds())
            let time = Sequencer.startTime
            while(duration > time) {
                
                time += Tone.Time('1m').toSeconds()
            }

            console.log('TIME', time, now)

            startTime = time
            console.log('now, startOffset, count, nextOffset, start', now, now - Tone.Time(Sequencer.startTime).toSeconds(), (now - Tone.Time(Sequencer.startTime).toSeconds()) / Tone.Time('1m').toSeconds() ,(now - Tone.Time(Sequencer.startTime).toSeconds()) % Tone.Time('1m').toSeconds(), startTime)
            console.log('length, ', Tone.Time('1m').toSeconds(), )
        }

        this.toneSequence.start(startTime, 0)

        this.isPlaying = true

        return this.toneSequence
    }

    stop() {

        if(this.toneSequence) {
            
            this.toneSequence.cancel(Tone.now())
            this.toneSequence.clear()
            this.toneSequence.stop(Tone.now())
            this.toneSequence.dispose()
        }

        for(let channel of this.channels) this.synthesizer.triggerRelease(this.lastNote, Tone.now(), channel)
        
        for(let ch of this.channels) {
            
            for(let tr of this.synthesizer.tracks) {

                if(ch == tr.channel) tr.releaseNotes()
            }
        }

        this.isPlaying = false

        if(this.synthesizer.getActiveSequencers().length == 0) Sequencer.startTime = null

        console.log('stop', Sequencer.startTime, this.synthesizer.getActiveSequencers().length)
    }

    destroy() {

        this.stop()

        if(this.toneSequence) this.toneSequence.dispose()

        delete this.channels
        delete this.sequence
    }

    serializeOut(): ISequencerSerialization {

        return {

            index: this.index,
            channel: this.channels,
            sequence: this.sequence,
            humanize: this.humanize,
            bars: this.bars
        }
    }
    serializeIn(o: ISequencerSerialization) {

        if(o.index) this.index = o.index
        if(o.channel && o.channel.length) this.channels = o.channel
        this.sequence.length = 0
        if(o.sequence && o.sequence.length) {

            for(let s of o.sequence) this.addNote(s.note, s.time, s.length, s.velocity)
        }
        if(o.humanize) this.humanize = o.humanize
        if(o.bars) this.bars = o.bars
    }
}