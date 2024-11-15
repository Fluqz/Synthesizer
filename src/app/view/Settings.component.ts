import { Component, EventEmitter, Input, Output } from "@angular/core"



@Component({

    selector: 'sy-settings',
    standalone: true,
    template: `
        
    <div class="settings-wrapper" class:active={active}>

        <div class="h-1">Settings</div>

        Disable visuals

        Disable animations

        Disable changing colors

        Mute on leaving browser window

        Delete all presets

        Show keyboard

    </div>

    
    
    `,
    styles: `
    
    .settings-wrapper {

        position: absolute;
        top: 0px;
        left: calc(15% / 2);

        padding: 20px;

        overflow: hidden;

        width: 85%;
        height: 0px;

        font-size: 1.4rem;

        background-color: transparent;

        -webkit-user-select: auto;
        -moz-user-select: auto;
        -ms-user-select: auto;
        user-select: auto;

        transition: height 1s cubic-bezier(0.215, 0.610, 0.355, 1);
    }

    .settings-wrapper.active {

        /* min-height: 100vh; */
        /* height: auto; */
        min-height: 100vh;
        overflow-y: scroll;
    }

    .settings-wrapper .btn {

        position: relative;

        z-index: 10;
    }


    /** :global */
    :host canvas.active {

        opacity: 0;
    }

    .settings-wrapper .h-1,
    .settings-wrapper .h-2,
    .settings-wrapper .h-3,
    .settings-wrapper .h-4 {

        margin-top: 15px;
        margin-bottom: 5px;
    }


    .settings-wrapper .h-1 {

        font-size: 2rem;
        font-weight: 600;
    }

    .settings-wrapper .h-2 {
        
        font-size: 1.8rem;
        font-weight: 500;
    }

    .settings-wrapper .h-3 {
        
        font-size: 1.6rem;
        font-weight: 400;
    }

    .settings-wrapper .h-4 {
        
        font-size: 1.4rem;
        font-weight: 300;
    }

    .settings-wrapper .text-1 {
        
        font-size: 1rem;
    }
    
    `,
})
export class SettingsComponent {

    @Input('active') active:boolean = true
    @Output('onClose') onClose: EventEmitter<null> = new EventEmitter()

    toggleMenu() {

        // active = !active

        console.log('TOGGLE FROM INSIDE MENU')

        this.onClose.next(null)
    }
}