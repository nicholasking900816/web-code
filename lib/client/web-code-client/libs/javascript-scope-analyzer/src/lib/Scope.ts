import { AstNode } from "javascript-ast-parser/src/lib/AstNode";
import { Context } from "./Context";
import { Definition } from "./Definition";
import { v4 as uuidv4 } from 'uuid';

export class Scope {
    definitions: Array<Definition> = [];
    definitionsMap: any = {};
    context: Context = new Context();
    functionScope = false;
    exports: any = [];
    id: string;
    unusedDefination: Map<AstNode, Definition> = new Map();
    UndeclaredVariables: Set<any> = new Set();
    constructor(public parent?: Scope) {
        this.id = uuidv4();
    }

    addDefinition(definition: Definition) {
        this.definitions.push(this.definitionsMap[definition.identifier] = definition);
    }

    addDefinitions(definitions: Definition[]) {
        definitions.forEach(definition => this.addDefinition(definition))
    }

    getDefinition(identifier: string) {
        return this.definitionsMap[identifier] || (this.parent && this.parent.getDefinition(identifier) || null);
    }

    deleteUnuse(definition: Definition) {
        if (this.unusedDefination.has(definition.astNode)) {
            this.unusedDefination.delete(definition.astNode);
        } else if (this.parent) {
            this.parent.deleteUnuse(definition);
        }
    }

    addUnuse(definition: Definition) {
        this.unusedDefination.set(definition.astNode, definition);
    }

    isUnuse(definition: Definition) {
        return !!this.unusedDefination.get(definition.astNode);
    }

    fullMatchDefinition(text: string) {
        return this.definitionsMap[text] || this.fullMatchParentDefinitions(text);
    }

    matchParentDefinitions(text: string, near = 0) {
        if (this.parent) return this.parent.matchDefinitions(text, near);
        return []
    }

    fullMatchParentDefinitions(text: string) {
        if (this.parent) return this.parent.fullMatchDefinition(text);
        return []
    }

    matchOwnDefinitions(text: string, near = 0) {
        return this.definitions.reduce((result, definition) => {
            let index;
            if (definition.identifier !== text && (index = definition.identifier.indexOf(text)) > -1) {
                let textLeft = definition.identifier.slice(0, index),
                    textRight = definition.identifier.slice(index + text.length);
                result.push({
                    near: near,
                    definition : definition,
                    index: index,
                    text: text,
                    textLeft: textLeft,
                    textRight: textRight
                })
            }
            return result;
        }, [])
    }

    matchDefinitions(text: string, near = 0) {
        return this.matchOwnDefinitions(text, near).concat(this.matchParentDefinitions(text, near + 1));
    }
}