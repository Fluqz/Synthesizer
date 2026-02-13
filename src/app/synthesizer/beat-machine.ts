import * as Tone from "tone"
import { G } from "../globals"
import { Subject } from "rxjs"

/**
 * BeatMachine - Provides synchronized beat scheduling for sequencers
 * 
 * Fires events at bar boundaries (4/4 beats) to ensure all sequencers
 * can start at exact, sample-accurate times.
 * 
 * Uses Tone.Loop for reliable scheduling within the Web Audio context.
 */
export class BeatMachine {

    private static _isPlaying: boolean = false

    /** Tone.Loop() - Fires every bar along the Tone.getTransport class */
    private static loop: Tone.Loop
    
    /** Tone.Loop() - Timeline loop running at ~67ms intervals (1 bar / 15)
     * Provides fine-grained updates for visualization and UI synchronization
     */
    private static timeLine: Tone.Loop

    /** Subject that emits on every bar boundary */
    private static beatObserver: Subject<number> = new Subject()
    
    /** Subject that emits on every timeline tick (~67ms) */
    private static timeLineObserver: Subject<number> = new Subject()

    /** Time delta between timeline updates (for smooth animations) */
    private static currentDelta: number = 0

    static get isPlaying() { return this._isPlaying }

    /**
     * Start the beat machine.
     * Initializes the bar-boundary loop and timeline loop.
     * Safe to call multiple times (idempotent).
     */
    static start() {
        
        // Ensure Tone.js transport is running
        if(G.isPlaying == false) {
            G.start()
        }

        // Already started - don't double-initialize
        if(BeatMachine._isPlaying) return

        BeatMachine._isPlaying = true

        // Bar boundary loop (fires every 4/4 beat)
        this.loop = new Tone.Loop((time: number) => {

            this.beatObserver.next(time)

        }, '1b')

        // Timeline loop for UI updates and smooth animations (~67ms)
        let last = 0
        this.timeLine = new Tone.Loop((time: number) => {

            this.currentDelta = time - last

            this.timeLineObserver.next(time)

            last = time

        }, Tone.Time('1b').toSeconds() / 15)

        // Start both loops in the Tone.js transport
        this.loop.start(0)
        this.timeLine.start(0)
    }

    /**
     * Stop the beat machine and clean up resources.
     * Safe to call when already stopped.
     */
    static stop() {

        if(!BeatMachine._isPlaying) return

        // Stop both loops immediately
        this.loop.stop(0)
        this.timeLine.stop(0)

        // Clean up Web Audio resources
        this.loop.dispose()
        this.timeLine.dispose()

        BeatMachine._isPlaying = false
    }

    /**
     * Schedule a function to execute on the next bar boundary.
     * Ensures sequencers start at exact, sample-accurate times.
     * 
     * @param fn - Callback function that receives the beat time (Tone.js time)
     * 
     * Usage:
     *   BeatMachine.scheduleNextBeat((beatTime) => {
     *     sequencer.startAtTime(beatTime)
     *   })
     */
    static scheduleNextBeat(fn: (time: number) => void) {

        // Ensure beat machine is running
        if (!this._isPlaying) {
            this.start()
        }

        // Subscribe to the next beat event
        const subscription = this.beatObserver.subscribe({
            next: (time) => {
                // Fire the callback and immediately unsubscribe
                fn(time)
                subscription.unsubscribe()
            },
            error: (err) => {
                console.error('BeatMachine.scheduleNextBeat - Observable Error:', err)
                subscription.unsubscribe()
            }
        })
    }

    /**
     * Subscribe to timeline updates for UI synchronization.
     * Fires approximately every 67ms (1 bar / 15 divisions).
     * 
     * @param fn - Callback that receives the timeline time
     * @returns RxJS Subscription - Remember to unsubscribe when done
     * 
     * Usage:
     *   const sub = BeatMachine.subscribeTimeLine((time) => {
     *     updateVisualizer(time)
     *   })
     *   // Later: sub.unsubscribe()
     */
    static subscribeTimeLine(fn: (time: number) => void) {

        return this.timeLineObserver.subscribe({
            next: (t) => fn(t),
            error: (err) => console.error('BeatMachine.subscribeTimeLine error:', err)
        })
    }
}