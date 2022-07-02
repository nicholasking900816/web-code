import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Expression } from "./Expression";

export class ArrayLiteralExpression extends Expression {
    type = 'ArrayLiteralExpression';
    code = NodeCode.ArrayLiteralExpression
    items: AstNode[] = [];
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
    }
}