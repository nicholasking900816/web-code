import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class ThrowStatement extends Statement {
    type = 'ThrowStatement';
    code = NodeCode.ThrowStatement;
    argument: AstNode;
    constructor(currentToken) {
        super();
        this.loc.start = currentToken.loc.start
    }
}