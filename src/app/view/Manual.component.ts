



import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';


@Component({

    selector: 'sy-manual',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `

    <div class="manual-wrapper" class:active={active}>

        <div class="h-1">Manual</div>

            <div class="text-1">

                This tool is sort of a synthesizer builder playable by keys or sequencers.

                Add multiple sound sources and combine them by playing them all at the same time.
                Group them by assigning a different channel to trigger them from multiple different input sources.

            </div>
            
            <div class="text-1">All running with ToneJS.</div>

            <div class="h-3">Interface</div>

            <div class="h-3">Tracks</div>

            <div class="text-1">Create <span>tracks</span> by clicking on the first <span>+</span> Button on the main menu bar.</div>
            
            <div class="h-4">Track Source Dropdown</div>

            <div class="text-1">Select the <span>track</span>'s sound source by selecting an item from the dropdown menu. 
            That can be different oscillators, mono synth's, poly synth's, a sampler or noise.</div>

            <div class="h-4">Volume</div>

            <div class="text-1">Use the Knob to assign a different volume value. Ranging from -70 to 6 dB.</div>


            <div class="h-4">UV Meter</div>

            <div class="text-1">The UV Meter displays the track's volume.</div>


            <div class="h-4">Oscilloscope</div>

            <div class="text-1">The Oscilloscope displays the track's frequency wave.</div>


            <div class="h-4">Channel Button</div>

            <div class="text-1">The channel button can be clicked to increase the channel's value or SHIFT + clicked to decrease the value.</div>


            <div class="h-4">Mute Button</div>

            <div class="text-1">The mute button can be clicked to silence the track.</div>


            <div class="h-4">Solo Button</div>

            <div class="text-1">The solo button can be clicked to silence all other tracks but this one.</div>


            <div class="h-4">Hold Button</div>

            <div class="text-1">The hold mode has 3 modi OFF, PLAY, HOLD.

                When PLAY, every note that is now played, will be played endlessly until the mode is turned back to OFF.
                When HOLD, all notes that are playing from activating them in the PLAY mode, will continue playing, but no other notes can be activated anymore.
                When OFF, deactivates all actively playing notes. Has no other effect.

            </div>

            <div class="h-4">Duplicate Button</div>

            <div class="text-1">Duplicates this track with all options.</div>

            <div class="h-4">X Button</div>

            <div class="text-1">Deletes this track entirely.</div>






                <div class="h-4">Plus</div>
                <div class="text-1">The Menu bar lets you create Tracks and Sequencers.</div>

                <div class="h-4">Tracks</div>
                <div class="text-1">All tracks have a source instrument. This can be a several Oscillator, Prebuild Synthesizers, a Sampler or Noise.</div>

                <div class="h-4">Sequencer</div>
                <div class="text-1">Sequencers will let you play notes or samples automatically. </div>
                <div class="text-1">You can build chains of notes to make a melody or a drum beat.</div>


                <div class="h-4">Synth</div>
                <div class="h-4">Hold mode</div>
                <div class="h-4">Sequencer</div>
                <div class="h-4">Channel</div>
                <div class="h-4">Midi Info</div>
            <div class="h-4">Keybindings (Show in Introduction?)</div>
        <div class="h-4">Settings</div>
        <div class="h-4">Credits</div>
        <div class="h-4">Links</div>

        <div class="h-4">Epilepsy</div>

        <div class="h-4">Welcome</div>

        <div class="text-1">Works & looks best in firefox</div>

        <div class="text-1">Warning to everyone with Epilepsy. Please disable the visuals in the top left corner!</div>


        <div class="text-1">Left Arrow - Octave Down</div>
        <div class="text-1">Right Arrow - Octave Up</div>
        <div class="text-1">Space bar - Play / Stop</div>

        <div class="text-1">SHIFT + Space bar - Record / Stop recording</div>

        <div class="text-1">Hallodri</div>
        <div class="text-1">https://soundcloud.com/fluqz</div>
        <div class="text-1">https://www.instagram.com/hallodri.art/</div>


    </div>
    
    `,

    styles: `
    
    
    .manual-wrapper {

        position: absolute;
        top: 0px;
        left: calc(15% / 2);

        padding: 20px;

        width: 85%;
        height: 0px;

        font-size: 1.4rem;

        overflow: hidden;

        background-color: transparent;

        -webkit-user-select: auto;
        -moz-user-select: auto;
        -ms-user-select: auto;
        user-select: auto;

        transition: height 1s cubic-bezier(0.215, 0.610, 0.355, 1);
    }

    .manual-wrapper.active {

        /* min-height: 100vh; */
        /* height: auto; */
        min-height: 100vh;
        overflow-y: scroll;
    }

    .manual-wrapper .btn {

        position: relative;

        z-index: 10;
    }


    :global(canvas.active) {

        opacity: 0;
    }


    .manual-wrapper .h-1,
    .manual-wrapper .h-2,
    .manual-wrapper .h-3,
    .manual-wrapper .h-4 {

        margin-top: 15px;
        margin-bottom: 5px;
    }


    .manual-wrapper .h-1 {

        font-size: 2rem;
        font-weight: 600;
    }

    .manual-wrapper .h-2 {
        
        font-size: 1.8rem;
        font-weight: 500;
    }

    .manual-wrapper .h-3 {
        
        font-size: 1.6rem;
        font-weight: 400;
    }

    .manual-wrapper .h-4 {
        
        font-size: 1.4rem;
        font-weight: 300;
    }

    .manual-wrapper .text-1 {
        
        font-size: 1.1rem;
    }

    .manual-wrapper .text-1 span {

        font-size: 1.1rem;
        color: var(--c-y);
    }


    `,
})

export class ManualComponent {


    @Input('avtive') active:boolean = true

    @Output('onClose') onClose: EventEmitter<null> = new EventEmitter()

    toggleMenu = () => {

        // active = !active

        console.log('TOGGLE FROM INSIDE MENU')

        this.onClose.next(null)
    }

    constructor() {

    }


}