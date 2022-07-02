import { Block } from "../../Block";
import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class DoWhileStatement extends Statement {
    type = "DoWhileStatement";
    code = NodeCode.DoWhileStatement;
    body: Block;
    test: AstNode;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
    }
}