
import { Node, type INodeSerialization } from "../node"


export interface IEffectSerialization extends INodeSerialization{

    wet: number
}


/** Effect node */
export abstract class Effect extends Node {

    /** Bypass ratio. 1 = wet, 0 = dry. */
    protected _wet: number
    abstract get wet()
    abstract set wet(w) 

    protected storedWet: number

    constructor(name, wet) {

        super(name)

        this._wet = wet
        this.storedWet = this._wet
    }

    override set enabled(e) { 

        if(this._enabled == true && e == false) this.storedWet = this.wet
            
        this._enabled = e
            
        this.wet = e ? this.storedWet : 0
    }
    override get enabled() { return this._enabled }


    override serializeIn(o: IEffectSerialization) {

        super.serializeIn(o)

        if(o.name != undefined) this.name = o.name
        if(o.wet != undefined) this.wet = o.wet
        
        if(o.enabled != undefined) this.enabled = o.enabled
    }

    override serializeOut() : IEffectSerialization {

        let no = super.serializeOut()

        return {

            ...no,
            wet: this.enabled ? this.wet : this.storedWet,
        }
    }
 }