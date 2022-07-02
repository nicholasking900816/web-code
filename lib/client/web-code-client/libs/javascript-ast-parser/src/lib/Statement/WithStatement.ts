import { Block } from "../../Block";
import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class WithStatement extends Statement {
    type = 'WithStatement';
    code = NodeCode.WithStatement;
    context: AstNode;
    body: Block;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start
    }
}