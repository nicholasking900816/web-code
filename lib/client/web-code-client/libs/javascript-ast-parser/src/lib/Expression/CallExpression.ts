import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Expression } from "./Expression";

export class CallExpression extends Expression {
    type = 'CallExpression';
    code = NodeCode.CallExpression
    arguments: AstNode[] = [];
    constructor(public callee: AstNode) {
        super();
        this.loc.start = callee.loc.start;
    }
}