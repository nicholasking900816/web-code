import { Block } from "javascript-ast-parser/src/Block";
import { AstNode } from "javascript-ast-parser/src/lib/AstNode";
import { CodeRenderNode } from "JavaScript-code-renderer/code-render-node";
import { CodeRenderNodeUtil } from "JavaScript-code-renderer/code-render-node.util";
import { CodeSelection } from "../../src/app/CodeSnippet/CodeSelection.interface";

export class HistoryOperation {
    block: Block;
    index: number;
    row: number;
    col: number;
    pointerNode: CodeRenderNode;
    currentAstNodes: AstNode[];
    prevAstNodes: AstNode[];
    hisRenderNodeHead: CodeRenderNode;
    hisRenderNodeTail: CodeRenderNode;
    selection: CodeSelection;
    constructor(
        
    ) {

    }

    private mergePrevAstNodes(operation: HistoryOperation) {
        let min = this.index;
        let max = Math.max(this.index + this.prevAstNodes.length - 1, operation.index + operation.prevAstNodes.length - 1);
        let item1 = this.prevAstNodes;
        let item2 = operation.prevAstNodes;
        let result = [];
        for(let index = min; index <= max; index ++) {
            let item = item1[index - this.index] || item2[index - operation.index];
            
            result.push(item1[index - this.index] || item2[index - operation.index])
        }
        this.prevAstNodes = result;
        this.index = min;
    }

    private mergeCurrentAstNodes(operation: HistoryOperation) {
        let min = this.index;
        let max = Math.max(this.index + this.currentAstNodes.length - 1, operation.index + operation.currentAstNodes.length - 1);
        let item1 = this.currentAstNodes;
        let item2 = operation.currentAstNodes;
        let result = [];
        for(let index = min; index <= max; index ++) {
            let item = item1[index - this.index] || item2[index - operation.index];
            
            result.push(item1[index - this.index] || item2[index - operation.index])
        }
        this.currentAstNodes = result;
    }

    cancelEdit() {
        CodeRenderNodeUtil.insertNodes(
            this.hisRenderNodeHead, 
            this.hisRenderNodeTail, 
            this.hisRenderNodeHead.prevNode, 
            this.hisRenderNodeTail.nextNode
        )
        if (typeof this.index === 'number') {
            this.block.body.splice(this.index, this.currentAstNodes.length, ...this.prevAstNodes)
        }
    }


    mergeEdit(operation: HistoryOperation) {
        this.index = Math.min(this.index, operation.index);
        this.mergeCurrentAstNodes(operation);
        this.mergePrevAstNodes(operation);
    }
}