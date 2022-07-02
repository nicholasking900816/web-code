export class LinkedListUtil {
    constructor(private prevKey: string, private nextKey: string) {}

    linkBefore(originNode: any, targetNode) {
        targetNode[this.nextKey] = originNode;
        originNode[this.prevKey] = targetNode;
    }

    linkAfter(originNode: any, targetNode) {
        originNode[this.nextKey] = targetNode;
        targetNode[this.prevKey] = originNode;
    }

    insertBefore(originNode: any, targetNode) {
        let prevNode = originNode[this.prevKey]
        if (prevNode) {
            prevNode[this.nextKey] = targetNode;
            targetNode[this.prevKey] = prevNode;
        }

        targetNode[this.nextKey] = originNode;
        originNode[this.prevKey] = targetNode;
    }

    insertAfter(originNode: any, targetNode) {
        let nextNode = originNode[this.nextKey]
        if (nextNode) {
            nextNode[this.prevKey] = targetNode;
            targetNode[this.nextKey] = nextNode;
        }

        originNode[this.nextKey] = targetNode;
        targetNode[this.prevKey] = originNode;
    }

    reInsert(node) {
        this.linkAfter(node[this.prevKey], node);
        this.linkAfter(node, node[this.nextKey]);
    }

    unlinked(node: any) {
        let prevNode = node[this.prevKey], nextNode = node[this.nextKey];
        if (prevNode) {
            prevNode[this.nextKey] = nextNode;
        }
        if (nextNode) {
            nextNode[this.prevKey] = prevNode;
        }

        node[this.nextKey] = node[this.prevKey] = null;
    }

    separate(node: any) {
        let prevNode = node[this.prevKey], nextNode = node[this.nextKey];
        if (prevNode) {
            prevNode[this.nextKey] = nextNode;
        }
        if (nextNode) {
            nextNode[this.prevKey] = prevNode;
        }
    }

    forEach(head: any, iterateCallBack: Function, tail?: any) {
        let current = head;
        do {
            iterateCallBack(current);
            if (current === tail) break;
            current = current[this.nextKey];
        } while(current && current !== head)     
    }

    forEachReversely(tail: any, iterateCallBack: Function, head?: any) {
        let current = tail;
        do {
            iterateCallBack(current);
            if (current === head) break;
            current = current[this.prevKey];
        } while(current && current !== tail) 
    }

    find(head: any, iterateCallBack: Function, tail?: any) {
        let current = head;
        do {
            if(iterateCallBack(current)) {
                return current;
            }
            if (current === tail) break;
            current = current[this.nextKey];
        } while(current && current !== head);
        return null;
    }

    replace(target: any, origin: any) {
        this.linkAfter(origin[this.prevKey], target);
        this.linkAfter(target, origin[this.nextKey]);
    }

    findReversely(tail: any, iterateCallBack: Function, head?: any) {
        let current = tail;
        do {
            if(iterateCallBack(current)) {
                return current;
            }
            if(current === head) break;
            current = current[this.prevKey];
        } while(current && current !== tail);
        return null;
    }

    length(head: any) {
        let len = 0;
        this.forEach(head, () => len++);
        return len;
    }
}