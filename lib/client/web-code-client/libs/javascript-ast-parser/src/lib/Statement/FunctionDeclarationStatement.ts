import { Block } from "../../Block";
import { IdentifierLiteralExpression } from "../Expression/IdentifierLiteralExpression";
import { AstNode } from "../AstNode";
import { NodeCode } from "../../constants";
import { Statement } from "./Statement";

export class FunctionDeclarationStatement extends Statement {
    type = 'FunctionDeclarationStatement';
    code = NodeCode.FunctionDeclarationStatement;
    identifier: IdentifierLiteralExpression;
    params: IdentifierLiteralExpression[] = [];
    body: Block;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start
    }
}