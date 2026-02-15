import * as Tone from "tone"
import { Subject } from "rxjs"

/**
 * BeatMachine - Global transport and event coordination
 *
 * Manages a single Tone.getTransport() instance that all sequencers synchronize with.
 * Loops are created once on initialize() and reused, not disposed on stop.
 *
 * For timing accuracy:
 * - Use Tone.now() for scheduling
 * - Poll Tone.getTransport().position for visualization
 * - No artificial delays (no waiting for bar boundaries to start)
 */
export class BeatMachine {

    private static _isPlaying: boolean = false

    /** Tone.Loop - Fires every bar (4/4 beat) */
    private static loop: Tone.Loop

    /** Tone.Loop - Timeline loop running at ~67ms intervals (1 bar / 15)
     * Provides fine-grained updates for visualization and UI synchronization
     */
    private static timeLine: Tone.Loop

    /** Subject that emits on every bar boundary */
    private static beatObserver: Subject<number> = new Subject()

    /** Subject that emits on every timeline tick (~67ms) */
    private static timeLineObserver: Subject<number> = new Subject()

    static get isPlaying() { return this._isPlaying }

    /**
     * Initialize the BeatMachine once globally
     * Creates reusable loops (not disposed between play/stop)
     * Safe to call multiple times (idempotent)
     */
    static initialize() {
        // Only run once - loops are reused
        if(this.loop) return

        // Bar boundary loop (fires every 4/4 beat)
        this.loop = new Tone.Loop((time: number) => {
            this.beatObserver.next(time)
        }, '1b')

        // Timeline loop for UI updates and smooth animations (~67ms)
        let last = 0
        this.timeLine = new Tone.Loop((time: number) => {
            const delta = time - last
            this.timeLineObserver.next(time)
            last = time
        }, Tone.Time('1b').toSeconds() / 15)

        // Start both loops at position 0
        this.loop.start(0)
        this.timeLine.start(0)

        console.log('BeatMachine initialized')
    }

    /**
     * Start playback
     * Restart the transport and loops
     */
    static start() {
        // Ensure loops are created
        if(!this.loop) this.initialize()

        // Already playing
        if(this._isPlaying) return

        this._isPlaying = true

        // Check transport state
        const transportState = Tone.getTransport().state
        
        if(transportState === 'started') {
            // Already running
            return
        }

        // Restart the loops (they may have been stopped)
        this.loop.start(0)
        this.timeLine.start(0)

        // Start the transport from current position (don't pass Tone.now() - that causes delay)
        // Position should already be set to 0 by the caller
        Tone.getTransport().start()
    }

    /**
     * Stop playback
     * Reset transport position to 0
     * Stop loops and clean up
     */
    static stop() {
        if(!this._isPlaying) return

        this._isPlaying = false

        // Stop the transport (don't pass Tone.now())
        Tone.getTransport().stop()
        Tone.getTransport().cancel()   // removes all scheduled events
        Tone.getTransport().position = 0

        // Stop the loops
        if(this.loop) this.loop.stop(0)
        if(this.timeLine) this.timeLine.stop(0)

        console.log('BeatMachine stopped')
    }

    /**
     * Clean up (call on app destroy)
     */
    static dispose() {
        if(this.loop) this.loop.dispose()
        if(this.timeLine) this.timeLine.dispose()
    }

    /**
     * Subscribe to bar boundary events
     * @param fn - Callback that receives the beat time (Tone.js time)
     * @returns RxJS Subscription
     *
     * Usage:
     *   const sub = BeatMachine.subscribeToBeat((beatTime) => {
     *     // Handle beat
     *   })
     *   // Later: sub.unsubscribe()
     */
    static subscribeToBeat(fn: (time: number) => void) {
        return this.beatObserver.subscribe({
            next: fn,
            error: (err) => console.error('BeatMachine beat error:', err)
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