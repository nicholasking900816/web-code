import { Block } from "../../Block";
import { AstNode } from "../AstNode";
import { NodeCode } from "../../constants";
import { Statement } from "./Statement";

export class ForStatement extends Statement {
    type = 'ForStatement';
    code = NodeCode.ForStatement;
    init: AstNode;
    test: AstNode;
    update: AstNode[];
    forIn = false
    forOf = false
    body: Block;
    left: AstNode;
    right: AstNode;
    constructor(currentToken: any) {
        super()
        this.loc.start = currentToken.loc.start;
    }
}