import { NodeCode, priorityMap } from "../../constants";
import { AstNode } from "../AstNode";
import { Expression } from "./Expression";

export class BinaryExpression extends Expression {
    type = 'BinaryExpression';
    code = NodeCode.BinaryExpression;
    operator: string;
    right: Expression;
    constructor(public left?: Expression) {
        super();
        if (left) {
            this.loc.start = left.loc.start;
        }
    }


}