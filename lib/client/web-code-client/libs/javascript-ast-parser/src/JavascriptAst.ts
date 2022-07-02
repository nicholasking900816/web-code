import { Block } from './Block';
export class JavascriptAst {
  topLevelBlock: Block;
  constructor() {
    this.topLevelBlock = new Block();
  }

}