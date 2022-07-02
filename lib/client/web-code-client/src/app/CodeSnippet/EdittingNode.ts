import { CodeRenderNode } from "JavaScript-code-renderer/code-render-node";
import { Util } from "../../util/util";

export class EdittingNode {
    left: string;
    right: string;
    editting: CodeRenderNode;
    input = '';
    constructor(public source: CodeRenderNode, pointerOffset) {
        this.left = source.text.slice(0, pointerOffset);
        this.right = source.text.slice(pointerOffset);
        this.editting = Util.cloneCodeRenderNode(source);
    }

    update() {
        this.editting.text = this.left + this.input + this.right;
    }
}

