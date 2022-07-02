import { Block } from "javascript-ast-parser/src/Block";
import { NodeCode } from "javascript-ast-parser/src/constants";
import { Expression } from "./Expression";
import { IdentifierLiteralExpression } from "./IdentifierLiteralExpression";

export class BracketEnwrapedExpressioin extends Expression {
    type = 'BracketEnwrapedExpressioin';
    code = NodeCode.BracketEnwrapedExpressioin;
    expression: Expression;
    constructor(currentToken: any) {
        super()
        this.loc.start= currentToken.loc.start;
    }
}