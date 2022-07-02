import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Expression } from "../Expression/Expression";

export class BreakStatement extends Expression {
    type = 'BreakStatement';
    code = NodeCode.BreakStatement;
    argument: AstNode;
    constructor(currentToken) {
        super();
        this.loc.start = currentToken.loc.start
    }
}