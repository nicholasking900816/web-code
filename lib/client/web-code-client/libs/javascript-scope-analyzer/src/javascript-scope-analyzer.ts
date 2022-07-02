import { Block } from "javascript-ast-parser/src/Block";
import { NodeCode } from "javascript-ast-parser/src/constants";
import { AstNode } from "javascript-ast-parser/src/lib/AstNode";
import { AssignmentExpression } from "javascript-ast-parser/src/lib/Expression/AssignmentExpression";
import { Expression } from "javascript-ast-parser/src/lib/Expression/Expression";
import { IdentifierLiteralExpression } from "javascript-ast-parser/src/lib/Expression/IdentifierLiteralExpression";
import { VariableDeclarationStatement } from "javascript-ast-parser/src/lib/Statement/VariableDeclarationStatement";
import { Definition } from "./lib/Definition";
import { DefinitionCode, getArrayDefininitons, getFunctionDefinitions, getObjectDefinitions, getRegExpDefinitions, getStringDefinitions } from "./lib/constance";
import { Scope } from "./lib/Scope";
import { ImportStatement } from "javascript-ast-parser/src/lib/Statement/ImportStatement";
import { FunctionDeclarationStatement } from "javascript-ast-parser/src/lib/Statement/FunctionDeclarationStatement";
import { ClassDeclarationStatement } from "javascript-ast-parser/src/lib/Statement/ClassDeclarationStatement";
import { FunctionExpression } from "javascript-ast-parser/src/lib/Expression/FuntionExpression";
import { ArrayLiteralExpression } from "javascript-ast-parser/src/lib/Expression/ArrayLiteralExpression";
import { ObjectLiteralExpression } from "javascript-ast-parser/src/lib/Expression/ObjectLiteralExpression";
import { BinaryExpression } from "javascript-ast-parser/src/lib/Expression/BinaryExpression";
import { CallExpression } from "javascript-ast-parser/src/lib/Expression/CallExpression";
import { MemberExpression } from "javascript-ast-parser/src/lib/Expression/MemberExpression";
import { NewExpressioin } from "javascript-ast-parser/src/lib/Expression/NewExpressioin";
import { TemplateLiteralExppression } from "javascript-ast-parser/src/lib/Expression/TemplateLiteralExppression";
import { TernaryExpression } from "javascript-ast-parser/src/lib/Expression/TernaryExpression";
import { TypeOfExpression } from "javascript-ast-parser/src/lib/Expression/TypeOfExpression";
import { UnaryExpression } from "javascript-ast-parser/src/lib/Expression/UnaryExpression";
import { DeleteStatement } from "javascript-ast-parser/src/lib/Statement/DeleteStatement";
import { DoWhileStatement } from "javascript-ast-parser/src/lib/Statement/DoWhileStatement";
import { ExportDeclarationStatement } from "javascript-ast-parser/src/lib/Statement/ExportDeclarationStatement";
import { ForStatement } from "javascript-ast-parser/src/lib/Statement/ForStatement";
import { IfStatement } from "javascript-ast-parser/src/lib/Statement/IfStatement";
import { ReturnStatement } from "javascript-ast-parser/src/lib/Statement/ReturnStatement";
import { SwitchCaseStatement } from "javascript-ast-parser/src/lib/Statement/SwitchCaseStatement";
import { SwitchStatement } from "javascript-ast-parser/src/lib/Statement/SwitchStatement";
import { ThrowStatement } from "javascript-ast-parser/src/lib/Statement/ThrowStatement";
import { TryCathchStatement } from "javascript-ast-parser/src/lib/Statement/TryCatchStatement";
import { WhileStatement } from "javascript-ast-parser/src/lib/Statement/WhileStatement";
import { DefinitionType } from "./definitionType";
import { VoidExpression } from "javascript-ast-parser/src/lib/Expression/VoidExpression";
import { BracketEnwrapedExpressioin } from "javascript-ast-parser/src/lib/Expression/BracketEnwrapedExpressioin";
import { UnExpectStatement } from "javascript-ast-parser/src/lib/Statement/UnExpectStatement";

export class JavascriptScopeAnalyzer {
    currentScope: Scope;
    currentDefinition: Definition;
    scheduledAssinments: Function[] = [];
    scheduledVarDefCheck: Function[] = [];
    scheduledNewExpression: Function[] = [];
    definitionMap: any = {};

    private depth = 0;
    private applyingScheduled = false;
    
    constructor() {
    }

    reset() {
        this.scheduledAssinments = [];
        this.scheduledVarDefCheck = [];
        this.scheduledNewExpression = [];
        this.definitionMap = {};
        this.depth = 0;
        this.currentScope = null;
    }

    analyze(block: Block, parnetScope?: Scope) { 
        if(!block) return;
        this.depth ++;
        let currentScope = new Scope();
        currentScope.parent = parnetScope || this.currentScope;
        this.currentScope = currentScope;
        block.scope = currentScope;
        block.body.forEach((node: AstNode | Block) => {
            if (node instanceof Block) {
                return this.analyze(node as Block);
            } else if ((node.code & NodeCode.Expression) === node.code) {
                this.analyzeExpression(node as Expression);
            } else {
                this.analyzeStatement(node);
            }
        })
        this.currentScope = this.currentScope.parent;
        this.depth --;
        if (this.depth === 0 && !this.applyingScheduled) {
            this.applyingScheduled = true;
            this.scheduledAssinments.forEach(fn => fn());
            this.scheduledNewExpression.forEach(fn => fn());
            this.scheduledVarDefCheck.forEach(fn => fn());
            this.applyingScheduled = false;
        }
        return block.scope;
    }

    private analyzeStatement(node: AstNode) {
        switch(node.code) {
            case NodeCode.VariableDeclarationStatement:
                this.analyzeVariable(node as VariableDeclarationStatement);
                break;
            case NodeCode.ImportStatement:
                this.analyzeImport(node as ImportStatement);
                break;
            case NodeCode.FunctionDeclarationStatement:
                this.analyzeFunctionDeclaration(node as FunctionDeclarationStatement);
                break;
            case NodeCode.ClassDeclarationStatement:    
                this.analyzeClassDeclaration(node as ClassDeclarationStatement);
                break;
            case NodeCode.DeleteStatement:
                this.analyzeDeleteStatement(node as DeleteStatement);
                break;
            case NodeCode.DoWhileStatement:
                this.analyzeDoWhileStatement(node as DoWhileStatement);
                break;
            case NodeCode.ExportDeclarationStatement:
                this.analyzeExported(node as ExportDeclarationStatement);
                break;    
            case NodeCode.ForStatement:
                this.analyzeForStatement(node as ForStatement);
                break;    
            case NodeCode.IfStatement:
                this.analyzeIfStatement(node as IfStatement);
                break;
            case NodeCode.ReturnStatement:
                this.analyzeReturn(node as ReturnStatement);
                break;
            case NodeCode.SwitchStatement:    
                (<SwitchStatement>node).cases.forEach(item => this.analyzeSwitchCase(item));
                break;
            case NodeCode.ThrowStatement:
                this.analyzeThrowStatement(node as ThrowStatement);
                break;
            case NodeCode.TryCathchStatement:
                this.analyzeTryCatch(node as TryCathchStatement);
                break;    
            case NodeCode.WhileStatement:
                this.analyzeWhileStatement(node as WhileStatement);
                break; 
        }
        this.analyzeUnexpect(node);
    }

    private analyzeWhileStatement(statement: WhileStatement) {
        this.analyzeExpression(statement.test);
        this.analyze(statement.consequence);
    }

    private analyzeTryCatch(statement: TryCathchStatement) {
        this.analyze(statement.body);
        if (statement.catchHandler) {
            this.analyzeFunctionDeclaration(statement.catchHandler);
        }
        if (statement.finalizer) {
            this.analyze(statement.finalizer);
        }
    }

    private analyzeThrowStatement(statement: ThrowStatement) {
        this.analyzeExpression(statement);
    }

    private analyzeSwitchCase(statement: SwitchCaseStatement) {
        this.analyzeExpression(statement.test);
        this.analyze(statement.consequent);
    }

    private analyzeReturn(statement: ReturnStatement) {
        this.analyzeExpression(statement.argument);
    }

    private analyzeIfStatement(statement: IfStatement) {
        this.analyzeExpression(statement.test);
        this.analyze(statement.consequent);
        if (statement.alternate) {
            if ((<any>statement.alternate).code) {
                this.analyzeIfStatement(statement.alternate as IfStatement);
            } else {
                this.analyze(statement.alternate as Block);
            }
        }
    }

    private analyzeForStatement(statement: ForStatement) {
        let currentScope = new Scope();
            currentScope.parent = this.currentScope;
            this.currentScope = currentScope;
        if (statement.forIn || statement.forOf) {
            this.analyzeExpression(statement.right);
            if (statement.left.code === NodeCode.VariableDeclarationStatement) {
                this.analyzeVariable(statement.left as VariableDeclarationStatement);
            } else {
                this.analyzeExpression(statement.left);
            }
        } else {
            if(statement.init?.code === NodeCode.VariableDeclarationStatement) {
                this.analyzeVariable(statement.init as VariableDeclarationStatement);
            } else {
                this.analyzeExpression(statement.init);
            }

            this.analyzeExpression(statement.test);
            if (statement.update) {
                statement.update.forEach(expr => this.analyzeExpression(expr));
            }
            
        }
        this.analyze(statement.body);
        this.currentScope = this.currentScope.parent;
    }

    private analyzeExported(statement: ExportDeclarationStatement) {

    }

    private analyzeDoWhileStatement(statement: DoWhileStatement) {
        this.analyze(statement.body);
        this.analyzeExpression(statement.test);
    }

    private analyzeDeleteStatement(statement: DeleteStatement) {
        this.analyzeExpression(statement.argument);
    }

    private setDefinition(newDefinition: Definition | null = null) {
        let prev = this.currentDefinition;
        this.currentDefinition = newDefinition;
        return () => {
            this.currentDefinition = prev;
        }
    }

    private setScope(newScope: Scope | null = null) {
        let prev = this.currentScope;
        this.currentScope = newScope;
        return () => {
            this.currentScope = prev;
        }
    }

    private setState({newDefinition, newScope}) {
        let resetDefinition = this.setDefinition(newDefinition);
        let resetScope = this.setScope(newScope);
        return () => {
            resetDefinition();
            resetScope();
        }
    }

    private analyzeImport(statement: ImportStatement) {
        [{
            imported: statement.imported,
            local: statement.local
        }].concat(statement.specifiers).forEach(specifier => {
            let definition
            if (specifier.local) {
                definition = new Definition(specifier.local, DefinitionType.IMPORT, DefinitionCode.ImportSpecifier, this.currentScope)
            } else if (statement.imported) {
                definition = new Definition(specifier.imported, DefinitionType.IMPORT, DefinitionCode.ImportSpecifier, this.currentScope)
            }
            if (definition) {
                this.currentScope.addDefinition(definition);
                this.currentScope.addUnuse(definition);
            }
        })
    }

    private analyzeVariable(statement: VariableDeclarationStatement) {
        let declarationKeyWord = statement.declarationKeyWord, type, code;

        if (declarationKeyWord === 'const') {
            type = DefinitionType.CONST;
            code = DefinitionCode.ConstVariable;
        } else {
            type = DefinitionType.VARIABLE;
            code = DefinitionCode.Variable;
        }
        statement.declarations.forEach(declaration => {
            let definition = new Definition(declaration, type, code, this.currentScope);
            this.currentScope.addUnuse(definition);
            if (declaration.code === NodeCode.AssignmentExpression) {
                let prevScope = this.currentScope, prevMap = this.definitionMap, prevDefinition = this.currentDefinition;
                this.currentDefinition = definition;
                this.analyzeExpression((<AssignmentExpression>declaration).right);
                this.currentScope = prevScope;
                this.definitionMap = prevMap;
                this.currentDefinition = prevDefinition;
            } 

            this.currentScope.addDefinition(definition);
        })
    }

    private analyzeExpression(expression: Expression) {
        if(!expression) return;
        let currentDefinition = this.currentDefinition, currentScope = this.currentScope;
        switch(expression.code) {
            case NodeCode.ArrayLiteralExpression:
                this.analyzeArray(expression as ArrayLiteralExpression);
                break;
            case NodeCode.ObjectLiteralExpression:
                this.analyzeObject(expression as ObjectLiteralExpression);
                break;
            case NodeCode.IdentifierLiteralExpression:
                this.scheduledVarDefCheck.push(() => {
                    let definition = currentScope.getDefinition((<IdentifierLiteralExpression>expression).identifier);
                    if (definition) {
                        currentScope.deleteUnuse(definition);
                        if (currentDefinition) currentDefinition.definitions = definition.definitions;
                    } else {
                        currentScope.UndeclaredVariables.add(expression);
                    }
                });
                break;
            case NodeCode.FunctionExpression:
                this.analyzeFunExpression(<FunctionExpression>expression)
                if (this.currentDefinition) this.currentDefinition.definitions = getFunctionDefinitions();  
                break;
            case NodeCode.RegExpression:
                if (this.currentDefinition) this.currentDefinition.definitions = getRegExpDefinitions();  
                break;    
            case NodeCode.StringLiteralExpression:
                if (this.currentDefinition) this.currentDefinition.definitions = getStringDefinitions();  
                break;
            case NodeCode.TemplateLiteralExpression:    
                this.analyzeTemplate(expression as TemplateLiteralExppression);
                break;
            case NodeCode.AssignmentExpression:
                this.analyzeAssigment(expression as AssignmentExpression);
                break;
            case NodeCode.BinaryExpression:
                this.analyzeBinary(expression as BinaryExpression);
                break;
            case NodeCode.CallExpression:  
                this.analyzeCallExpression(expression as CallExpression);
                break;
            case NodeCode.MemberExpression:    
                this.analyzeMemberExpression(expression as MemberExpression);
                break;
            case NodeCode.BracketEnwrapedExpressioin:    
                this.analyzeBracketEnwraped(expression as BracketEnwrapedExpressioin);
                break;    
            case NodeCode.NewExpression:
                this.scheduledNewExpression.push(() => {
                    let reset = this.setState({
                        newDefinition: currentDefinition,
                        newScope: currentScope
                    })
                    this.analyzeNewExpression(expression as NewExpressioin);
                    reset();
                })
            case NodeCode.TernaryExpression:
                this.analyzeTernaryExression(expression as TernaryExpression);
                break;
            case NodeCode.TypeOfExpression:
                this.analyzeTypeOf(expression as TypeOfExpression);
                break;
            case NodeCode.VoidExpression:
                this.analyzeVoid(expression as VoidExpression);
                break;    
            case NodeCode.UnaryExpression:
                this.analyzeUnary(expression as UnaryExpression);
                break;
            default:
                break;    
        }
        this.analyzeUnexpect(expression);
    }

    private analyzeUnexpect(node: AstNode) {
        if (node.unexpectedNodes.length) {
            node.unexpectedNodes.forEach((item: UnExpectStatement) => {
                if (!item.value.code) return;
                if ((item.value.code & NodeCode.Expression) === node.code) {
                    this.analyzeExpression(item.value)
                } else {
                    this.analyzeStatement(item.value)
                }
            })
        }
    }

    private analyzeBracketEnwraped(expression: BracketEnwrapedExpressioin) {
        this.analyzeExpression(expression.expression);
    }

    private analyzeUnary(expression: UnaryExpression) {
        this.analyzeExpression(expression.argument);
    }

    private analyzeTernaryExression(expression: TernaryExpression) {
        let reset = this.setDefinition(null);
        this.analyzeExpression(expression.test);
        this.analyzeExpression(expression.consequent);
        this.analyzeExpression(expression.alternate);
        reset();
    }

    private analyzeTypeOf(expression: TypeOfExpression) {
        let reset = this.setDefinition(null);
        this.analyzeExpression(expression.argument);
        reset();
    }

    private analyzeVoid(expression: VoidExpression) {
        let reset = this.setDefinition(null);
        this.analyzeExpression(expression.argument);
        reset();
    }

    private analyzeNewExpression(expression: NewExpressioin) {
        let key = expression.callee.code === NodeCode.IdentifierLiteralExpression ? 
            (<any>expression.callee).identifier : (<any>expression.callee).callee.identifier;

        if ((<CallExpression>expression.callee).arguments) {
            (<CallExpression>expression.callee).arguments.forEach((expression: Expression) => this.analyzeExpression(expression))
        }

        let definition: Definition = this.currentScope.getDefinition(key);
        if (definition) {
            this.currentScope.deleteUnuse(definition);
            if (definition.astNode.code !== NodeCode.ClassDeclarationStatement) return;

            let classDeclaration: ClassDeclarationStatement = definition.astNode as ClassDeclarationStatement;
            if (this.currentDefinition) {
                this.currentDefinition.definitions = classDeclaration.methods.map(item => {
                    return new Definition(item, DefinitionType.METHOD, DefinitionCode.Method, this.currentScope);
                })
            }
            
        }    
    }

    private analyzeTemplate(expression: TemplateLiteralExppression) {
        expression.content.forEach(item => {
            if (item.code !== NodeCode.StringLiteralExpression) {
                let reset = this.setDefinition(null);
                this.analyzeExpression(item);
                reset;
            }
        });
        if(this.currentDefinition) this.currentDefinition.definitions = getStringDefinitions();
    }

    private analyzeMemberExpression(expression: MemberExpression) {
        if (expression.owner.code === NodeCode.IdentifierLiteralExpression && (expression.owner as IdentifierLiteralExpression).identifier === 'this') return;
        let reset = this.setDefinition(null);
        this.analyzeExpression(expression.owner);
        reset();
    }

    private analyzeCallExpression(expression: CallExpression) {
        let reset = this.setDefinition(null);
        this.analyzeExpression(expression.callee);
        expression.arguments.forEach(item => this.analyzeExpression(item));
        reset()
    }

    private analyzeBinary(expression: BinaryExpression) {
        let reset = this.setDefinition(null);
        this.analyzeExpression(expression.left);
        this.analyzeExpression(expression.right);
        reset();
    }

    private analyzeArray(express: ArrayLiteralExpression) {
        let reset = this.setDefinition(null);
        express.items.forEach(item => {
            this.analyzeExpression(item);
        });
        reset();
        if (this.currentDefinition) this.currentDefinition.definitions = getArrayDefininitons();
    }

    private analyzeAssigment(expression: AssignmentExpression) {
        this.analyzeExpression(expression.left);
        this.analyzeExpression(expression.right);
    }

    private analyzeObject(expression: ObjectLiteralExpression) {
        let definitions: any = expression.properties.map(prop =>{
            let definition = new Definition(prop.key, DefinitionType.PROPERTY, DefinitionCode.Property, this.currentScope)
            let reset = this.setDefinition(definition);
            this.analyzeExpression(prop.value);
            reset();
            return definition
        });
        if (this.currentDefinition) this.currentDefinition.definitions = definitions.concat(getObjectDefinitions());
    }

    private analyzeFunExpression(expression: FunctionExpression) {
        let definition = new Definition(expression, DefinitionType.FUNCTION, DefinitionCode.FunctionDeclaration, this.currentScope);
        let curScope = new Scope(), prevScope = this.currentScope;
        curScope.parent = this.currentScope;
        this.currentScope = curScope;
        expression.params.forEach((identifier: IdentifierLiteralExpression) => {
            let definition = new Definition(identifier, DefinitionType.VARIABLE, DefinitionCode.Variable, this.currentScope);
            this.currentScope.addUnuse(definition);
            this.currentScope.addDefinition(definition);
        });
        this.analyze(expression.body);
        this.currentScope = prevScope;
        return definition;
    }

    private analyzeFunctionDeclaration(statement: FunctionDeclarationStatement) {
        let definition = new Definition(statement, DefinitionType.FUNCTION, DefinitionCode.FunctionDeclaration, this.currentScope);
        this.currentScope.addUnuse(definition);
        this.currentScope.addDefinition(definition);
        let curScope = new Scope(), prevScope = this.currentScope;
        curScope.parent = this.currentScope;
        this.currentScope = curScope;
        statement.params.forEach((identifier: IdentifierLiteralExpression) => {
            let definition = new Definition(identifier, DefinitionType.VARIABLE, DefinitionCode.Variable, this.currentScope);
            this.currentScope.addUnuse(definition);
            this.currentScope.addDefinition(definition);
        });
        this.analyze(statement.body);
        this.currentScope = prevScope;
        return definition;
    }

    private analyzeClassDeclaration(statement: ClassDeclarationStatement) {
        let definition = new Definition(statement, DefinitionType.CLASS, DefinitionCode.ClassDeclaration, this.currentScope);
        this.currentScope.addUnuse(definition);
        this.currentScope.addDefinition(definition);
        if (statement.super) {
            this.analyzeExpression(statement.super);
        }
        return definition;
    }
}