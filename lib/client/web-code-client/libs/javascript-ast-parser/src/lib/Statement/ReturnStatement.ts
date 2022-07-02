import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class ReturnStatement extends Statement {
    type = 'ReturnStatement';
    code = NodeCode.ReturnStatement;
    argument: AstNode;
    constructor(currentToken) {
        super();
        this.loc.start = currentToken.loc.start
    }
}