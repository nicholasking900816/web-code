import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { IdentifierLiteralExpression } from "../Expression/IdentifierLiteralExpression";
import { StringLiteralExpression } from "../Expression/StringLiteralExpression";
import { Statement } from "./Statement";
import { VariableDeclarationStatement } from "./VariableDeclarationStatement";

export type ExportSpecifier = {
    exported: IdentifierLiteralExpression,
    local: IdentifierLiteralExpression
}

export class ExportDeclarationStatement extends Statement {
    type = 'ExportDeclarationStatement';
    code = NodeCode.ExportDeclarationStatement;
    declaration: VariableDeclarationStatement;
    exported: AstNode;
    local: IdentifierLiteralExpression;
    specifiers: Array<ExportSpecifier> = [];
    from: StringLiteralExpression;
    constructor(currentToken: any) {
        super()
        this.loc.start = currentToken.loc.start;
    }
}