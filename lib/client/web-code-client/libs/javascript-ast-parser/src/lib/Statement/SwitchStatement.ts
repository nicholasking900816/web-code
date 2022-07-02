import { Block } from "../../Block";
import { SwitchCaseStatement } from "./SwitchCaseStatement";
import { AstNode } from "../AstNode";
import { NodeCode } from "../../constants";
import { Statement } from "./Statement";
import { Expression } from "../Expression/Expression";

export class SwitchStatement extends Statement {
    type = 'SwitchStatement';
    code = NodeCode.SwitchStatement
    cases: SwitchCaseStatement[] = [];
    discriminant: Expression;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
    }
}