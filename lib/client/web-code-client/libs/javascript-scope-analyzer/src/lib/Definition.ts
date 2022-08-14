import { NodeCode } from "javascript-ast-parser/src/constants";
import { AstNode } from "javascript-ast-parser/src/lib/AstNode";
import { IdentifierLiteralExpression } from "javascript-ast-parser/src/lib/Expression/IdentifierLiteralExpression";
import { ClassDeclarationStatement } from "javascript-ast-parser/src/lib/Statement/ClassDeclarationStatement";
import { FunctionDeclarationStatement } from "javascript-ast-parser/src/lib/Statement/FunctionDeclarationStatement";
import { Scope } from "./Scope";

export class Definition {
    identifier: string;
    definitions: Array<Definition> = [];
    type = 'Definition';
    arguments: Array<string> = []; 
    
    constructor(public astNode: AstNode, public definitionType: string, public definitionCode: number, public scope: Scope) {
        switch(astNode.code) {
            case NodeCode.AssignmentExpression:
                this.identifier = (<any>astNode).left.identifier;
                break;
            case NodeCode.IdentifierLiteralExpression:
                this.identifier = (<IdentifierLiteralExpression>astNode).identifier;
                break;
            case NodeCode.FunctionDeclarationStatement:
                this.identifier = (<FunctionDeclarationStatement>astNode).identifier.identifier;
                break;        
            case NodeCode.ClassDeclarationStatement:
                this.identifier = (<ClassDeclarationStatement>astNode).className.identifier
                break;   
        }
    }
}