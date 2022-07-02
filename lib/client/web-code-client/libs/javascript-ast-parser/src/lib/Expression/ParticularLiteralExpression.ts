import { NodeCode } from "../../constants";
import { Expression } from "./Expression";

export class ParticularLiteralExpression extends Expression {
    type = 'ParticularLiteralExpression';
    code = NodeCode.ParticularLiteralExpression;
    raw: string;
    constructor(currentToken) {
        super();
        Object.assign(this.loc, currentToken.loc);
        this.raw = currentToken.value;    
    }
}