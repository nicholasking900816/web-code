import { NodeCode } from "../../constants";
import { Expression } from "./Expression";

export class NumberLiteralExpression extends Expression {
    type = "NumberLiteralExpression";
    code = NodeCode.NumberLiteralExpression
    value: string;
    constructor(currentToken?: any) {
        super()
        Object.assign(this.loc, currentToken.loc);
        this.value = currentToken.value;
    }
}