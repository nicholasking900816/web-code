import * as React from 'react';
import { ErrorMsgBlock } from './ErrorMsgBlock/ErrorMsgBlock';

import './CodeSnippet.scss';
import { CodeRenderer } from 'JavaScript-code-renderer';
import { CodeRenderNode } from 'JavaScript-code-renderer/code-render-node';
import { JavascriptAst } from 'javascript-ast-parser/src/JavascriptAst';
import { JavascriptAstParsser } from 'javascript-ast-parser/src/JavascriptAstParser';
import { JavascriptScopeAnalyzer } from 'javascript-scope-analyzer/src/javascript-scope-analyzer';
import { LinkedListUtil } from 'JavaScript-code-renderer/linked-list.util';
import { KeyBoardProx } from 'keyboard-prox/keyboard-prox';
import { EdittingNode } from './EdittingNode';
import { Util } from '../../util/util';
import { CodeSelection } from './CodeSelection.interface';
import { Scope } from 'javascript-scope-analyzer/src/lib/Scope';
import { getConsoleDefinition, getGlobalDefinitions } from 'javascript-scope-analyzer/src/lib/constance';
import { HistoryOperation } from 'history-operation/history-operation';
import { Definition } from 'javascript-scope-analyzer/src/lib/Definition';
import { MergeCall } from '../../util/decorators/MergeCall.decorate';
import { ENWRAP_CLOSE_MAP, ENWRAP_OPEN } from '../../util/constant';
import { MyContext } from '../../myContext';
import { FileObject } from '../DirectoryComponent/File/FileObject';
import { CodeRenderNodeUtil } from 'JavaScript-code-renderer/code-render-node.util';
import { OperationMenu } from '../OperatioinMenu/OperationMenu';

const selectionBgColor = 'rgb(38,79,120)'

export class CodeSnippet extends React.Component<any, any, any> {
    code: string;
    headNode: CodeRenderNode;
    editting = false;
    cursorFlashing = false;
    ast: JavascriptAst;
    pointerIndex: number;
    keyboardProx: KeyBoardProx = new KeyBoardProx();
    inputBoxRef: any = React.createRef();
    searchBoxRef: any = React.createRef();
    cursorRef: any = React.createRef();
    timer: any;
    searchResult: any = [];

    nodeLinkedListUtil = new LinkedListUtil('prevNode', 'nextNode');
    identifierLinkedListUtil = new LinkedListUtil('prevIdentifier', 'nextIdentifier');
    boundaryLinkedListUtil = new LinkedListUtil('prevBoundary', 'nextBoundary');
    pointer: {row: number, col: number, len: number, node: EdittingNode};
    renderNodeHead: CodeRenderNode;
    forcePointerVisible = false;
    isSelecting = false;
    selection: CodeSelection;
    originNodes: CodeRenderNode[];
    bgBlock1Style: any = {};
    bgBlock2Style: any = {};
    terminateFlash: Function;
    historyOperations: HistoryOperation[] = [];
    curOperation: HistoryOperation;
    patchOperation: Function;
    mergeEdit = 0;
    definition: Definition;
    clipboard: string;
    focusedSearchResult: number = 0;
    modification: Array<{current: any, origin: any}> = [];
    submitModification: Function;
    isSearching = false;
    operations = [];
    hintInfo = {
        hintItems: [],
        focus: 0
    }

    constructor(props) {
        super(props);
        this.code = props.code;
        this.state = {
            inputText: '',
            hideCursor: false,
            headNode: null,
            menuVisible: false,
            menuPos: {top: 0, left: 0}
        }
        this.keyboardProx.onKeydown('Backspace', (e) => {
            this.onBackspace(e);
        })
        this.keyboardProx.onKeydown('ArrowLeft', (e) => {
            this.mergeEdit = 0;
            this.onArrowLeft(e);
        })
        this.keyboardProx.onKeydown('Escape', (e) => {
            this.onEscape();
        })
        this.keyboardProx.onKeydown('ArrowRight', (e) => {
            this.mergeEdit = 0;
            this.onArrowRight();
        })
        this.keyboardProx.onKeydown('ArrowUp', (e) => {
            this.mergeEdit = 0;
            this.onArrowUp(e);
        })
        this.keyboardProx.onKeydown('ArrowDown', (e) => {
            this.mergeEdit = 0;
            this.onArrowDown(e);
        })
        this.keyboardProx.onKeydown('Enter', (e) => {
            this.deleteSelection();
            this.onEnter();
        })
        this.keyboardProx.onKeydown('Tab', (e) => {
            e.preventDefault();
            this.onTab();
        })
        this.keyboardProx.onKeydown('Tab', (e) => {
            e.preventDefault();
            this.onBackTab();
        }, 'shiftKey')
        this.keyboardProx.onKeydown('z', (e) => {
            e.preventDefault();
            this.cancelOperation()
        }, 'ctrlKey')
        this.keyboardProx.onKeydown('c', (e) => {
            e.preventDefault();
            this.onCopy()
        }, 'ctrlKey')
        this.keyboardProx.onKeydown('v', (e) => {
            e.preventDefault();
            this.onPaste()
        }, 'ctrlKey')
        this.keyboardProx.onKeydown('x', (e) => {
            e.preventDefault();
            this.onCut()
        }, 'ctrlKey')
        this.keyboardProx.beforeAll((e) => {
            this.resetInput();
        })
        this.keyboardProx.inceptAll((e) => {
            return !!this.pointer;
        })
    }

    cancelOperation() {
        this.mergeEdit = 0;
        let operation: HistoryOperation = this.historyOperations.pop();
        let head = operation.hisRenderNodeHead;
        if(!operation) return;
        this.forceVisible();
        operation.cancelEdit()
        this.pointer.row = operation.row;
        this.pointer.col = operation.col;
        this.updatePointer(head);
        this.reAnalyze(head.block);
        this.checkIdentifier(Util.nodeLinkedListUntil.find(head, node => node.identifier && node.block))
        this.updateCharLength();

        this.selection = operation.selection;
        if (this.selection) {
            this.selection.from.editting = Util.cloneCodeRenderNode(this.selection.from.source);
            this.selection.to.editting = Util.cloneCodeRenderNode(this.selection.to.source)
        }
        
        this.resetSelectionVertex();
        this.forceUpdate();
    }

    onEscape() {
        this.closeHintBox();
    }

    onBackspace(e) {
        debugger;
        if (this.pointer.node && !this.deleteSelection() && !(this.pointer.row === 1 && this.pointer.col === 0)) {
            let left = this.pointer.node.left;
            this.mergeEdit = ![1,3].includes(this.mergeEdit) ? 1 : 3;
            if (!left.length) {
                if (this.pointer.col > 0) {
                    let prevNode = Util.nodeLinkedListUntil.findReversely(this.pointer.node.source.prevNode, node => node.text.length);
                    this.pointer.node = new EdittingNode(prevNode, this.pointer.col - prevNode.col);
                    this.onBackspace(e);
                } else {
                    let prevNode = Util.nodeLinkedListUntil.findReversely(this.pointer.node.source.prevNode, item => item.lineEnd);
                    if (!prevNode.text && !prevNode.prevNode.lineEnd) {
                        prevNode = prevNode.prevNode;
                        Util.nodeLinkedListUntil.linkAfter(prevNode, prevNode.nextNode.nextNode);
                    } else {
                        prevNode.lineEnd = false;
                    }
                    this.initOperation();
                    this.pointer.row --;
                    this.pointer.col = prevNode.col + prevNode.text.length; 
                    this.pointer.node = new EdittingNode(prevNode, prevNode.text.length);
                    this.updateCharLength();
                    
                    this.refreshCode();
                }
                return;
            }
            this.initOperation();
            this.pointer.col --;
            this.pointer.node.left = left.slice(0, left.length - 1);
            this.pointer.node.update();
            this.modification.push({
                current: this.pointer.node.editting,
                origin: this.pointer.node.source
            })
            this.updateCharLength();
            this.refreshCode();
            this.getCodeHints();
        }
    }

    tryApplyTabIndent() {
        let vertexs = this.getSelectionVertex();
        if (vertexs[0].row !== vertexs[1].row) {
            let isNewRow = true, remainder: number, firstRowHead;
            Util.nodeLinkedListUntil.forEach(vertexs[0].source, (node: CodeRenderNode) => {
                if (isNewRow) {
                    let sourceRowHeadNode: CodeRenderNode = Util.getLineStart(node);
                    let edittingRowHeadNode: CodeRenderNode = Util.cloneCodeRenderNode(sourceRowHeadNode);
                    let currentIdent = Util.getRowIndent(sourceRowHeadNode);
                    if (!firstRowHead) firstRowHead = sourceRowHeadNode;
                    remainder = currentIdent % 4;
                    edittingRowHeadNode.text = ''.padStart(4 - remainder, ' ') + edittingRowHeadNode.text;
                    this.modification.push({
                        current: edittingRowHeadNode,
                        origin: sourceRowHeadNode
                    }) 
                    isNewRow = false;
                } 
                if (node.lineEnd) {
                    isNewRow = true;
                }
            }, vertexs[1].source)
            this.initOperation();
            this.pointer.col += (4 - remainder);
            vertexs[1].col = this.pointer.col;
            this.refreshCode(firstRowHead, vertexs[1].source);
            return true
        }
        return false
    }

    onTab() {
        if (this.tryApplyTabIndent()) return;
        let size = 0;
        if (this.hasSelection()) {
            let vertexs = this.getSelectionVertex()
            size = Util.getCharSizeFromRowHead(vertexs[0].source) + 
                Util.measureSizeOfText(vertexs[0].source.text.slice(0, vertexs[0].col - vertexs[0].source.col))
        } else {
            size = Util.getCharSizeFromRowHead(this.pointer.node.source) + 
                Util.measureSizeOfText(this.pointer.node.left)
        }
        let remainder = size % 4;
        this.onInput({target: {value: ''.padStart(4 - remainder, ' ')}});
    }

    onBackTab() {
        const deleteSpace = (curNode: CodeRenderNode, curRemainer) => {
            let reg = /[^ ]+/;
            while(curRemainer) {
                curNode = curNode.nextNode;
                let result = reg.exec(curNode.text);
                let edittingNode: CodeRenderNode = Util.cloneCodeRenderNode(curNode);
                if (result) {
                    edittingNode.text = edittingNode.text.slice(curRemainer);
                    curRemainer = 0
                } else {
                    let deletedSpaceCount = Math.min(edittingNode.text.length, curRemainer);
                    edittingNode.text = edittingNode.text.slice(deletedSpaceCount);
                    curRemainer -= deletedSpaceCount
                }
                this.modification.push({
                    current: edittingNode,
                    origin: curNode
                })
            }
        }
        if (this.hasSelection()) {
            let isNewRow = true, firstRowHead: CodeRenderNode, remainder;
            let vertexs = this.getSelectionVertex();
            
            Util.nodeLinkedListUntil.forEach(vertexs[0].source, (node: CodeRenderNode) => {
                if (isNewRow) {
                    let sourceRowHeadNode: CodeRenderNode = Util.getLineStart(node);
                    let currentIdent = Util.getRowIndent(sourceRowHeadNode);
                    let curNode = sourceRowHeadNode.prevNode;
                    if (!firstRowHead) firstRowHead = sourceRowHeadNode;
                    remainder = Math.min(currentIdent % 4 || 4, currentIdent);
                    deleteSpace(curNode, remainder);
                    isNewRow = false;
                } else if (node.lineEnd) {
                    isNewRow = true;
                }
            }, vertexs[1].source)
            this.initOperation();
            this.pointer.col = Math.max(this.pointer.col - remainder, 0);
            this.selection.from.col = Math.max(this.selection.from.col - remainder, 0);
            this.selection.to.col = this.pointer.col;
            this.refreshCode(firstRowHead, vertexs[1].source);
        } else {
            let sourceRowHeadNode: CodeRenderNode = Util.getLineStart(this.pointer.node.source);
            let currentIdent = Util.getRowIndent(this.pointer.node.source);
            let curNode = sourceRowHeadNode.prevNode;
            let remainder = Math.min(currentIdent % 4 || 4, currentIdent);
            deleteSpace(curNode, remainder);
            this.initOperation();
            this.pointer.col = Math.max(this.pointer.col - remainder, 0);
            this.refreshCode(sourceRowHeadNode, this.pointer.node.source.nextNode);
        }
    }

    onArrowUp(e) {
        if (this.hintInfo.hintItems.length) {
            this.hintInfo.focus = Math.max(0, this.hintInfo.focus - 1);
            this.forceUpdate();
            return;
        }
        if (this.pointer.node && this.pointer.row !== 1) {
            this.forceVisible();
            let position = Util.matchPosition(
                Util.getLineStart(Util.getLastEnd(this.pointer.node.source)),
                this.pointer.len
            )

            this.pointer.row --;
            this.pointer.node = new EdittingNode(position.node, this.pointer.col - position.node.col);
            this.pointer.col = position.col;
            this.pointer.len = position.charLen;
            this.forceUpdate();
        }
    }

    onArrowDown(e) {
        if (this.hintInfo.hintItems.length) {
            this.hintInfo.focus = Math.min(this.hintInfo.hintItems.length - 1, this.hintInfo.focus + 1);
            this.forceUpdate();
            return;
        }
        if (this.pointer.node && this.pointer.row !== this.renderNodeHead.row) {
            this.forceVisible();
            let position = Util.matchPosition(
                Util.getNextStart(this.pointer.node.source),
                this.pointer.len,
            )

            this.pointer.row ++;
            this.pointer.node = new EdittingNode(position.node, this.pointer.col - position.node.col);
            this.pointer.col = position.col;
            this.pointer.len = position.charLen;
            this.forceUpdate();
        }
    }

    onArrowLeft(e) {
        if (this.pointer.node && !(this.pointer.row === 1 && this.pointer.col === 0)) {
            this.forceVisible();
            let node = this.pointer.node.source, prevNode;
            e.preventDefault();
            if (this.pointer.col === 0 && node.id !== this.renderNodeHead.id) {
                prevNode = this.nodeLinkedListUtil.findReversely(node.prevNode, item => item.lineEnd);
                this.pointer.row --;
                this.pointer.col = prevNode.col + prevNode.text.length;
            } else {
                this.pointer.col --;
                prevNode = node.prevNode;
            }
            if (node.row !== this.pointer.row || node.col > this.pointer.col) {
                this.pointer.node = new EdittingNode(prevNode, this.pointer.col - prevNode.col);
            } else {
                this.pointer.node = new EdittingNode(node, this.pointer.col - node.col);
            }
        
            this.updateCharLength(); 
            this.forceUpdate();
        }
    }

    onArrowRight() {
        if (this.pointer.node) {
            this.forceVisible();
            let node = this.pointer.node.editting, nextNode = node.nextNode;
            if (node.lineEnd && this.pointer.col - node.col === node.text.length) {
                if (nextNode.id === this.renderNodeHead.id) return;
                this.pointer.row ++;
                this.pointer.col = 0;
            } else {
                this.pointer.col ++;
            }
            if (node.row !== this.pointer.row) {
                this.pointer.node = new EdittingNode(nextNode, 0);
            } else if( node.col + node.text.length < this.pointer.col) {
                this.pointer.node = new EdittingNode(nextNode, 1);
            } else {
                this.pointer.node = new EdittingNode(this.pointer.node.source, this.pointer.col - node.col);
                this.pointer.node.editting = node;
            }
        
            this.updateCharLength(); 
            this.forceUpdate();
        }
    }

    onFocusNextSearchResult() {
        this.searchResult[this.focusedSearchResult].focused = false;
        this.focusedSearchResult ++;
        if (this.focusedSearchResult >= this.searchResult.length) this.focusedSearchResult = 0;
        this.searchResult[this.focusedSearchResult].focused = true;
        this.forceUpdate()
    }

    onFocusPrevSearchResult() {
        this.searchResult[this.focusedSearchResult].focused = false;
        this.focusedSearchResult --;
        if (this.focusedSearchResult < 0) this.focusedSearchResult = this.searchResult.length - 1;
        this.searchResult[this.focusedSearchResult].focused = true;
        this.forceUpdate()
    }

    applyModification(replaceIfMatch?: any) {
        let replacedNodes = replaceIfMatch && replaceIfMatch.slice() || [];
        // 把编辑过的节点插入到链表中以获取编辑后的代码片段
        this.modification.forEach((mo) => {
            let {current, origin} = mo;
            if (current instanceof Array) { // 向原链表插入一段片段
                Util.nodeLinkedListUntil.reInsert(current[0]);
                Util.nodeLinkedListUntil.reInsert(current[1]);
                if (origin[0].boundary.nextNode.id === origin[0].id) origin[0].boundary.nextNode = current[0];
                if (origin[1].boundary.nextBoundary.prevNode.id === origin[1].id) {
                    origin[1].boundary.nextBoundary.prevNode = current[1];
                }
                // origin.forEach((node, index) => {
                //     replaceIfMatch.forEach((item, index2) => {
                //         if (node.id === item.id) replacedNodes[index2] = current[index]
                //     })
                // })
                if (origin[0].id === replaceIfMatch[0]?.id) replacedNodes[0] = current[0];
                if (origin[1].id === replaceIfMatch[1]?.id) replacedNodes[1] = current[1];
            } else {
                Util.nodeLinkedListUntil.reInsert(current);
                if (origin.boundary.nextNode.id === origin.id) origin.boundary.nextNode = current;
                if (origin.boundary.nextBoundary.prevNode.id === origin.id) {
                    origin.boundary.nextBoundary.prevNode = current;
                }
                replaceIfMatch.forEach((item, index) => {
                    if (origin.id === item.id) replacedNodes[index] = current
                })
            }
        })

        return replacedNodes;
    }

    removeModification() {
        for(let i = this.modification.length - 1; i >= 0; i--) {
            let {current, origin} = this.modification[i];
            if (origin instanceof Array) {
                Util.nodeLinkedListUntil.reInsert(origin[0]);
                Util.nodeLinkedListUntil.reInsert(origin[1]);
                if (origin[0].boundary.nextNode.id === current[0].id) origin[0].boundary.nextNode = origin[0];
                if (origin[1].boundary.nextBoundary.prevNode.id === current[1].id) origin[1].boundary.nextBoundary.prevNode = origin[1];
            } else {
                Util.nodeLinkedListUntil.reInsert(origin);
                if (origin.boundary.nextNode.id === origin.id) origin.boundary.nextNode = origin;
                if (origin.boundary.nextBoundary.prevNode.id === origin.id) origin.boundary.nextBoundary.prevNode = origin;
            }
        }
    }

    initOperation() {
        this.curOperation = new HistoryOperation();    
        this.curOperation.row = this.pointer.row;
        this.curOperation.col = this.pointer.col;
        this.curOperation.pointerNode = this.pointer.node.source;
        this.curOperation.selection = this.selection ? Util.cloneSelection(this.selection) : null;
    }

    autoEnwrap(text: string) {
        if(!ENWRAP_OPEN.includes(text)) return false;
        
        if(this.hasSelection()) {
            this.initOperation();
            let left = this.selection.from,
                right = this.selection.to;
            if (this.selection.direction === 'left') {
                left = this.selection.to;
                right = this.selection.from;
            }    
            

            left.editting.text = Util.insertText(left.editting.text, left.col - left.editting.col, text);
            left.col ++;
            left.len += Util.charSize;
            this.pointer.col ++;
            this.pointer.len += Util.charSize;
            if (left.editting.id === right.editting.id) {
                right.col ++;
                right.len += Util.charSize;
            }
            right.editting.text = Util.insertText(right.editting.text, right.col - right.editting.col, ENWRAP_CLOSE_MAP[text]);
            this.resetSelectionVertex();
            this.refreshCode(left.source, right.source);
            return true;
        } else {
            this.pointer.node.right = ENWRAP_CLOSE_MAP[text] + this.pointer.node.right;
            return false;
        }
    }

    updateSelectionVetexNode(head:CodeRenderNode, tail: CodeRenderNode) {
        Util.nodeLinkedListUntil.forEach(head, (node) => {
            if (
                this.selection.from.row === node.row &&
                this.selection.from.col >= node.col &&
                this.selection.from.col <= node.col + node.text.length
            ) {
                this.selection.from.source = node;
                this.selection.from.editting = Util.cloneCodeRenderNode(node);
            }
            if (
                this.selection.to.row === node.row &&
                this.selection.to.col >= node.col &&
                this.selection.to.col <= node.col + node.text.length
            ) {
                this.selection.to.source = node;
                this.selection.to.editting = Util.cloneCodeRenderNode(node);
            }
        }, tail)
        this.selection.to.len = Util.getCharLenFromRowHead(this.selection.to.source, this.selection.to.col);
        this.selection.from.len = Util.getCharLenFromRowHead(this.selection.from.source, this.selection.from.col);
    }

    getSelectionVertex(type?: string) {
        if (this.selection) {
            let left = this.selection.from, right = this.selection.to;
            if (this.selection.direction === 'left') {
                left = this.selection.to;
                right = this.selection.from
            }
            if (type) {
                return [left[type], right[type]]
            }
            return [left, right]
        }
        return [];
    }

    onInput(e: any, isPaste = false) {
        let text = isPaste ? this.clipboard || this.inputBoxRef.current.value : e.target.value, vertexs: any;
        if (!isPaste && this.autoEnwrap(text)) return; 
        this.mergeEdit = Util.breakPoints.includes(text) ? 0 : ![2,1].includes(this.mergeEdit) ? 1 : 2// 第一次不merge
        if (this.hasSelection()) { // 有选中文本时要先删除选中的文本
            vertexs = this.doDeleteSelection();
        } else {
            this.initOperation();
        }

        this.pointer.node.input = text;
        this.pointer.node.update();

        this.modification.push({
            current: this.pointer.node.editting,
            origin: this.pointer.node.source
        })

        let textFragments = text.split('\n');
        if (textFragments.length > 1) {
            this.pointer.row += textFragments.length - 1;
            this.pointer.col = textFragments[textFragments.length - 1].length;
        } else {
            this.pointer.col += textFragments[0].length
        }

        if (e) {
            e.target.value = '';
        }
        this.getCodeHints();
        if (vertexs) {
            this.refreshCode(vertexs.left.source, vertexs.right.source);
        } else {
            this.refreshCode();
        }
    }    

    pushOperation() {
        if (!this.curOperation) return this.patchOperation = this.curOperation = null;
        let lastOperation = this.historyOperations[this.historyOperations.length - 1];
        if (lastOperation && this.mergeEdit > 1) {
            lastOperation.mergeEdit(this.curOperation);
        } else {
            this.historyOperations.push(this.curOperation)
        }
        this.patchOperation = this.curOperation = null;
    }
    
    onEnter() {
        if (this.hintInfo.hintItems.length) {
            return this.onSelectedHintItem(this.hintInfo.hintItems.find((item, index) => index === this.hintInfo.focus));
        }
        this.mergeEdit = 0;
        this.forceVisible();
        let edittingNode: EdittingNode = this.pointer.node, source = this.pointer.node.source,
            leftNode = Util.cloneAndUpdateRenderNode(source, {text: edittingNode.left, lineEnd: true}),
            spaceNode = Util.cloneAndUpdateRenderNode(source, {text: Util.getLineStartSpace(source), lineEnd: false}),
            rightNode = Util.cloneAndUpdateRenderNode(source, {text: edittingNode.right});

        Util.nodeLinkedListUntil.linkAfter(leftNode, spaceNode);
        Util.nodeLinkedListUntil.linkAfter(spaceNode, rightNode);    

        this.modification.push({
            current: [leftNode, rightNode],
            origin: [source, source]
        })
        
        this.initOperation();
        this.pointer.row ++;
        this.pointer.col = spaceNode.text.length;
        this.pointer.len = Util.measureCharLen(spaceNode.text);
        // this.pointer.node = new EdittingNode(rightNode, 0);
       
        this.refreshCode();
    }
    
    resetInput() {
        this.pointer.node.left += this.pointer.node.input;
        this.inputBoxRef.current.value = this.pointer.node.input = '';
    }

    componentWillReceiveProps (nextProps) {
        this.code = nextProps.code;
        this.renderCode(this.code);
    }

    componentDidMount() {
        this.operations = [
            {
                name: '复制',
                iconClass: 'fa-solid fa-copy',
                shortCut: 'Ctrl + C',
                onClick: () => {
                    this.onCopy();
                    this.closeMenu();
                }
            },
            {
                name: '粘贴',
                iconClass: 'fa-solid fa-paste',
                shortCut: 'Ctrl + V',
                onClick: () => {
                    this.onPaste();
                    this.closeMenu();
                }
            },
            {
                name: '剪切',
                iconClass: 'fa-solid fa-scissors',
                shortCut: 'Ctrl + X',
                onClick: () => {
                    this.onCut();
                    this.closeMenu();
                }
            }
        ]
        this.context.events.currentFileChange.subscribe((file: FileObject) => {
            if (file.headRenderNode) {
                this.ast = file.ast;
                this.renderNodeHead = this.headNode = file.headRenderNode;
                this.forceUpdate();
            } else {
                this.refresh(file);
            }
        })
        this.context.events.refresh.subscribe((file: FileObject) => {
            this.refresh(file);
        })
        this.context.events.search.subscribe(() => {
            this.isSearching = true;
            this.forceUpdate();
        })
    }

    refresh(file: FileObject) {
        this.context.api.getFile(file.path).then(res => {
            this.code = res.data.data;
            this.renderCode(this.code);
        })
    }

    getNewFile(path: string) {

    }
    
    setCursorFlash() {
        if (this.terminateFlash) this.terminateFlash();
        let stop = false;
        let doFlash = () => {
            setTimeout(() => {
                if (stop) return;
                this.setState({hideCursor: !this.state.hideCursor})
                doFlash();
            }, 500)
        }
        doFlash();
        return function() {
            stop = true;
        }
    }

    stringify(head: CodeRenderNode, tail: CodeRenderNode) {
        let str: string = CodeRenderer.stringify.apply(CodeRenderer, this.applyModification([head, tail]));
        this.removeModification();
        return str;
    }

    refreshCode(left?: CodeRenderNode, right?: CodeRenderNode) {
        if (!this.pointer) return;
        let currentNode = this.pointer.node.source;
        let {curLeftNode, curRightNode, curLeftBoundary, curRightBoundary} = Util.riseToSameBlock(left || currentNode, right || currentNode.nextNode);
        let block = curLeftNode.block;
        let newCode = this.stringify(curLeftNode, curRightNode);
        let {startIndex, endIndex} = Util.getIndexs(curLeftBoundary, curRightBoundary, block.body)    
        let ast = new JavascriptAstParsser(newCode).parse(false);   
        let renderNodeHead: CodeRenderNode;

        if (this.curOperation) {
            this.curOperation.index = startIndex;
            this.curOperation.block = block;
            this.curOperation.hisRenderNodeHead = curLeftNode;
            this.curOperation.hisRenderNodeTail = curRightNode;
        }    
        
        // let ast: JavascriptAst,
        //     endIndex = curRightNode.block.body.findIndex(node => node === curRightBoundary.node);
        // endIndex = endIndex >= 0 ? endIndex : curRightNode.block.body.length;    
         
        if (this.curOperation) {
            this.curOperation.currentAstNodes = ast.topLevelBlock.body;
            this.curOperation.prevAstNodes = startIndex === null ? [] : block.body.splice(startIndex, curRightNode.id !== curLeftNode.id ? endIndex - startIndex : 1, ...ast.topLevelBlock.body);
        }  else if (startIndex !== null) {
            block.body.splice(startIndex, curRightNode.id !== curLeftNode.id ? endIndex - startIndex : 1, ...ast.topLevelBlock.body)
        }

        this.reAnalyze(block); 

        renderNodeHead = new CodeRenderer(newCode, ast).render(block).nextNode;
        Util.boundaryLinkedListUtil.unlinked(renderNodeHead.prevNode.boundary);
        Util.identifierLinkedListUtil.unlinked(renderNodeHead.prevNode);
        Util.nodeLinkedListUntil.unlinked(renderNodeHead.prevNode);

        this.insertRenderNodes(renderNodeHead, curLeftNode.prevNode, curRightNode.nextNode);
        
        if (!newCode && !renderNodeHead.prevNode.lineEnd) { // 因为newCode为null，所以为删除代码操作，此时如果renderNodeHead不是行首的node则为无意义的node 
             CodeRenderNodeUtil.unlinkNode(renderNodeHead);
        } 
        if (this.headNode.prevNode.lineEnd) {
            let tailNode = new CodeRenderNode('');
            tailNode.boundary = this.headNode.prevNode.boundary;
            tailNode.scope = this.headNode.prevNode.scope;
            tailNode.block = this.headNode.prevNode.block;
            Util.nodeLinkedListUntil.insertAfter(this.headNode.prevNode, tailNode);
            this.headNode.boundary.prevNode = tailNode; 
        }
        
        if (this.patchOperation) this.patchOperation()
        this.pushOperation();
        this.patchOperation = this.curOperation = null;
        renderNodeHead && this.checkIdentifier(Util.nodeLinkedListUntil.find(renderNodeHead, node => node.identifier && node.block));
        this.modification = [] // 代码已完成更新，清除modification列表
        
        this.forceVisible();
        this.forceUpdate(() => {// render 函数执行后node的row和col属性更新
            let head = curLeftNode.prevNode;
            this.updatePointer(head);
            if(this.hasSelection()) {
                this.updateSelectionVetexNode(head, curRightNode.nextNode);
                this.resetSelectedZone();
            }
            if (this.isSearching) {
                this.onSearch();
            }
            this.forceUpdate();// todo: 优化
        });
    }

    insertRenderNodes(
        head: CodeRenderNode | null,
        left: CodeRenderNode,
        right: CodeRenderNode,
    ) {
        if (head) {
            CodeRenderNodeUtil.insertNodes(head, head.prevNode, left, right) // 因为head 是环形链表的第一个,所以head.prevNode 即为tail
        } else {
            CodeRenderNodeUtil.linkNodes(left, right) // 删除代码
        }

    }

    forceVisible() {
        this.forcePointerVisible = true;
        if ((this.forceVisible as any).timer) clearTimeout((this.forceVisible as any).timer);
        (this.forceVisible as any).timer = setTimeout(() => {
            this.forcePointerVisible = false;
            (this.forceVisible as any).timer = null;
        }, 200)
    }

    reAnalyze(block) {
        new JavascriptScopeAnalyzer().analyze(block, block.scope.parent);
    }

    checkIdentifier(headIdentifier: CodeRenderNode) {
        if (headIdentifier) {
            let iterator = (node: CodeRenderNode) => {
                if (!node.block || node.block.depth < headIdentifier.block.depth) {
                    return true
                }
                if (node.checkScope) {
                    CodeRenderer.checkScope(node)
                }
            }
            Util.identifierLinkedListUtil.findReversely(headIdentifier, iterator);
            Util.identifierLinkedListUtil.find(headIdentifier.nextIdentifier, iterator);
        }   
    }

    updatePointer(headNode: CodeRenderNode) {
        let curNode = Util.nodeLinkedListUntil.find(headNode, node => 
            node.row === this.pointer.row &&
            node.col <= this.pointer.col && node.col + node.text.length >= this.pointer.col
        );
        this.pointer.node = new EdittingNode(curNode, this.pointer.col - curNode.col);
        this.updateCharLength(); // todo：优化：updateCharLength 统一只在这里调用
    }

   
    renderCode(code:string) {
        if (code == null) return;
        let renderNodeHead, identifierHead, globalScope = new Scope();
        globalScope.addDefinitions(getGlobalDefinitions(globalScope) as any);
        globalScope.addDefinition(getConsoleDefinition(globalScope));
        debugger;
        this.ast = new JavascriptAstParsser(code).parse();
        this.ast.topLevelBlock.scope.parent = globalScope;
        this.renderNodeHead = renderNodeHead = new CodeRenderer(code, this.ast).render();
        identifierHead = new LinkedListUtil('prevNode', 'nextNode').find(renderNodeHead, node => node.identifier);
        Util.identifierLinkedListUtil.forEach(identifierHead, node => node.checkScope && CodeRenderer.checkScope(node));
        this.headNode = renderNodeHead;
        this.context.store.currentFile.headRenderNode = this.headNode;
        this.context.store.currentFile.ast = this.ast;
        this.forceUpdate();
    }

    onBlur() {
        
    }

    hasSelection() {
        return this.selection &&
            (this.selection.from.row !== this.selection.to.row || this.selection.from.col !== this.selection.to.col)
    }

    deleteSelection() {
        if (!this.hasSelection()) {
            this.selection = null;
            return false;
        }

        let vertex = this.doDeleteSelection();
        this.updateCharLength();
        this.setState({hideCursor: false});
        this.terminateFlash = this.setCursorFlash();
        this.refreshCode(vertex.left.source, vertex.right.source);
        return true;
    }

    doDeleteSelection() {
        let left = this.selection.from, 
            right = this.selection.to;

        if (this.selection.direction === 'left') {
            left = this.selection.to;
            right = this.selection.from;
        }     
        
        this.mergeEdit = 0;
        this.initOperation();
        
        if (left.editting.id === right.editting.id) {
            left.editting.text = left.editting.text.slice(0, left.col - left.editting.col) + left.editting.text.slice(right.col - right.editting.col);
        } else {
            Util.nodeLinkedListUntil.linkAfter(left.editting, right.editting);
            left.editting.text = left.editting.text.slice(0, left.col - left.editting.col);
            right.editting.text = right.editting.text.slice(right.col - right.editting.col);
        }

        this.modification.push({
            current: [left.editting, right.editting],
            origin: [left.source, right.source]
        })
        
        this.bgBlock1Style = {};
        this.bgBlock2Style = {};

        let offset = left.col - left.editting.col;
        this.pointer = {
            row: left.row,
            col: left.col,
            node: new EdittingNode(left.source, offset),
            len: null
        }

        this.pointer.node.editting = left.editting;
        this.pointer.node.left = left.editting.text.slice(0, offset);
        this.pointer.node.right = left.editting.text.slice(offset);

        this.selection = null;
        return {left, right};
    }

    onCopy() {
        if (!this.hasSelection()) return;
        let vertexs = this.getSelectionVertex();
        let left = vertexs[0];
        let right = vertexs[1]; 

        if (left.editting.id === right.editting.id) {
            this.clipboard = left.editting.text.slice(left.col - left.editting.col, right.col - right.editting.col);
        } else {
            let leftText = left.editting.text.slice(left.col - left.editting.col);
            let rightText = right.editting.text.slice(0, right.col - right.editting.col);
            if (left.editting.nextNode.id === right.editting.id) {
                this.clipboard = leftText + rightText;
            } else {
                this.clipboard = leftText + CodeRenderer.stringify(left.editting.nextNode, right.editting.prevNode) + rightText;
            }
        }
    }

    onCut() {
        if (this.hasSelection()) {
            this.onCopy();
            this.deleteSelection();
        } else { // 没有选中区域时剪切光标所在的行
            let start: CodeRenderNode = Util.getLineStart(this.pointer.node.source);
            let lineEnd = Util.nodeLinkedListUntil.find(start, (node: CodeRenderNode) => node.lineEnd || node.nextNode.isHead);
            let lineEnd2 = Util.cloneCodeRenderNode(lineEnd);
            let start2 = Util.cloneCodeRenderNode(start);
            Util.nodeLinkedListUntil.linkAfter(start2, lineEnd2);
            lineEnd2.lineEnd = false;
            start2.lineEnd = false;
            lineEnd2.text = '';
            start2.text = '';

            this.initOperation();

            this.pointer.col = 0;
            if (lineEnd.nextNode.isHead) this.pointer.row = Math.max(0, this.pointer.row - 1);
            this.modification.push({
                current: [start2, lineEnd2],
                origin: [start, lineEnd]
            });
            this.refreshCode(start, lineEnd);
        }
    }

    onPaste() {
        this.onInput(null, true);
    }

    onClick(e) {
        
    }

    onMousedown(node: CodeRenderNode, e: any) {
        if (!this.renderNodeHead) return;
        this.closeHintBox();
        if (e.button === 0) { // 鼠标左键点击
            e.preventDefault();
            e.stopPropagation();

            node = node || this.headNode.prevNode;
            this.unSetSelectedZone();
            this.isSelecting = true;
            this.resetPointer(node, e.nativeEvent.target.offsetLeft + e.nativeEvent.offsetX);
            this.setState({hideCursor: false});
            this.terminateFlash = this.setCursorFlash();
            this.focusInput();
            this.selection = {
                from: {
                    row: this.pointer.row,
                    col: this.pointer.col,
                    source: this.pointer.node.source,
                    editting: Util.cloneCodeRenderNode(this.pointer.node.source),
                    len: this.pointer.len
                },
                to: {
                    row: this.pointer.row,
                    col: this.pointer.col,
                    source: this.pointer.node.source,
                    editting: Util.cloneCodeRenderNode(this.pointer.node.source),
                    len: this.pointer.len
                },
                direction: 'right',
            }

            this.forceUpdate();
        }
    }

    onMouseup(e) {
        this.isSelecting = false;
        if (e.button === 2) {
            this.setState({
                menuVisible: true,
                menuPos: {
                    left: e.clientX + 10,
                    top: e.clientY + 10
                }
            })
        }
    }


    onMousemove(node: CodeRenderNode, e: any) {
        if (!this.isSelecting) return;
        e.stopPropagation();
        node = node || this.headNode.prevNode;
        this.resetPointer(node, e.nativeEvent.target.offsetLeft + e.nativeEvent.offsetX);
        this.updateSelectedZone();
        this.forceUpdate();
    }

    updateSelectedZone() {
        if (!this.selection) return;
        let getIterator = (backgroundValueGetter: Function) => {
            return (node: CodeRenderNode) => {
                if (node.id === this.pointer.node.source.id) return true;
                let bg = backgroundValueGetter(node);
                node.style = {
                    background: bg,
                    color: node.style && node.style.color
                }  
                if (!bg) { //选中区域缩减
                    node.displayText = [{
                        text: node.text,
                        style: {
                            color: node.style?.color
                        }
                    }]
                    node.selected = false
                } else {
                    node.displayText = Util.showUpSpace(node)
                    node.selected = true;
                }
            }
        } 

        if (this.selection.direction === 'left') {
            if (Util.isPositionGreater(this.selection.to, this.pointer)) {
                Util.nodeLinkedListUntil.find(this.selection.to.source, getIterator((node) => {
                    if(Util.isPositionGreater(this.selection.from.source, node)) return selectionBgColor
                    return null;
                }))
            } else {
                Util.nodeLinkedListUntil.findReversely(this.selection.to.source, getIterator(node => selectionBgColor))
            }
        } else {
            if (Util.isPositionGreater(this.selection.to, this.pointer)) {
                this.nodeLinkedListUtil.find(this.selection.to.source, getIterator(node => selectionBgColor))
            } else {
                Util.nodeLinkedListUntil.findReversely(this.selection.to.source, getIterator(node => {
                    if(Util.isPositionGreater(node, this.selection.from.source)) return selectionBgColor
                    return null;
                }))
            }
        }

        this.selection.to = {
            row: this.pointer.row,
            col: this.pointer.col,
            source: this.pointer.node.source,
            editting: Util.cloneCodeRenderNode(this.pointer.node.source),
            len: this.pointer.len
        }
        this.selection.direction = Util.isPositionGreater(this.selection.from, this.selection.to) ? 'right' : 'left';
        this.resetSelectionVertex();
    }

    resetSelectedZone() {
        if (!this.hasSelection()) return;
        const vertexs = this.getSelectionVertex('source');
        Util.nodeLinkedListUntil.forEach(vertexs[0], (node: CodeRenderNode) => {
            if (node.id !== vertexs[0].id && node.id !== vertexs[1].id) {
                node.style = Object.assign({}, node.style, {background: selectionBgColor});
                node.displayText = Util.showUpSpace(node);
                node.selected = true;
            } 
        }, vertexs[1])
        this.resetSelectionVertex();
    }

    unSetSelectedZone() {
        if (!this.selection || 
            this.selection.from.row === this.selection.to.row && this.selection.from.col === this.selection.to.col
        ) return;

        let direction = this.selection.direction;
        let left = direction === 'left' ? this.selection.to.source : this.selection.from.source;
        let right = direction === 'left' ? this.selection.from.source : this.selection.to.source;
        Util.nodeLinkedListUntil.find(left, node => {
            node.style = {
                color: node.style?.color
            }
            node.displayText = [{
                text: node.text,
                style: node.style
            }]
            node.selected = false;
            if (node.id === right.id) return true;
        });
        this.bgBlock1Style = {};
        this.bgBlock2Style = {};
        this.selection = null;
    }

    showUpVertextSpace() {
        let vertexs = this.getSelectionVertex();
        if (vertexs[0].source.id === vertexs[1].source.id) {
            let node = vertexs[0].source;
            node.displayText = Util.showUpSpace(node, vertexs[0].col - node.col, vertexs[1].col - node.col);
        } else {
            let leftNode = vertexs[0].source, rightNode = vertexs[1].source;
            leftNode.displayText =  Util.showUpSpace(leftNode, vertexs[0].col - leftNode.col);
            rightNode.displayText = Util.showUpSpace(rightNode, 0, vertexs[1].col - rightNode.col);
        }
    }

    resetSelectionVertex() {
        if(!this.selection) return;
        let leftNode = this.selection.from.source, rightNode = this.selection.to.source, direction = this.selection.direction;
        leftNode.style = {color: leftNode.style.color};
        rightNode.style = {color: rightNode.style.color};
        if (leftNode.id === rightNode.id) {
            this.bgBlock2Style = {};
            this.bgBlock1Style = {
                left: direction === 'left' ? this.selection.to.len + 80 + 'px' : this.selection.from.len + 80 + 'px', 
                top: 24 * (this.selection.to.row - 1) + 'px',
                height: '24px',
                background: selectionBgColor,
                width: direction === 'left' ?
                 Util.measureCharLen(leftNode.text.slice(this.selection.to.col - leftNode.col, this.selection.from.col - leftNode.col)) + 'px' :
                 Util.measureCharLen(leftNode.text.slice(this.selection.from.col - leftNode.col, this.selection.to.col - leftNode.col)) + 'px'
            }
        } else {
            let leftVertex = this.selection.from, rightVertex = this.selection.to
            leftNode.style = {
                color: leftNode.style.color
            };
            rightNode.style = {
                color: rightNode.style.color
            }

            if (direction === 'left') {
                leftVertex = this.selection.to;
                rightVertex = this.selection.from;
            } 

            let bgBlock2Len = Util.measureCharLen(rightVertex.source.text.slice(0, rightVertex.col - rightVertex.source.col));
            this.bgBlock1Style = {
                left: leftVertex.len + 80 + 'px',
                top: 24 * (leftVertex.row - 1) + 'px',
                height: '24px',
                background: selectionBgColor,
                width: Util.measureCharLen(leftVertex.source.text.slice(leftVertex.col - leftVertex.source.col)) + 'px'
            };
            this.bgBlock2Style = {
                left: rightVertex.len - bgBlock2Len + 80 + 'px',
                top: 24 * (rightVertex.row - 1) + 'px',
                height: '24px',
                width: bgBlock2Len + 'px',
                background: selectionBgColor,
            }
        }
        this.showUpVertextSpace();
    }

    resetPointer(node: CodeRenderNode, offsetX: number) {
        if (!this.pointer) this.pointer = {
            row: null,
            col: null,
            len: null,
            node: null
        }
        let offset = Util.measureOffset(offsetX, node.text);
        this.setPointerLocation(node.row, node.col + offset);
        this.pointer.node = new EdittingNode(node, offset);
        this.updateCharLength();
    }

    setPointerLocation(row: number, col: number) {
        this.pointer.row = row;
        this.pointer.col = col;
    }

    updateCharLength() {
        let node = this.applyModification([this.pointer.node.source])[0]; // 把编辑后的节点插入到链表
        this.pointer.len = Util.getCharLenFromRowHead(node, this.pointer.col);
        this.removeModification() // 将链表恢复
    }

    focusInput() {
        this.inputBoxRef.current.focus();
    }

    getStatic(node: any, rowndex: number) {
        const getCodeSpan = (item) => (
            <span 
                className={[
                    "code-node", 
                    node.err ? 'wavy-line-decoration' : '',
                    !node.err && node.unuse ? 'unuse-node' : ''
                ].join(' ')}
                style={item.style || {}} 
                dangerouslySetInnerHTML={{ __html: item.text.replace(/\s/g, '&nbsp;')}}></span>
        )
        const getSearchResultDiv = (item) => {
            return (
                <div className='search-result-div' style={{
                    left: item.left,
                    background: item.node.selected ? '#665350' :  item.focused ? '#515C6A' : null,
                    top: 0,
                    bottom: 0,
                    width: item.len
                }}></div>
            )
        }
        return (
            <div 
                className="code-node-container"
                style={node.style}
                onMouseDown={(e) => {this.onMousedown(node, e)}}
                onMouseMove={(e) => {this.onMousemove(node, e)}}
            >
                {
                    node.displayText.map(getCodeSpan)
                }
                {
                    node.searchResult.map(getSearchResultDiv)
                }
                {
                    node.err ? 
                    (<ErrorMsgBlock 
                        msg={node.msg} 
                        className={rowndex > 5 ? ' up-positioin' : ' down-position'}
                    ></ErrorMsgBlock>) : ''
                }
            </div>
        ) 
    }

    isEdittingNode(node: CodeRenderNode) {
        return this.pointer?.node?.source.id === node.id; 
    }

    getNodeElements() {
        let curNode = this.headNode, 
            headNode = this.headNode,
            spaceMatcher = /[^ ]+/,
            spaceCount = 0,
            meetChar = false,
            tapIndex = 0,
            tapLineElements = [],
            lastTapCount = 0,
            elements = [], rowIndex = 0, colIndex;

        let gTabLine = (tabCount: number) => {
            for(let i = 0; i <= tabCount; i++) {
                let style = {
                    left: Util.charSize * i * 4 + 80 + 'px'
                }
                tapLineElements.push((
                    <div className='tap-line' style={style}></div>
                ))
            }
        }    

        let getInlineElements = () => {
            let inlineElements = [];
            do {
                if (!meetChar && curNode.text.length) {// 收集行首空白符用于生成制表符对齐线
                    let matchResult = spaceMatcher.exec(curNode.text);
                    if (matchResult) {
                        spaceCount += matchResult.index;
                        meetChar = true;
                    } else {
                        spaceCount += curNode.text.length;
                    }
                }

                curNode.row = rowIndex;
                curNode.col = colIndex;
                inlineElements.push(this.getStatic(curNode, rowIndex));
                colIndex += curNode.text.length;
                curNode = curNode.nextNode;
                if (curNode.prevNode.lineEnd) { // 到了行尾
                    if (spaceCount && meetChar) {
                        let remainder = spaceCount % 4;
                        let tapCount = ( spaceCount - remainder ) / 4;
                        gTabLine(tapCount);
                        if (!remainder) tapLineElements.pop();
                    } else if (!meetChar) {
                        gTabLine(lastTapCount - 1);
                    }
                    lastTapCount = tapLineElements.length;
                    break
                };
            } while(curNode && curNode.id !== headNode.id);
            return inlineElements;
        }
        do {
            colIndex = 0;
            let lineEndNode: CodeRenderNode;
        
            rowIndex ++;
            spaceCount = 0;
            meetChar = false;
            tapIndex = 0;
            tapLineElements = [];
            
            let rowStyle = {
                background: rowIndex === this.searchResult[this.focusedSearchResult]?.node.row ? '#272727' : null
            }
            elements.push(
                <li 
                    className={[
                        "flex flex-v-center row-item",
                        !this.hasSelection() && this.pointer && this.pointer.row === rowIndex ? 'selected-row' : ''
                    ].join(' ')} 
                    onMouseMove={(e) => {this.onMousemove(lineEndNode, e)}}
                    onMouseDown={(e) => {this.onMousedown(lineEndNode, e)}}
                >
                    <div className="line-index"><span>{rowIndex}</span></div>
                    <div className="line-content" style={rowStyle}>
                        {getInlineElements()}
                    </div>
                    {tapLineElements}
                </li>
            )
            lineEndNode = curNode.prevNode;
        } while (curNode && curNode.id !== headNode.id)
        return elements;
    }

    @MergeCall(100)
    getCodeHints() {
        if (this.pointer.node.source.text) {
            this.hintInfo.hintItems = Util.sortDefinitions(Util.MatchDefinition(this.pointer.node.source));
        }
        this.forceUpdate();
    }

    onSearch() {
        this.clearSearch();
        let content = '', 
            searchStr = this.searchBoxRef.current.value.toLowerCase(), 
            searchStrRows = searchStr.split('\n'),
            searchStrLen = searchStr.length, 
            tailNodes = [];
        Util.nodeLinkedListUntil.forEach(this.headNode, (node: CodeRenderNode) => {
            content = content + node.text.toLowerCase();
            if (node.lineEnd) {
                content += '\n';
                tailNodes.push(node);
            } 
            if (content.length >= searchStrLen) { // node text合成的字符串长度至少要大于或等于搜索字符串才有可能匹配成功
                let index = content.indexOf(searchStr);
                if (index > -1) {
                    let contentRows = content.split('\n'), searchResult = [];
                    if (!contentRows[contentRows.length - 1]) contentRows.pop() // 如果当前的node正好为line end，会导致contentRows最后一个元素为空字符串, 该空字符串回到接下来的for循环操作出错,所以要pop掉
                    if (!tailNodes.length || tailNodes[tailNodes.length - 1].id !== node.id) {
                        tailNodes.push(node)
                    }
                    for(let i = searchStrRows.length - 1; i > -1; i--) {
                        let contentRow = contentRows.pop(), searchStrRow = searchStrRows[i], tailNode = tailNodes.pop();
                        let nodeStart = contentRow.length - tailNode.text.length; // node text在content中的开始位置
                        let matchedIndex = contentRow.indexOf(searchStrRow);
                        let len = searchResult.push({
                            index: matchedIndex,
                            content: contentRow,
                            searchStr: searchStrRow,
                            node: tailNode,
                            focused: false,
                            len: Util.measureCharLen(searchStrRow),
                            left: - (Util.measureCharLen(searchStrRow.slice(0, nodeStart - matchedIndex)))
                        })
                        tailNode.searchResult.push(searchResult[len - 1]);
                    }
                    while(searchResult.length) {
                        this.searchResult.push(searchResult.pop());
                    }
                    let lastSearchResult = this.searchResult[this.searchResult.length - 1]; 
                    content = lastSearchResult.content.slice(lastSearchResult.index + lastSearchResult.searchStr.length);

                    if (content && node.lineEnd) {
                        tailNodes = [node]
                    } else {
                        tailNodes = []
                    }
                } else {
                    content = content.slice(- (searchStrLen - 1)) // 也许给content末尾添加一个字符就会匹配成功，所以截取content尾端长度为搜索字符串长度减一的片段继续与下一个节点合并后再匹配
                }
            } 
        })
        if (this.searchResult.length) {
            this.searchResult[0].focused = true;
            this.focusedSearchResult = 0;
        } 
        this.forceUpdate();
    }

    clearSearch() {
        this.searchResult.forEach(item => {
            item.node.searchResult = [];
        }) 
        this.searchResult = [];
        this.focusedSearchResult = 0;
    }

    onSelectedHintItem(item) {
        this.mergeEdit = 0;
        let text = item.definition.identifier //hisNode: CodeRenderNode = Util.cloneCodeRenderNode(this.pointer.node.source), curNode;

        this.initOperation();
        this.pointer.col -= (this.pointer.node.input.length + this.pointer.node.left.length);
        if (this.pointer.node.editting.text && this.pointer.node.editting.text !== '.' ) {
            this.pointer.node.left = this.pointer.node.right = '';
        }
        this.pointer.node.input = text;
        this.pointer.node.update();
        this.modification.push({
            current: this.pointer.node.editting,
            origin: this.pointer.node.source
        })
        for(let i = 0, len = this.pointer.node.editting.text.length; i < len; i++) {
            this.onArrowRight();
        }
        this.closeHintBox();
        this.refreshCode();
    }

    closeHintBox() {
        this.hintInfo.hintItems = [];
        this.hintInfo.focus = 0;
    }

    renderCodeHints() {
        let renderHintItem = () => {
            return this.hintInfo.hintItems.map((item, index) => {
                return (<li className={this.hintInfo.focus === index ? 'focus' : ''} onClick={this.onSelectedHintItem.bind(this,item)}>
                    <span>{item.textLeft}</span>
                    <span className='match-text'>{item.text}</span>
                    <span>{item.textRight}</span>
                </li>)
            })
        }
        
        return (<div className="code-hints" onMouseDown={(e) => {e.stopPropagation()}} style={{left: this.pointer.len + 80 +'px', top: 24 * (this.pointer.row )}}>
            <ul>{renderHintItem()}</ul>
        </div>)
    }

    onCloseSearchBox() {
        this.clearSearch();
        this.isSearching = false;
        this.forceUpdate();
    }

    closeMenu() {
        this.setState({
            menuVisible: false
        })
    }

    render() {
        let cursor = () => (
            <div 
                className={[
                    'cursor',
                    this.state.hideCursor ? '' : 'visible',
                    this.forcePointerVisible ? 'force-visible' : ''
                ].join(' ')} ref={this.cursorRef} style={{left: this.pointer.len + 80 +'px', top: 24 * (this.pointer.row - 1)}}
                onMouseMove={(e) => e.stopPropagation()}
            ></div>
        )
        return (
            <div className="code-snippet" 
                onMouseUp={(e) => {this.onMouseup(e)}} 
                onMouseMove={(e) => {this.onMousemove(null, e)}}
                onMouseDown={(e) => {this.onMousedown(null, e)}}>
                
                {this.headNode ? (<ul onMouseMove={(e) => e.stopPropagation()}>
                    {this.getNodeElements()}
                </ul>) : ''}  
                {this.hintInfo.hintItems?.length ? this.renderCodeHints() : ''}
                <input className="code-input-box" ref={this.inputBoxRef} onInput={this.onInput.bind(this)} type="text" />
                {this.pointer ? cursor() : ''}
                <div className="bg-block1 bg-block" style={this.bgBlock1Style}></div>
                <div className="bg-block2 bg-block" style={this.bgBlock2Style}></div>
                {this.isSearching ? (
                    <div className='search-box' onMouseDown={(e) => e.stopPropagation()}>
                        <textarea ref={this.searchBoxRef}></textarea>
                        <button className='controll-btn' onClick={this.onSearch.bind(this)}>
                            <i className='fa-solid fa-magnifying-glass'></i>
                            <span>搜索</span>
                        </button>
                        <i className='fa-solid fa-arrow-down icon-btn' onClick={this.onFocusNextSearchResult.bind(this)}></i>
                        <i className='fa-solid fa-arrow-up icon-btn' onClick={this.onFocusPrevSearchResult.bind(this)}></i>
                        <i className='fa-solid fa-xmark icon-btn' onClick={this.onCloseSearchBox.bind(this)}></i>
                    </div>
                ) : null}
                {this.state.menuVisible && (<OperationMenu
                    menuPosition={this.state.menuPos}
                    operations={this.operations}
                    onCoverClick={this.closeMenu.bind(this)}
                ></OperationMenu>)}
            </div>
        )
    }
}
CodeSnippet.contextType = MyContext;
