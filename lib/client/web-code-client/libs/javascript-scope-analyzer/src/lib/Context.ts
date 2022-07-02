import { Definition } from "./Definition";

export class Context {
    definitions: Array<Definition>;
    parent: Context;
}