import { CodeRenderNode } from "JavaScript-code-renderer/code-render-node";
import { LinkedListUtil } from "JavaScript-code-renderer/linked-list.util";
// static nodeLinkedListUntil = new LinkedListUtil('prevNode', 'nextNode');
//     static boundaryLinkedListUtil = new LinkedListUtil('prevBoundary', 'nextBoundary');
//     static identifierLinkedListUtil = new LinkedListUtil('prevIdentifier', 'nextIdentifier');
export class NodeManager {
    private _nodeLinkedListUtil: LinkedListUtil = new LinkedListUtil('prevNode', 'nextNode');
    private _IdentifierLinkedListUtil: LinkedListUtil = new LinkedListUtil('prevIdentifier', 'nextIdentifier');
    private _boundaryLinkedListUtil = new LinkedListUtil('prevBoundary', 'nextBoundary');
    constructor() {

    }

    separate(node: CodeRenderNode) {
        
    }
}