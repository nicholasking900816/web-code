import { Block } from "../../Block";
import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class SwitchCaseStatement extends Statement {
    type = 'SwitchCaseStatement';
    code = NodeCode.SwitchCaseStatement;
    consequent: Block;
    test: AstNode;
    isDefault = false;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
    }
}