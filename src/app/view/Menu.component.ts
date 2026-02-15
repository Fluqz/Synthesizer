


import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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

        <div class="btn" title="Menu On/Off" (click)="toggleMenu()" style="float:right;"></div>

        <div class="menu-nav">

            <div [class.active]="navigation == 'MANUAL'" (click)="selectManuals()">MANUAL</div>
            <div [class.active]="navigation == 'SETTINGS'" (click)="selectSettings()">SETTINGS</div>

        </div>


        <div *ngIf="navigation == 'SETTINGS'">
            
            <Settings></Settings>

        </div>

        <div *ngIf="navigation == 'MANUAL'">

            <Manual></Manual>

        </div>

    </div>

`,

    styles: `
    
    
    .menu-wrapper {

        position: relative;

        overflow: hidden;

        width: 100%;

        height: 0px;

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

    .menu-wrapper .menu-nav {

        position: absolute;
        left: 0px;
        top: 0px;

        width: 5%;
        height: 50px;
        line-height: 50px;

        text-align: center;
    }

    .menu-wrapper .menu-nav div {

        width: 100%;
        height: 100%;
    }

    .menu-wrapper .menu-nav div.active,
    .menu-wrapper .menu-nav div.active:active {

        background-color: var(--c-w);
        color: var(--c-b);
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

    constructor() {}

    selectManuals = () => {

        this.navigation = 'MANUAL'
    }

    selectSettings = () => {

        this.navigation = 'SETTINGS'
    }

    toggleMenu = () => {

        // active = !active

        console.log('TOGGLE FROM INSIDE MENU')

        this.onClose.next(null)
    }
}