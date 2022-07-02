import { CodeRenderNode } from "./code-render-node";
import { LinkedListUtil } from "./linked-list.util";

export class CodeRenderNodeUtil {
    static nodeLinkedListUtil = new LinkedListUtil('prevNode', 'nextNode');
    static identifierLinkListUtil = new LinkedListUtil('prevIdentifier', 'nextIdentifier');
    static boundaryLinkedListUtil = new LinkedListUtil('prevBoundary', 'nextBoundary');
    static unlink(node: CodeRenderNode) {
        if (node.isHead) {
            throw 'can not unlink head node'
        };
        let boundary = node.boundary;
        let nextBoundary = boundary.nextBoundary;

        if (boundary.nextNode.id === node.id) {
            if (nextBoundary.prevNode.id === node.id) {
                CodeRenderNodeUtil.boundaryLinkedListUtil.unlinked(boundary);
                nextBoundary.prevNode = boundary.prevNode;
            } else {
                boundary.nextNode = node.nextNode
            }
        } 
        if (nextBoundary.prevNode.id === node.id) {
            nextBoundary.prevNode = node.prevNode;
        }
        if (node.identifier) {
            CodeRenderNodeUtil.identifierLinkListUtil.unlinked(node);
        }

        CodeRenderNodeUtil.nodeLinkedListUtil.unlinked(node);
    }

    static insertNodes(head: CodeRenderNode, tail: CodeRenderNode, left: CodeRenderNode, right: CodeRenderNode) {
        let nodeUtil: LinkedListUtil = CodeRenderNodeUtil.nodeLinkedListUtil;
        let identUtil: LinkedListUtil = CodeRenderNodeUtil.identifierLinkListUtil;
        let boundaryUtil: LinkedListUtil = CodeRenderNodeUtil.boundaryLinkedListUtil;
        let headIdentifier = nodeUtil.find(head, (node: CodeRenderNode) => node.identifier, tail);
        let tailIdentifier = nodeUtil.findReversely(tail, (node: CodeRenderNode) => node.identifier, head);
        let leftIdentifier = nodeUtil.findReversely(left, (node: CodeRenderNode) => node.identifier, right);
        let rightIdentifier = nodeUtil.find(right, (node: CodeRenderNode) => node.identifier, left);

        nodeUtil.linkAfter(left, head);
        nodeUtil.linkAfter(tail, right);

        if (leftIdentifier) { // 有headIdentifier就一定会有tailIdentifier，有leftIdentifier就一定有rightIdentifier
            if (headIdentifier) {
                identUtil.linkAfter(leftIdentifier, headIdentifier);
                identUtil.linkAfter(tailIdentifier, rightIdentifier);
            } else {
                identUtil.linkAfter(leftIdentifier, rightIdentifier);
            }
        } else if (headIdentifier) {
            identUtil.linkAfter(tailIdentifier, headIdentifier) // 让其首尾相接形成环
        }

        nodeUtil.find(head, (node: CodeRenderNode) => {
            if (node.boundary.nextNode.id === node.id) {
                boundaryUtil.linkAfter(left.boundary, node.boundary);
                return true
            } else {
                node.boundary = left.boundary
            }
        }, tail)

        nodeUtil.find(right, (node: CodeRenderNode) => {
            if (node.boundary.nextNode.id === node.id) {
                boundaryUtil.linkAfter(tail.boundary, node.boundary);
                if (node.id === right.id) {
                    node.boundary.prevNode = tail;
                }
                return true;
            } else {
                node.boundary = tail.boundary
            }
        })

        if (head.boundary.nextNode.id === head.id) {
            head.boundary.prevNode = left;
        } 

        if (right.boundary.nextNode.id === right.id) {
            right.boundary.prevNode = tail;
        }
    }

    static cloneNode(node: CodeRenderNode) {
        let newNode = new CodeRenderNode();
        Object.assign(newNode, node);
        return newNode;
    }

    static linkNodes(left: CodeRenderNode, right: CodeRenderNode) {
        let nodeUtil: LinkedListUtil = CodeRenderNodeUtil.nodeLinkedListUtil;
        let identUtil: LinkedListUtil = CodeRenderNodeUtil.identifierLinkListUtil;
        let boundaryUtil: LinkedListUtil = CodeRenderNodeUtil.boundaryLinkedListUtil;
        let leftIdentifier = nodeUtil.findReversely(left, (node: CodeRenderNode) => node.identifier, right);
        let rightIdentifier = nodeUtil.find(right, (node: CodeRenderNode) => node.identifier, left);

        nodeUtil.linkAfter(left, right);

        if (leftIdentifier) {
            identUtil.linkAfter(leftIdentifier, rightIdentifier);
        }

        nodeUtil.find(right, (node: CodeRenderNode) => {
            if (node.boundary.nextNode.id === node.id) {
                boundaryUtil.linkAfter(left.boundary, node.boundary);
                return true
            } else {
                node.boundary = left.boundary
            }
        })

        if (right.boundary.nextNode.id === right.id) {
            right.boundary.prevNode = left;
        }
    }

    static unlinkNode(node: CodeRenderNode) {
        if (!node.nextNode) return;
        let nextNode = node.nextNode, prevNode = node.prevNode, boundary = node.boundary, nextBoundary = boundary.nextBoundary;
        if (boundary.nextNode.id === node.id) boundary.nextNode = nextNode;
        if (nextBoundary.prevNode.id === node.id ) {
            if (nextBoundary.nextNode.id === boundary.nextNode.id) {
                CodeRenderNodeUtil.boundaryLinkedListUtil.unlinked(nextBoundary);
            } else {
                nextBoundary.prevNode = nextNode;
            }
        }
        if (node.identifier) {
            CodeRenderNodeUtil.identifierLinkListUtil.unlinked(node);
        }
        CodeRenderNodeUtil.unlink(node);
    }
}