import { FunctionDeclarationStatement } from "./FunctionDeclarationStatement";
import { IdentifierLiteralExpression } from "../Expression/IdentifierLiteralExpression";
import { AstNode } from "../AstNode"
import { NodeCode } from "../../constants";
import { Statement } from "./Statement";

export class ClassDeclarationStatement extends Statement {
    type = 'ClassDeclarationStatement';
    code = NodeCode.ClassDeclarationStatement
    super: IdentifierLiteralExpression;
    className: IdentifierLiteralExpression;
    methods: FunctionDeclarationStatement[] = [];
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
    }
} 