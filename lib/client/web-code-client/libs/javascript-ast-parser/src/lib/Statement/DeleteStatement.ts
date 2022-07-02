import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class DeleteStatement extends Statement {
    type = 'DeleteStatement';
    code = NodeCode.DeleteStatement;
    argument: AstNode;
    constructor(currentToken) {
        super();
        this.loc.start = currentToken.loc.start
    }
}