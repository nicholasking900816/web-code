import { NodeCode } from "javascript-ast-parser/src/constants";
import { AstNode } from "../AstNode";

export class Expression extends AstNode {
    static code = NodeCode.Expression
}