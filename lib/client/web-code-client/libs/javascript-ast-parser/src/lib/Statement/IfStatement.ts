import { Block } from "../../Block";
import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class IfStatement extends Statement {
    type = 'IfStatement';
    code = NodeCode.IfStatement;
    test: AstNode;
    alternate: IfStatement | Block;
    consequent: Block;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
    }
}