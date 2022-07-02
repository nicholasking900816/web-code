import { AstNode } from "./lib/AstNode";

export class Block {
  body: AstNode[] = [];
  scope: any;
  depth: number;
  loc: {start: number, end: number};
  functionBlock = false;
  constructor() {}
}