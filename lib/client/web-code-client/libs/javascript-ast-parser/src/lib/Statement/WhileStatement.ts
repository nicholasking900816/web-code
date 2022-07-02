import { Block } from "../../Block";
import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class WhileStatement extends Statement {
    type = 'WhileStatement';
    code = NodeCode.WhileStatement;
    test: AstNode;
    consequence: Block;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start
    }
}