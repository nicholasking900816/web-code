import { Block } from "javascript-ast-parser/src/Block";
import { BoundaryNode } from "./boundary-node";
import { v4 as uuidv4 } from 'uuid';

export class CodeRenderNode {
    public unuse = false;
    public notDecalredErr = false;
    public editting = false;
    public pointerIndex: number = null;
    public boundary: BoundaryNode;
    public lineEnd = false;
    public identifier = false;
    public checkScope = false;
    public isHead = false;
    public nextIdentifier: CodeRenderNode;
    public prevIdentifier: CodeRenderNode;
    public block: Block;
    public declaration = false;
    public prevNode: CodeRenderNode;
    public nextNode: CodeRenderNode;
    public scope: Function;
    public id: string;
    public duplicate: CodeRenderNode;
    public displayText: any;
    public selected = false;
    public searchResult: any = [];
    
    constructor(
        public text?: string, 
        public style?: any, 
        public err = false, 
        public warn = false, 
        public msg?: string,
        public row?: number,
        public col?: number,

    ) {
        this.displayText = [{
            text: text,
            style: {
                color: style?.color
            }
        }];
        this.id = uuidv4();  
    }
}