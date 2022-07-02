import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Expression } from "./Expression";

export class UnaryExpression extends Expression {
    type = 'UnaryExpression';
    code = NodeCode.UnaryExpression;
    operator: string;
    argument: AstNode;
    prefix: boolean;
    suffix: boolean;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
        this.operator = currentToken.value;
    }
}