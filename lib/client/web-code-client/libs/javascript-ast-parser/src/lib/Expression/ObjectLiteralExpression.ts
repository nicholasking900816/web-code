import { IdentifierLiteralExpression } from "./IdentifierLiteralExpression";
import { AstNode } from "../AstNode";
import { StringLiteralExpression } from "./StringLiteralExpression";
import { Expression } from "./Expression";
import { NodeCode } from "javascript-ast-parser/src/constants";

export class ObjectLiteralExpression extends Expression {
    type = 'ObjectLiteralExpression';
    code = NodeCode.ObjectLiteralExpression
    properties: Array<{key: StringLiteralExpression | IdentifierLiteralExpression, value: AstNode}> = [];
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
    }
}