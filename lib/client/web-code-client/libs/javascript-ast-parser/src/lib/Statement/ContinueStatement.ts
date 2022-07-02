import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class ContinueStatement extends Statement {
    type = 'ContinueStatement';
    code = NodeCode.ContinueStatement;
    argument: AstNode;
    constructor(currentToken) {
        super();
        this.loc.start = currentToken.loc.start
    }
}