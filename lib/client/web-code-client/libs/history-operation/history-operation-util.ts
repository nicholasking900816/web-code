import { LinkedListUtil } from "JavaScript-code-renderer/linked-list.util";

export class HistoryOperationUtil {
    static nodeLinkeListUtil = new LinkedListUtil('prevNode', 'nextNode');
    static identifierLinkedListUntil = new LinkedListUtil('prevIdentifier', 'nextIdentifier');
    static boudaryLinkedList = new LinkedListUtil('prevBoundary', 'nextBoundary');
    static isSamePos(origin, target) {
        return origin.row === target.row && origin.col === target.col;
    }
    static min(origin: any, target: any) {
        if (target.row < origin.row) return target;
        if (target.row > origin.row) return origin;
        if (target.col < origin.col) return target;
        return origin;
    }
}