
export class AstNode {
    unexpectedNodes: any;
    type: string;
    code: number;
    isUnexpectEnd = false;
    loc: {start: number, end: number};
    scope: any;
    constructor() {
        this.unexpectedNodes = [];
        this.loc = {start: null, end: null};
    }
}