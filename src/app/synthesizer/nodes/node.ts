import { Subject, count } from 'rxjs'
import * as Tone from 'tone'
import type { ISerialization, ISerialize } from '../synthesizer'

export enum ParamType {

    KNOB = 'KNOB',
    DROPDOWN = 'DROPDOWN',
    SWITCH = 'SWITCH',
}

export type GroupID = number
export type NodeParameterGroup = Map<GroupID, NodeParameter[]>

export interface NodeParameter {

    /** Input type */
    type: ParamType
    /** Title */
    name: string
    /** Getter value */
    get: () => any
    /** Setter value */
    set: (v: any) => void
    /** Group ID */
    groupID?: GroupID
}

export interface KnobNodeParameter extends NodeParameter {

    /** Min value */
    min: number
    /** Max value */
    max: number
    /** Step size for increments (e.g., 0.01) */
    step?: number
    /** Number of decimal places to display */
    precision?: number
    /** Scale type: 'linear' or 'logarithmic' */
    scaleType?: 'linear' | 'logarithmic'
}

export interface DropDownNodeParameter extends NodeParameter {

    options: any
    fileUpload?: boolean
    fileUploadHandler?: (file: File) => void
}

export interface SwitchNodeParameter extends NodeParameter {

    enabled: boolean
}

export type NodeParameterType = KnobNodeParameter | SwitchNodeParameter | DropDownNodeParameter

export interface INodeSerialization extends ISerialization {

    name: string
    enabled: boolean
    collapsed: boolean
}

/** Represents a Node that can be connected to eachother */
export abstract class Node/* extends Tone.ToneAudioNode*/ implements ISerialize<INodeSerialization> {

    static count = 0

    id: number 

    /** Tag/Name of node */
    name: string

    /** Enabled flag */
    _enabled: boolean

    /** This nodes input node */
    input: Tone.ToneAudioNode

    /** This nodes output node */
    output: Tone.ToneAudioNode

    /** Node that is connected to the output */
    connectedInputs: Set<Tone.ToneAudioNode> = new Set()

    /** Node that is connected to the input */
    connectedOutputs: Set<Tone.ToneAudioNode> = new Set()

    /** If true, this nodes connectedInput's will be connected too the connectedOutput's. */
    directBypass: boolean = false

    /** OnDelete Observable */
    onDelete: Subject<Node>

    /** Array of settable properties */
    props: Map<string, NodeParameterType> 


    /** Visiblity flag for small/edit view */
    collapsed: boolean = false

    constructor(name) {
        // super()

        this.id = Node.count++

        this.name = name

        this._enabled = true

        this.props = new Map()

        this.onDelete = new Subject()
    }

    set enabled(e) { this._enabled = e }
    get enabled() { return this._enabled }

    /** Connects this Nodes Output to [e]'s Input */
    connect(n: Node | Tone.ToneAudioNode) {

        if(!n || !this.output) return

        const node = n instanceof Node ? n.input : n

        if(n instanceof Node) n.connectedInputs.add(this.output)
        this.connectedOutputs.add(node)

        this.output.connect(node)
    }

    /** Disconnects this Output from [e]'s/all Input(s) */
    disconnect(n?: Node | Tone.ToneAudioNode) {

        if(n) {

            const node = n instanceof Node ? n.input : n

            if(n instanceof Node) n.connectedInputs.delete(this.output)
            this.connectedOutputs.delete(node)

            this.output.disconnect(node)
        }
        else {
            
            this.output.disconnect()

            this.connectedOutputs.clear()
        }
    }

    /** Chains multiple nodes after each other starting with this */
    chain(nodes: Node[] | Tone.ToneAudioNode[]) {

        if(!nodes.length || nodes.length == 0) return
        // Prev
        let lastNode: Tone.ToneAudioNode = nodes[0] instanceof Node ? nodes[0].output : nodes[0]
        let ln: Node | Tone.ToneAudioNode = nodes[0]

        this.connect(ln)

        // this.connectedOutputs.add(lastNode)
        
        nodes.shift()

        // console.log('chain', this.output.name, 'to', lastNode.name)

        for(let n of nodes) {

            // if(lastNode === n) continue

            if(ln instanceof Node) {

                ln.connect(n)

                ln = n
            } 
            else {

                if(n instanceof Node) {
                    
                    // console.log('chain Node', lastNode.name, 'to', n.name)
                    
                    lastNode.connect(n.input)
                    
                    n.connectedInputs.add(lastNode)
                    
                    lastNode = n.output
                    ln = n
                }
                else {
                    
                    // console.log('chain ToneNode', lastNode.name, 'to', n.name)
                    
                    lastNode.connect(n)
                    
                    lastNode = n
                    ln = n
                }
            }
        }
    }

    /**  */
    destroy() {

        this.disconnect()

        // TODO unsubscribe not working?
        // if(this.onDelete) this.onDelete.unsubscribe()
    }

    serializeIn(o : INodeSerialization) {

        if(o.name) this.name = o.name
        if(o.enabled) this.enabled = o.enabled
        if(o.collapsed) this.collapsed = o.collapsed
    }

    serializeOut() : INodeSerialization {

        return {

            name: this.name,
            enabled: this.enabled,
            collapsed: this.collapsed
        }
    }
}