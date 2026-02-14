

import { Storage } from '../core/storage'
import { G } from '../globals'

import { type Node, type NodeParameter, type NodeParameterGroup, type GroupID, Instrument, Effect, type DropDownNodeParameter, ParamType } from "../synthesizer/nodes";
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { DropdownComponent } from './Dropdown.component';
import { KnobComponent } from './Knob.component';
import { CommonModule } from '@angular/common';



@Component({

    selector: 'sy-node',
    standalone: true,
    imports: [ CommonModule, DropdownComponent, KnobComponent ],
    template: `
    


    <div class="node" [class.collapsed]="collapsed">
        
        <div *ngIf="!isInstrument && !collapsed && index > 1" class="shift-forward shift arrow-left" (click)="shiftForward()">&#8596;</div>

        <!-- { node.id } -->

        <div class="node-content">

            <div class="node-header">

                <div class="toggle-shrink-btn" (click)="toggleShrinking()"></div>
        

                    
                <div *ngIf="isEffect" class="enabled-btn" (click)="enable()" [class.enabled]="isEnabled"></div>
            
                <div *ngIf="!isInstrument" class="delete" (click)="onDelete()">&#x2715;</div>

                    
                <div class="node-title">{{ node.name[0].toUpperCase() + node.name.substr(1) }}</div>

            </div>

            @if(!collapsed) {

                <div class="parameters">

                    @for(group of groups; track group) {
                            
                        <div class="parameter">

                            @for (n of group; track n) {

                                <div *ngIf="n && n.get() != undefined">
                                    
                                    <div *ngIf="isKnob(n.type)">
                                        
                                        <sy-knob
                                            [name]="n.name.charAt(0).toUpperCase() + n.name.slice(1)"
                                            [min]="n.min"
                                            [max]="n.max"
                                            [value]="n.get()"
                                            [step]="n.step ?? 0.01"
                                            [precision]="n.precision ?? 2"
                                            [scaleType]="n.scaleType ?? 'linear'"
                                            (onChange)="onChange($event, n)"></sy-knob>

                                    </div>

                                    <div *ngIf="isDropdown(n.type)">
                                        
                                        <sy-dropdown
                                            [value]="n.get()"
                                            [options]="n.options"
                                            [fileUpload]="n.fileUpload"
                                            (onSelect)="onSelect($event, n)"
                                            (onFile)="onFile($event, n)"></sy-dropdown>

                                    </div>

                                </div>
                                
                            }

                        </div>

                        <!-- <LevelMeter output={node.output} /> -->
                        
                    }
                        
                </div>
            }

        </div>

    </div>




    `,

    styles: `
    


    /* Nodes */
    ::ng-deep .node {

        display: inline-flex;

        align-items: center;
        justify-content: center;

        position: relative;

        min-width: 100px;
        height: 100%;

        /* background-color: var(--c-g2); */
        color: var(--c-w);

        text-align: center;

        flex: none;
        flex-shrink: 0;

        padding: 0px 15px;

        margin: 0px .5px;
    }
    ::ng-deep .node:nth-child(1),
    ::ng-deep .node:nth-child(2) {

        margin: 0px;
        padding: 0px;
    }
    ::ng-deep .node:last-child {

        margin-right: 0px;
        padding-right: 0px;
    }


    .node .node-header {

        height: 15px;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    ::ng-deep .node .level-meter {

        margin: 0px 5px;
    }

    .parameters {

        height: 60px;

        display: flex;
        justify-content: center;
        align-items: center;
    }

    .node .parameter {

        display: flex;
        color: inherit;

        justify-content: center;
        align-items: center;
    }

    .node .node-title {

        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        text-align: center;
        font-size: .8rem;
        height: 15px;
        line-height: 15px;
    }
    .node.collapsed .node-title {

        top: calc(50% - (15px / 2));
    }

    .node .delete {

        display: flex;
        justify-content: center;
        align-items: center;

        position: absolute;
        right: 0px;
        top: 0px;
        cursor: pointer;

        width: 15px;
        height: 15px;

        z-index: 100;
    }
    .node .delete:hover {
        color: var(--c-b);
        background-color: var(--c-y);
    }

    .toggle-shrink-btn {

        display: block;

        width: 7px;
        height: 7px;

        position: absolute;
        top: 0px;
        left: 20px;

        border-radius: 100%;

        background-color: var(--c-w);
        margin: 4px;

        cursor: pointer;

        z-index: 100;
    }

    .enabled-btn {

        display: block;

        width: 7px;
        height: 7px;

        position: absolute;
        left: 35px;
        top: 0px;

        cursor: pointer;
        
        border-radius: 100%;

        z-index: 100;

        background-color: var(--c-o);
        margin: 4px;
    }
    .enabled-btn.enabled {

        background-color: var(--c-bl);
    }


    .node .shift {

        display: flex;
        justify-content: center;
        align-items: center;

        position:absolute;
        top:0px;
        height: 100%;
        width: 15px;

        text-align: center;
        cursor: pointer;

        color: var(--c-b);
        background-color: var(--c-w);

        font-size: 1.2rem;

        z-index: 10;
    }

    .node .shift:hover {

        background-color: var(--c-y);
    }

    .node .shift.arrow-left {

        transform: rotate(180deg);
    }

    .node .shift-forward {
        left: 0px;
    }
    .node .shift-back {

        right:0px;
    }


    
    `,

})
export class NodeComponent implements OnDestroy {


    private _node: Node
    @Input('node') 
    set node(node: Node) {

        this._node = node

        this.isInstrument= node instanceof Instrument ? true : false
        this.isEffect= node instanceof Effect ? true : false

        this.nodeParameters = [ ...this._node.props.values() ]
        this.groups = Array.from(this.groupNodeParameter(this.nodeParameters).values())
    }
    get node() : Node { return this._node }

    @Input('collapsed') collapsed: boolean = false

    @Input('index') index: number

    @Output('onShiftForward') onShiftForward: EventEmitter<Node> = new EventEmitter()
    @Output('onShiftBackward') onShiftBackward: EventEmitter<Node> = new EventEmitter()
    @Output('onDeleteNode') onDeleteNode: EventEmitter<Node> = new EventEmitter()
    
    private nodeParameters: any[]
    public groups: NodeParameter[][]

    private throttleChange

    isInstrument: boolean
    isEffect: boolean

    isEnabled: boolean = true
    wet: number

    constructor() {
    }


    /** Groupes nodeParamter by sorting them*/
    groupNodeParameter(_nodeParameters: NodeParameter[]) : NodeParameterGroup {

        const groups: NodeParameterGroup = new Map()

        let param: NodeParameter

        for(let i = 0; i < _nodeParameters.length; i++) {

            param = _nodeParameters[i]

            const groupID: GroupID = param.groupID

            let groupParams: NodeParameter[] = groups.get(groupID)

            if(groupParams == null) groupParams = []

            groupParams.push(param)

            groups.set(groupID, groupParams)
        }

        return groups
    }

    isDropdown(type: ParamType) { return ParamType.DROPDOWN == type }
    isKnob(type: ParamType) { return ParamType.KNOB == type }
    isSwitch(type: ParamType) { return ParamType.SWITCH == type }

    // Knobs
    onChange(e, nodeParam: NodeParameter) { 

        nodeParam.set(e.detail)

        window.clearTimeout(this.throttleChange)
        this.throttleChange = window.setTimeout(() => {

            this.saveUndo()

        }, 250)
    }

    onSelect(e, nodeParam: NodeParameter) {
        
        nodeParam.set(e.detail.target.value)
        
        this.saveUndo()
    }

    onFile(e, nodeParam: DropDownNodeParameter) {
        
        if(nodeParam.fileUploadHandler) nodeParam.fileUploadHandler(e.detail)
        
        this.saveUndo()
    }

    // console.log('node props', node.name, groups)

    shiftForward() {

        this.onShiftForward.next(this.node)

        this.groups = Array.from(this.groupNodeParameter(this.nodeParameters).values())

        this.saveUndo()
    }

    shiftBack() {

        this.onShiftBackward.next(this.node)

        this.groups = Array.from(this.groupNodeParameter(this.nodeParameters).values())

        this.saveUndo()
    }

    toggleShrinking() {

        this.saveUndo()

        this.node.collapsed = !this.node.collapsed

        this.collapsed = this.node.collapsed
    }

    onDelete() {

        this.onDeleteNode.next(this.node)
    }

    enable() {

        if(!this.isInstrument) return

        this.saveUndo()

        const e = (this.node as Effect)

        if(this.isEnabled) this.wet = e.wet

        this.isEnabled = !this.isEnabled

        e.wet = this.isEnabled ? this.wet : 0
    }

    saveUndo() {

        Storage.saveUndo(JSON.stringify(G.synthesizer.serializeOut()))
    }

    ngOnDestroy() {

    }
}