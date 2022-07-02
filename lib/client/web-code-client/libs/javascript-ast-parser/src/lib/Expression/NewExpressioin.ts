import { CallExpression } from "./CallExpression";
import { IdentifierLiteralExpression } from "./IdentifierLiteralExpression";
import { NodeCode } from "../../constants";
import { Expression } from "./Expression";

export class NewExpressioin extends Expression {
    type = 'NewExpressioin';
    code = NodeCode.NewExpression;
    callee: CallExpression | IdentifierLiteralExpression;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start
    }
}