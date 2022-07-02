import { AstNode } from "../AstNode";
import { NodeCode } from "../../constants";
import { Expression } from "./Expression";

export class AssignmentExpression extends Expression {
    type = 'AssignmentExpression';
    code = NodeCode.AssignmentExpression;
    left: Expression;
    right: Expression;
    operator: string;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start
    }
}