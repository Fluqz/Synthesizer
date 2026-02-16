import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core"
import { G } from "../globals"
import { Synthesizer } from "../synthesizer/synthesizer"
import { PresetManager } from "../core/preset-manager"



@Component({

    selector: 'sy-settings',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        
    <div class="settings-wrapper" [class.active]="active">

        <div class="h-1">Settings</div>

        <div class="option"> 
            <div class="h-4">Enable background color animations</div>
            <div class="btn text-1" (click)="toggleAnimationEnabled()">{{ animationEnabled ? 'ON' : 'OFF' }}</div>
        </div>

        <div class="option"> 
            <div class="h-4">Disable visuals</div>
            <div class="btn text-1" (click)="toggleVisualsEnabled()">{{ visualsEnabled ? 'ON' : 'OFF' }}</div>
        </div>

        <div class="option"> 
            <div class="h-4">Mute when leaving the browser window</div>
            <div class="btn text-1" (click)="toggleMuteOnLeavingWindow()">{{ muteOnLeavingWindow ? 'ON' : 'OFF' }}</div>
        </div>

        <div class="option"> 
            <div class="h-4">Delete all presets</div>
            <div class="btn text-1" (click)="deletePresets()">Delete</div>
        </div>

        <div class="option"> 
            <div class="h-4">Show keyboard</div>
            <div class="btn text-1" (click)="toggleShowKeyboard()">{{ showKeyboard ? 'ON' : 'OFF' }}</div>
        </div>

    </div>

    
    
    `,
    styles: `
    
    .settings-wrapper {

        position: absolute;
        top: 0px;
        left: 10%;

        padding: 20px;
        padding-right: 10%;

        width: 90%;
        height: 0px;

        font-size: 1.4rem;

        overflow: scroll;

        background-color: transparent;

        -webkit-user-select: auto;
        -moz-user-select: auto;
        -ms-user-select: auto;
        user-select: auto;
    }

    .settings-wrapper.active {

        height: 100vh;
    }

    .settings-wrapper .btn {

        padding: 0px 5px;
    }

    :global(canvas.active) {

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
        
        font-size: 1.1rem;
    }

    .settings-wrapper .text-1 span {

        font-size: 1.1rem;
        color: var(--c-y);
    }

    :host .option {

        display:flex;
        align-items: center;
        justify-content: space-between;
    }

    `,
})
export class SettingsComponent {

    @Input('active') active:boolean = true


    get animationEnabled() { return G.animationEnabled }

    toggleAnimationEnabled() {

        G.animationEnabled = !G.animationEnabled
    }


    get visualsEnabled() { return G.visualsEnabled }

    toggleVisualsEnabled() {

        G.visualsEnabled = !G.visualsEnabled
    }


    get muteOnLeavingWindow() { return G.muteOnLeavingWindow }

    toggleMuteOnLeavingWindow() {

        G.muteOnLeavingWindow = !G.muteOnLeavingWindow
    }


    deletePresets() {

    }


    get showKeyboard() { return G.showKeyboard }

    toggleShowKeyboard() {

        G.showKeyboard = !G.showKeyboard
    }
}