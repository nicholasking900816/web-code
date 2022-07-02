import { AstNode } from "../AstNode";
import { NodeCode } from "../../constants";
import { Expression } from "./Expression";

export class MemberExpression extends Expression {
    type = 'MemberExpression';
    code = NodeCode.MemberExpression;
    isComputed = false;
    constructor(public owner?: AstNode, public property?: AstNode) {
        super()
        this.loc.start = owner.loc.start;
    }
}