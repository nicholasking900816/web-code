import { NodeCode } from "../../constants";
import { AstNode } from "../AstNode";
import { Expression } from "./Expression";

export class RegExpressioin extends Expression {
    pattern: string;
    type = 'RegExpressioin';
    code = NodeCode.RegExpression;
    flag: string;
    constructor(currentToken: any) {
        super();
        this.loc.start = currentToken.loc.start;
        // this.pattern = currentToken.value;
    }
}