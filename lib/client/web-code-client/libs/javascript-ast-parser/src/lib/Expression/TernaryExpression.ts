import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Expression } from "./Expression";

export class TernaryExpression extends Expression {
    type = 'TernaryExpression';
    code = NodeCode.TernaryExpression;
    constructor(public test?: AstNode, public consequent?: AstNode, public alternate?: AstNode) {
        super();
        this.loc.start = test.loc.start;
    }
}