import { CodeRenderNode } from "JavaScript-code-renderer/code-render-node";

export interface CodeSelection {
    from: {
        row: number,
        col: number,
        editting: CodeRenderNode,
        source: CodeRenderNode,
        len: number
    },
    to: {
        row: number,
        col: number,
        editting: CodeRenderNode,
        source: CodeRenderNode,
        len: number
    },
    direction: string,
}