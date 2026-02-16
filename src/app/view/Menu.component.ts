


import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import type { MenuNavigation } from '../core/definitions';
import { SettingsComponent } from './Settings.component';
import { ManualComponent } from './Manual.component';
import { CommonModule } from '@angular/common';


@Component({

    selector: 'sy-menu',
    standalone: true,
    imports: [ CommonModule, SettingsComponent, ManualComponent ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    

    <div class="menu-wrapper" [class.active]="isActive">

        <div id="toggle-menu" class="btn" title="Menu On/Off" (click)="toggleMenu()" style="float:right;"></div>

        
        <div class="menu-nav">

            <div [class.active]="navigation == 'MANUAL'" (click)="selectManuals()">MANUAL</div>
            <div [class.active]="navigation == 'SETTINGS'" (click)="selectSettings()">SETTINGS</div>

        </div>

        <div class="menu-content"> 

            <sy-settings [active]="navigation == 'SETTINGS'"></sy-settings>
            <sy-manual [active]="navigation == 'MANUAL'"></sy-manual>

        </div>


    </div>

`,

    styles: `
    
    
    .menu-wrapper {

        position: relative;

        overflow: hidden;

        width: 100%;

        height: 0px;
        display: flex;
        justify-content: center;
        align-items: center;

        background-color: var(--c-y);

        -webkit-user-select: auto;
        -moz-user-select: auto;
        -ms-user-select: auto;
        user-select: auto;

        transition: height 1s cubic-bezier(0.215, 0.610, 0.355, 1);
    }

    .menu-wrapper.active {

        /* min-height: 100vh; */
        /* height: auto; */
        height: 100vh;
    }

    .menu-wrapper #toggle-menu {

        position: absolute;
        top: 0px;
        right: 0px;
    }

    .menu-wrapper .menu-nav {

        position: absolute;
        left: 0px;
        top: 0px;

        width: 10%;
        height: 100%;
        line-height: 50px;

        text-align: center;
    }

    .menu-wrapper .menu-nav div {

        width: 100%;
        height: 50px;

        cursor: pointer;
    }

    .menu-wrapper .menu-nav .menu-content {

        width: 90%;
        height: 100%;
    }        

    .menu-wrapper .menu-nav div.active,
    .menu-wrapper .menu-nav div.active:active {

        background-color: var(--c-w);
        color: var(--c-b);

        cursor: default;
    }

    .menu-wrapper .menu-nav div:hover {

        background-color: var(--c-w);
        color: var(--c-b);
    }

    .menu-wrapper .btn {

        position: relative;

        z-index: 10;
    }


    :global(canvas.active) {

        opacity: 0;
    }
    
    `
})
export class MenuComponent {

    @Input('isActive') isActive:boolean = false
    @Output('onClose') onClose:EventEmitter<null> = new EventEmitter()

    navigation: MenuNavigation = 'MANUAL'

    constructor(public cdr: ChangeDetectorRef) {}

    selectManuals = () => {

        this.navigation = 'MANUAL'

        this.cdr.detectChanges()
    }

    selectSettings = () => {

        this.navigation = 'SETTINGS'

        this.cdr.detectChanges()
    }

    toggleMenu = () => {

        console.log('TOGGLE FROM INSIDE MENU')

        this.cdr.detectChanges()

        this.onClose.next(null)
    }
}