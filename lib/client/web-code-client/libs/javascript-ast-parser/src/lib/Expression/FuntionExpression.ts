import { Block } from "javascript-ast-parser/src/Block";
import { NodeCode } from "javascript-ast-parser/src/constants";
import { Expression } from "./Expression";
import { IdentifierLiteralExpression } from "./IdentifierLiteralExpression";

export class FunctionExpression extends Expression {
    type = 'FunctionExpression';
    code = NodeCode.FunctionExpression;
    params: IdentifierLiteralExpression[] = [];
    body: Block;
    constructor(currentToken: any) {
        super()
        this.loc.start= currentToken.loc.start;
    }
}