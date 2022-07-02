import { NodeCode } from "javascript-ast-parser/src/constants";
import { Expression } from "./Expression";

export class TypeOfExpression extends Expression {
    type = 'TypeOfExpression';
    code = NodeCode.TypeOfExpression;
    argument: Expression
    constructor(currentToken) {
        super();
        this.loc.start = currentToken.loc.start
    }
}