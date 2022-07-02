import { NodeCode } from "javascript-ast-parser/src/constants";
import { AstNode } from "../AstNode";
import { Statement } from "./Statement";

export class UnExpectStatement extends Statement {
    type = 'UnExpectStatement';
    code = NodeCode.UnexpectStatement;
    constructor(public value?: any, public msg?: string, loc?: any) {
        super();
        if (loc) {
            Object.assign(this.loc, loc);
        } else if (value && value instanceof AstNode) {
            this.loc.start = value.loc.start;
            this.loc.end = value.loc.end;
        }
    }
}