import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode"
import { Statement } from "./Statement";

export class VariableDeclarationStatement extends Statement {
    type = 'VariableDeclarationStatement';
    code = NodeCode.VariableDeclarationStatement;
    declarationKeyWord: string;
    declarations: AstNode[] = [];
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
        this.declarationKeyWord = currentToken.value;
    }
}