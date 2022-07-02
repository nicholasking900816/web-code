import { NodeCode } from "../../constants";
import { Expression } from "./Expression";

export class StringLiteralExpression extends Expression {
    type = 'StringLiteralExpression';
    code = NodeCode.StringLiteralExpression;
    value: string;
    constructor(currentToken: any) {
        super();
        Object.assign(this.loc, currentToken.loc);
        this.value = currentToken.value;
    }
}