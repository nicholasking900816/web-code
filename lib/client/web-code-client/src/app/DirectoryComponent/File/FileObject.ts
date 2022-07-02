import { JavascriptAst } from "javascript-ast-parser/src/JavascriptAst";
import { CodeRenderNode } from "JavaScript-code-renderer/code-render-node";
import { Definition } from "javascript-scope-analyzer/src/lib/Definition";
import { Directory } from "../Directory/Directory";

export class FileObject {
    private transDuaration = 10;
    private count = 0;
    private lastTime = null;
    private resolveFn = null;
    private getNewCodePromise = null;
    private currentNode: CodeRenderNode = null;
    private content: string = null;
    private dirty = true;

    constructor(
        public path: string,
        public name: string,
        public parent?: Directory,
        public headRenderNode?: CodeRenderNode,
        public ast?: JavascriptAst,
    ) {

    }

    static stringify(headNode: CodeRenderNode, tailNode?: CodeRenderNode) {
        let str = '';
        let curNode = headNode;
        while(curNode) {
            str += curNode.text.replace(/\&nbsp;/g, ' ');
            if (curNode.lineEnd) str += '\r\n';
            if (curNode.id === tailNode.id) break;
            curNode = curNode.nextNode;
        }
        return str;
    }

    private scheduleTrans() {
        setTimeout(() => {
            this.count = 0;
            this.lastTime = Date.now();
            this.doTrans();
        })
    }

    private isNeedBreak() {
        if (Date.now() - this.lastTime > this.transDuaration) {
            return true
        } 
        return false;
    }

    private doTrans() {
        if (!this.currentNode) this.currentNode = this.headRenderNode;
        while(this.currentNode) {
            this.content += this.currentNode.text.replace(/\&nbsp;/g, ' ');
            if (this.currentNode.lineEnd) this.content += '\r\n';
            this.currentNode = this.currentNode.nextNode;
            if (this.currentNode === this.headRenderNode) {
                this.finishTrans();
                return;
            }
            this.count ++;
            if (this.count >= 100 && this.isNeedBreak()) {
                this.scheduleTrans();
                break;
            }
        }
    }

    private finishTrans() {
        this.resolveFn(this.content)
        this.lastTime = this.resolveFn = this.currentNode = null;
        this.count = 0;
    }

    setIsDirty() {
        this.dirty = true;
    }

    isDirty() {
        return this.dirty;
    }

    stringifyAsyn() {
        if (this.dirty) {
            this.dirty = false;
            this.getNewCodePromise = new Promise(resolve => this.resolveFn = resolve);
            this.content = '';
            this.scheduleTrans();
        }
        
        return this.getNewCodePromise;
    }
}