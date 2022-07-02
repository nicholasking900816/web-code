import { IdentifierLiteralExpression } from "javascript-ast-parser/src/lib/Expression/IdentifierLiteralExpression";
import { Definition } from "./Definition";
import { Scope } from "./Scope";

const globalDefinitions = [
    'function','if','else','for','while','do','catch','class','asyn','await','switch','let','var','const','window',
    'true', 'try', 'false', 'null', 'undefined', 'return', 'continue', 'break', 'default', 'require', '__dirname',
    {
        identifier: new IdentifierLiteralExpression({value: 'console', loc: {}}),
        props: [
            ...Object.keys(console)
        ]
    },
    {
        identifier: new IdentifierLiteralExpression({value: 'document', loc: {}}),
        props: [
            'querySelector','querySelectorAll','createElement', 'createEvent','getElementById','getElementsByClassName','getElementsByTagName'
        ]
    },
    {
        identifier: new IdentifierLiteralExpression({value: 'module', loc: {}}),
        props: [
            'exports'
        ]
    }
]

export const DefinitionCode = {
    ConstVariable: 0b1,
    Variable: 0b1 << 1,
    ImportSpecifier: 0b1 << 2,
    FunctionDeclaration: 0b1 << 3,
    ClassDeclaration: 0b1 << 4,
    Property: 0b1 << 5,
    Method: 0b1 << 6
}

export function getConsoleDefinition(scope) {
    let identifier = new IdentifierLiteralExpression({value: 'console', loc: {}});
    return new Definition(identifier, 'Variable', DefinitionCode.Variable, scope);
}

export const ObjectDefinitions = [];

export function getGlobalDefinitions(scope: Scope, definitions?: any) {
    return (definitions || globalDefinitions).map(item => {
        if(typeof item === 'string') {
            return new Definition(new IdentifierLiteralExpression({value: item, loc: {}}), 'Variable', DefinitionCode.Variable, scope)
        } else {
            let definition: Definition = new Definition(item.identifier, 'Variable', DefinitionCode.Variable, scope);
            definition.definitions = getGlobalDefinitions(scope, item.props);
            return definition;
        }
    })
}

export function getArrayDefininitons() {
    return [];
}

export function getObjectDefinitions() {
    return [];
}

export function getFunctionDefinitions () {
    return [];
}

export function getRegExpDefinitions () {
    return [];
}

export function getStringDefinitions () {
    return [];
}