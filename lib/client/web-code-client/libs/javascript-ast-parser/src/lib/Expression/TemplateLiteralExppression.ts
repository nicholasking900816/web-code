import { NodeCode } from "../../constants";
import { Expression } from "./Expression";

export class TemplateLiteralExppression extends Expression {
    type: string = 'TemplateLiteralExppression';
    code = NodeCode.TemplateLiteralExpression;
    content: any[] = [];
    constructor(currentToken: any) {
        super()
        this.loc.start = currentToken.loc.start
    }
}