import { BoundaryNode } from "JavaScript-code-renderer/boundary-node";
import { CodeRenderNode } from "JavaScript-code-renderer/code-render-node";
import { CodeRenderNodeUtil } from "JavaScript-code-renderer/code-render-node.util";
import { LinkedListUtil } from "JavaScript-code-renderer/linked-list.util";
import { Scope } from "javascript-scope-analyzer/src/lib/Scope";
import { CodeSelection } from "../app/CodeSnippet/CodeSelection.interface";

export class Util {
    static charSize = 69.28 / 7;
    static charSize2 = (181.8 - 2 * 69.28 / 7) / 9;
    static nodeLinkedListUntil = new LinkedListUtil('prevNode', 'nextNode');
    static boundaryLinkedListUtil = new LinkedListUtil('prevBoundary', 'nextBoundary');
    static identifierLinkedListUtil = new LinkedListUtil('prevIdentifier', 'nextIdentifier');
    static measureCharLen(str: string) {
        let charLen = 0;
        for(let index = 0, len = str.length; index < len; index ++) {
            if (str.charCodeAt(index) > 255) {
                charLen += Util.charSize2;
            } else {
                charLen += Util.charSize;
            }
        }
        return charLen;
    }

    static getCharLenFromRowHead(node: CodeRenderNode, endPos: number) {
        const rowHeadNode = Util.getLineStart(node);
        let len = 0;
        Util.nodeLinkedListUntil.find(rowHeadNode, item => {
            if (item.text.length + item.col >= endPos) {
                len += Util.measureCharLen(item.text.slice(0, endPos - item.col));
                return true;
            } else {
                len += Util.measureCharLen(item.text);
            }
        });
        return len;
    }

    static getRowIndent(node: CodeRenderNode) {
        let rowHeadNode = Util.getLineStart(node);
        let indent = 0, reg = /[^ ]+/, result: any, curNode = rowHeadNode;
        while(!(result = reg.exec(curNode.text)) && !curNode.isHead) {
            indent += curNode.text.length;
            if (curNode.lineEnd) break;
            curNode = curNode.nextNode;
        }
        if (result) {
            indent += result.index;
        }
        return indent;
    }

    static getCharSizeFromRowHead(node: CodeRenderNode) {
        let rowHeadNode: CodeRenderNode = Util.getLineStart(node), size = 0;
        Util.nodeLinkedListUntil.forEach(rowHeadNode, (curNode: CodeRenderNode) => {
            size += Util.measureSizeOfText(curNode.text); 
        }, node.prevNode);
        return size;
    }

    static measureSizeOfText(text: string) {
        let size = 0;
        for(let i = 0; i < text.length; i ++) {
            size += (text.charCodeAt(i) > 255 ? 2 : 1)
        }
        return size
    }

    static measureOffset(pixelOffset: number, text: string) {
        let charLen = 0, offset = 0;
        for(let index = 0, len = text.length; index < len; index ++) {
            if (text.charCodeAt(index) > 255) {
                charLen += Util.charSize2;
            } else {
                charLen += Util.charSize;
            }
            if (charLen === pixelOffset) {
                return ++offset;
            } else if (charLen > pixelOffset) {
                return offset
            }
            offset ++;
        }
        return offset
    }

    static matchPosition(headNode: CodeRenderNode, targetCharLen, greedy = false) {
        let charLen = 0,  curNode = headNode, col = 0;
        mainLoop: do {
            let text = curNode.text;
            for(let i = 0, len = text.length; i < len; i++) {
                let prevCharLen = charLen;
                col ++; 
                if (text.charCodeAt(i) > 255) {
                    charLen += Util.charSize2;
                } else {
                    charLen += Util.charSize;
                }
                if (charLen === targetCharLen) {
                    break mainLoop;
                } else if (charLen > targetCharLen) {
                    if(!greedy) {
                        charLen = prevCharLen;
                        col --;
                    } 
                    break mainLoop;
                }
                   
            }
            if (curNode.lineEnd) break;
            curNode = curNode.nextNode;
        } while(curNode !== headNode);
        return {
            node: curNode,
            col: col,
            charLen: charLen
        }
    }

    static cloneCodeRenderNode(origin: CodeRenderNode) {
        return CodeRenderNodeUtil.cloneNode(origin);
    }

    static cloneSelection(origin: CodeSelection) {
        return {
            from: Object.assign({}, origin.from),
            to: Object.assign({}, origin.to),
            direction: origin.direction
        }
    }

    static cloneAndUpdateRenderNode(origin: CodeRenderNode, updateData: any) {
        let newNode = new CodeRenderNode();
        let id = newNode.id;
        Object.assign(newNode, origin, updateData || {});
        newNode.id = id;
        return newNode;
    }

    static isSamePos(origin, target) {
        return origin.row === target.row && origin.col === target.col;
    }

    static getLineStartSpace(node: CodeRenderNode) {
        let space = '';
        Util.nodeLinkedListUntil.find(Util.getLineStart(node), node => {
            if (node.text.charCodeAt(0) !== 32 ) {
                return true;
            } 
            let matchResult = node.text.match(/[^ ]/);
            space += (!matchResult ? node.text : node.text.slice(0, matchResult.index));
            if (node.lineEnd) return true;
        });
        return space;
    }

    static getLineStart(tailNode: CodeRenderNode) {
        let lineStart;
        Util.nodeLinkedListUntil.findReversely(tailNode.prevNode, node => {
            if (node.lineEnd) {
                lineStart = node.nextNode;
                return true
            } else if (!node.block) {
                lineStart = node.nextNode;
                return true;
            }
        })
        return lineStart;
    }
    
    static getLastEnd(node: CodeRenderNode) {
        return node && Util.nodeLinkedListUntil.findReversely(node.prevNode, node => node.lineEnd) || null
    }

    static getNextStart(node: CodeRenderNode) {
        return Util.nodeLinkedListUntil.find(node, node => node.lineEnd).nextNode;
    }

    static isPositionGreater(origin: any, target: any) {
        if (target.row > origin.row) return true;
        if (target.row < origin.row) return false;
        if (target.col > origin.col) return true;
        return false;
    }

    static isPositionSmaller(origin: any, target: any) {
        if (target.row < origin.row) return true;
        if (target.row > origin.row) return false;
        if (target.col < origin.col) return true;
    }

    static MatchDefinition(node) {
        function recursion(node: CodeRenderNode, expectIdentifier?: boolean, expectDot?: boolean, depth = 0) {
            let definition: any;
            if (expectIdentifier && node.prevNode.identifier) {
                definition = recursion(node.prevNode, false, true, depth + 1);
            } else if (expectDot && node.prevNode.text === '.') {
                definition = recursion(node.prevNode, true, false, depth + 1);
            }
            if (definition) {
                if (depth === 0) {
                    if (node.identifier) {
                        return definition.definitions ? Scope.prototype.matchOwnDefinitions.call(definition, node.text) : null
                    } 
                    return definition.definitions ? definition.definitions.map(item => ({
                        near: 0,
                        definition : item,
                        index: 0,
                        text: item.identifier,
                        textLeft: '',
                        textRight: ''
                    })) : [];
                } else {
                    if (node.identifier) {
                        return definition.definitions ? definition.definitions.find(definition => definition.identifier === node.text) : null
                    }
                    return definition;
                }
                
            }
            let scope: Scope = node.scope();
            if (depth === 0) {
                return scope.matchDefinitions(node.text);
            }
            return scope.fullMatchDefinition(node.text);
        }

        return recursion(node, node.text === '.', node.identifier);
    }

    static sortDefinitions(definitions) {
        return definitions.sort((d1, d2) => {
            if (d1.index === d2.index) {
                return d1.near - d2.near
            } else {
                return d1.index - d2.index
            }
        })
    }

    static insertText(originText, insertIndex, insertText) {
        return originText.slice(0, insertIndex) + insertText + originText.slice(insertIndex);
    }

    static showUpSpace(node, start = 0, end?: number) {
        const reg = /(\s+)/;
        end = end != null ? end : node.text.length;
        let text = node.text.slice(start, end), matchResult, result = [];
        if (start > 0) {
            result.push({
                text: node.text.slice(0, start),
                style: {
                    color: node.style?.color
                }
            })
        }
        while(matchResult = text.match(reg)) {
            if (matchResult.index !== 0) {
                result.push({
                    text: text.slice(0, matchResult.index),
                    style: node.style
                })
            }
            result.push({
                text: matchResult[1].replace(/\s/g, '·'),
                style: {
                    color: 'rgba(101,101,101,0.5)',
                }
            })
            text = text.slice(matchResult.index + matchResult[1].length);
        }
        if (text) { 
            result.push({
                text: text,
                style: {
                    color: node.style?.color
                }
            })
        }
        if (end < node.text.length) {
            result.push({
                text: node.text.slice(end),
                style: {
                    color: node.style?.color
                }
            })
        }
        return result;
    }

    static breakPoints = [' ', '+', '-', '*', '/', '='];

    static getIndexs(leftBoundary: BoundaryNode, rightBoundary: BoundaryNode, body) {
        let left = Util.boundaryLinkedListUtil.find(leftBoundary, (boundary: BoundaryNode) => !!boundary.node, rightBoundary);
        if (!left) return {startIndex: null, endIndex: null};
        let right = Util.boundaryLinkedListUtil.findReversely(rightBoundary, (boundary: BoundaryNode) => !!boundary.node, leftBoundary);
        return {
            startIndex: body.findIndex(node => node = left.node),
            endIndex: body.findIndex(node => right.node)
        };
    }

    static riseToSameBlock(leftNode: CodeRenderNode, rightNode: CodeRenderNode) {
        leftNode = Util.nodeLinkedListUntil.findReversely(leftNode, (node: CodeRenderNode) => 
            !node.err && node.text?.length || node.prevNode.isHead || node.isHead
        )
        rightNode = Util.nodeLinkedListUntil.find(rightNode, (node: CodeRenderNode) => 
            !node.err && node.text?.length || node.nextNode.isHead || node.isHead
        )
        
        let curLeftBoundary: BoundaryNode = leftNode.boundary;
        let curRightBoundary: BoundaryNode = rightNode.isHead ? rightNode.boundary : rightNode.boundary.nextBoundary;
        let curLeftNode = curLeftBoundary.nextNode;
        let curRightNode = curRightBoundary.prevNode,
            leftRise = () => {
                Util.boundaryLinkedListUtil.findReversely(curLeftBoundary, (boundary: BoundaryNode) => {
                    // 碰到头节点则返回头节点
                    if((boundary.nextNode.block?.depth || 0) < (curLeftNode.block?.depth || 0)) {
                        curLeftBoundary = boundary;
                        curLeftNode = boundary.nextNode;
                        return true;
                    }
                })
            },
            rightRise = () => {
                Util.boundaryLinkedListUtil.find(curRightBoundary, (boundary: BoundaryNode) => {
                    // 碰到头节点则返回头节点
                    if((boundary.prevNode.block?.depth || 0) < (curRightNode.block?.depth || 0)) {
                        curRightBoundary = boundary;
                        curRightNode = boundary.prevNode;
                        return true;
                    }
                })
            }
        while(curLeftNode.id !== curRightNode.id && curLeftNode.block !== curRightNode.block) {
            // 头节点的block深度为1;
            let leftDepth = curLeftNode.isHead ? 1 : curLeftNode.block.depth;
            let rightDepth = curRightNode.isHead ? 1 : curRightNode.block.depth;
            // 两边都已到最外层block;
            if (leftDepth === 1 && rightDepth === 1) break;
            if(leftDepth > rightDepth) {
                leftRise();
            } else {
                rightRise()
            }
        }
        
        return {
            curLeftNode: curLeftNode.isHead ? curLeftNode.nextNode : curLeftNode,
            curRightNode: curRightNode.isHead ? curRightNode.prevNode : curRightNode,
            curLeftBoundary: curLeftNode.boundary,
            curRightBoundary: curRightNode.boundary.nextBoundary
        }
    }
}