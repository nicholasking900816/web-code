import { JavascriptAst } from './JavascriptAst';
import { IS_PARSING_CASE, IS_PARSING_TRY, IS_PARSING_DOWHILE, IS_PARSING_CLASSDECLARATION, IS_PARSING_COMPUTE, IS_PARSING_IMPORT, IS_PARSING_VARDECLARATION, IS_PARSING_FUNDECLARATION, NEED_PURE_IDENTIFIER, IS_PARSING_ACCESSPROP, IS_PARSING_SWITCH, NodeCode, priorityMap, IS_PARSING_TYPEOF, IS_PARSING_VOID, IS_PARSING_OBJECT_KEY } from './constants';
import { Patterns } from "./patterns";
import { isIdentifierChar, isIdentifierStart, isNumberStart, isNumberCharCode, isHexCharCode, assertUnexpect } from "./javasriptAstParserUtil";
import { UnExpectStatement } from './lib/Statement/UnExpectStatement';
import { ImportSpecifier, ImportStatement } from './lib/Statement/ImportStatement';
import { StringLiteralExpression } from './lib/Expression/StringLiteralExpression';
import { IdentifierLiteralExpression } from './lib/Expression/IdentifierLiteralExpression';
import { BinaryExpression } from './lib/Expression/BinaryExpression';
import { AstNode } from './lib/AstNode';
import { MemberExpression } from './lib/Expression/MemberExpression';
import { CallExpression } from './lib/Expression/CallExpression';
import { TernaryExpression } from './lib/Expression/TernaryExpression';
import { TemplateLiteralExppression } from './lib/Expression/TemplateLiteralExppression';
import { VariableDeclarationStatement } from './lib/Statement/VariableDeclarationStatement';
import { FunctionDeclarationStatement } from './lib/Statement/FunctionDeclarationStatement';
import { Block } from './Block';
import { SwitchCaseStatement } from './lib/Statement/SwitchCaseStatement';
import { TryCathchStatement } from './lib/Statement/TryCatchStatement';
import { DoWhileStatement } from './lib/Statement/DoWhileStatement';
import { WhileStatement } from './lib/Statement/WhileStatement';
import { ForStatement } from './lib/Statement/ForStatement';
import { IfStatement } from './lib/Statement/IfStatement';
import { ObjectLiteralExpression } from './lib/Expression/ObjectLiteralExpression';
import { ArrayLiteralExpression } from './lib/Expression/ArrayLiteralExpression';
import { UnaryExpression } from './lib/Expression/UnaryExpression';
import { SwitchStatement } from './lib/Statement/SwitchStatement';
import { WithStatement } from './lib/Statement/WithStatement';
import { NewExpressioin } from './lib/Expression/NewExpressioin';
import { ExportDeclarationStatement, ExportSpecifier } from './lib/Statement/ExportDeclarationStatement';
import { ClassDeclarationStatement } from './lib/Statement/ClassDeclarationStatement';
import { AssignmentExpression } from './lib/Expression/AssignmentExpression';
import { RegExpressioin } from './lib/Expression/RegExpressioin';
import { Expression } from './lib/Expression/Expression';
import { ParticularLiteralExpression } from './lib/Expression/ParticularLiteralExpression';
import { NumberLiteralExpression } from './lib/Expression/NumberLiteratalExpression';
import { ReturnStatement } from './lib/Statement/ReturnStatement';
import { ThrowStatement } from './lib/Statement/ThrowStatement';
import { DeleteStatement } from './lib/Statement/DeleteStatement';
import { TypeOfExpression } from './lib/Expression/TypeOfExpression';
import { FunctionExpression } from './lib/Expression/FuntionExpression';
import { JavascriptScopeAnalyzer } from 'javascript-scope-analyzer/src/javascript-scope-analyzer';
import { BreakStatement } from './lib/Statement/BreakStatement';
import { ContinueStatement } from './lib/Statement/ContinueStatement';
import { VoidExpression } from './lib/Expression/VoidExpression';
import { BracketEnwrapedExpressioin } from './lib/Expression/BracketEnwrapedExpressioin';

export class JavascriptAstParsser {
  static nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
  private pos = 0;
  private currentToken: any = {};
  private excutionFlag = 0;
  private startTokens: any[] = [];
  private stringStartToken: number;
  private tokens: any = [];
  private parsingNode: AstNode;
  private currentLine = 1;
  private isParsingFunDeclaration = false;
  private isParsingLoop = false;
  private depth = 1;
  private isParsingVarDeclaration = false;

  ast: JavascriptAst;
  
  private get curCharCode() {
    return this.input.charCodeAt(this.pos);
  }

  private get nextCharCode() {
    return this.input.charCodeAt(this.pos + 1);
  }

  private get curChar() {
    return this.input.charAt(this.pos);
  }
  
  constructor(private input: string) {

  }

  parse(analyze = true) {
    this.ast = new JavascriptAst();
    let topLevelBlock = this.ast.topLevelBlock;
    this.ast.topLevelBlock.depth = this.depth;
    while(!this.isReadAll()) {
      let node: AstNode | Block = this.parseNode();
      if (!node) {
        if (this.currentToken.value === '{') {
          const reset = this.markPos();
          node = this.parseObjLiteralExp();
          if (
            (node as any).code === NodeCode.ObjectLiteralExpression && 
            !(node as any).properties.length && 
            (node as any).unexpectedNodes.length
          ) {
            reset();
            node = this.parseBlock();
          }
        } else if (this.currentToken.value === '[') {
          node = this.parseArrExp()
        }
      } else if ((<AstNode>node).isUnexpectEnd) {
        node = new UnExpectStatement(node, 'unexpect end value')
      }
      node && topLevelBlock.body.push(node as any)
    }
    if (analyze) {
      new JavascriptScopeAnalyzer().analyze(this.ast.topLevelBlock);
    }
    return this.ast;
  }

  private isReadAll() {
    return this.pos > this.input.length - 1;
  }

  private isLineEnd() {
    let pos = this.pos, line = this.currentLine;
    this.skipSpace();
    let curLine = this.currentLine;
    let isLineEnd = curLine > line || this.isReadAll();
    this.pos = pos;
    this.currentLine = line;
    return isLineEnd;
  }

  private advance(offset?: number) {
    this.pos = this.pos + (offset || 1 );
  }

  private markPos() {
    let pos = this.pos, token = this.currentToken, len = this.tokens.length, startTokens = this.startTokens.slice();
    return () => {
      this.pos = pos;
      this.currentToken = token;
      this.tokens.length = len;
      this.startTokens = startTokens;
    }
  }

  private skipSpace() {
    loop: while (!this.isReadAll()) {
      let ch = this.input.charCodeAt(this.pos)
      switch (ch) {
        case 32: case 160: //''
          ++this.pos
          break
        case 13:
          if (this.input.charCodeAt(this.pos + 1) === 10) {
            ++this.pos
          }
        case 10: case 8232: case 8233:
          this.pos ++;
          this.currentLine ++;
          break
        case 47:
          if(this.nextCharCode === 47) {
            this.pos ++;
            this.skipLineComment();
            break;
          } else if (this.nextCharCode === 42) {
            this.pos ++;
            this.skipBlockComment();
            break;
          } 
          break loop;
        default:
          if (ch > 8 && ch < 14) {
            ++this.pos
          } else {
            break loop
          }
      }
    }
  }

  private consumeNextWordIfMatch(expectedWord: string) {
    let reset = this.markPos();
    this.next();
    if (this.currentToken.value === expectedWord) {
      return true
    } 
    reset();
    return false;
  }

  private isNextWordIs(expectedWord: string) {
    let reset = this.markPos();
    this.next();
    if (this.currentToken.value === expectedWord) {
      reset();
      return true
    } 
    reset();
    return false;
  }

  private startParse(node: AstNode, excutionFlag?: number) {
    let prevParsingNode = this.parsingNode, prevIsParsingLoop = this.isParsingLoop, isParsingFunDeclaration = this.isParsingFunDeclaration;
    this.parsingNode = node;
    excutionFlag && (this.excutionFlag |= excutionFlag);
    return (expectExpressionEnd = true) => {
      if (expectExpressionEnd && !prevParsingNode) {
        this.expectExpressionEnd();
      }

      node.loc.end = this.pos;

      if (this.parsingNode.code === NodeCode.FunctionDeclarationStatement) {
        this.isParsingFunDeclaration = false
      } else if ((NodeCode.Loop & this.parsingNode.code) === this.parsingNode.code) {
        this.isParsingLoop = false;
      }

      this.parsingNode = prevParsingNode;
      this.isParsingLoop = prevIsParsingLoop;
      this.isParsingFunDeclaration = isParsingFunDeclaration;
      excutionFlag && (this.excutionFlag &= ~excutionFlag);

      if (node.isUnexpectEnd && this.parsingNode) {
        this.parsingNode.isUnexpectEnd = true;
      }
      return node;
    }
  }

  private expectToken(expectedToken: string | string[]) {
    if(this.isReadAll()) {
      this.parsingNode.isUnexpectEnd = true;
      return false;
    } 
    expectedToken = typeof expectedToken === 'string' ? [expectedToken] : expectedToken;
    for(let value of expectedToken) {
      // let node = this.parseNode();
      // if (node) {
      //   assertUnexpect(this.parsingNode, node, ()=> `expect ${expectedToken}`);
      //   return false;
      // }
      this.next();
      if (this.currentToken.value !== value) {
        this.parsingNode.unexpectedNodes.push(new UnExpectStatement(this.currentToken.value, `expect ${value}`, this.currentToken.loc))
        return false;
      } 
    }
    return true
  }

  private expectExpressionEnd() {
    this.isReadAll() ||
    this.isLineEnd() ||
    this.expectToken(';')
    // while(true) {
    //   if (
    //     this.isReadAll() ||
    //     this.isLineEnd() ||
    //     this.expectToken(';')
    //   ) break
    // }
  }

  private parseNode(context: any = {}) {
    if (this.isReadAll()) return null;
    this.next();
    let node: AstNode;
    switch(this.currentToken.type) {
      case 'Keyword':
        return this.parseIsStartWithKeyword();
      case 'ParticularLiteral':
        return new ParticularLiteralExpression(this.currentToken);
      case 'TemplateLiteralExpStart':
        return this.parseTemplateLiteralExp();
      case 'IdentifierLiteral':
        node = new IdentifierLiteralExpression(this.currentToken);
        if(this.excutionFlag & NEED_PURE_IDENTIFIER) return node;
        return this.tryParseAssign(node) || !this.isParsingVarDeclaration && this.tryParse(node) || node;
      case 'StringLiteral':
        return this.tryParse(new StringLiteralExpression(this.currentToken));
      case 'UnclosedStringLiteral':
        return new UnExpectStatement(new StringLiteralExpression(this.currentToken), 'unclosed string', this.currentToken.loc);
      case 'NumberLiteral':
        node = new NumberLiteralExpression(this.currentToken);
        return this.tryParse(node);
      case 'Operator':
        if(!context.expectOperator && Patterns.prefixUnary.test(this.currentToken.value)) {
          return this.parseUnaryExpression();
        }
        return null;
      case 'RegExpStart':
        if(context.expectOperator) {
          return null;
        } 
        return this.parseRegStatement();      
      case 'IllegalToken':
        return new UnExpectStatement(this.currentToken.value, 'Illegal token', this.currentToken.loc);  
    }

    if (!this.currentToken.value && this.isReadAll()) {
      if (this.parsingNode) this.parsingNode.isUnexpectEnd = true;
    } 
    return null;
  }

  private next() {
    this.skipSpace();
    this.currentToken = {
      loc: {start: null, end: null}
    };
    this.currentToken.loc.start = this.pos;
    
    this.readWord();
    this.currentToken.loc.end = this.pos;
    this.tokens.push(Object.assign(this.currentToken));
    return this.currentToken;
  }

  private readWord() {
    if (isIdentifierStart(this.curCharCode)) {
      this.currentToken.value = this.readIdentifier();
      if (
        !(this.excutionFlag & IS_PARSING_ACCESSPROP) && 
        !(this.excutionFlag & IS_PARSING_OBJECT_KEY) &&
        (this.currentToken.value === 'instanceof' || this.currentToken.value === 'in')
      ) {
        this.currentToken.type = 'Operator'
      } else if (
        Patterns.keywords.test(this.currentToken.value) && 
        !(this.excutionFlag & IS_PARSING_ACCESSPROP) && 
        !(this.excutionFlag & IS_PARSING_OBJECT_KEY)
      ) {
        this.currentToken.type = 'Keyword'
      } else if (Patterns.ParticularLiteral.test(this.currentToken.value)) {
        this.currentToken.type = 'ParticularLiteral'
      } else {
        this.currentToken.type = 'IdentifierLiteral'
      }
    } else if (isNumberStart(this.curCharCode)) {
      this.currentToken.type = 'NumberLiteral'
      this.currentToken.value = this.readNumber();
    } else if (this.curCharCode === 39 || this.curCharCode === 34) {
      let value = this.readString();
      
      if (this.curCharCode !== this.stringStartToken) { // 遇到换行字符串还没闭合
        this.currentToken.type = 'UnclosedStringLiteral'
      } else {
        this.currentToken.type = 'StringLiteral'
        this.advance();
      }
      this.currentToken.value = value;  
 
    } else if (Patterns.operators.test(this.curChar)) {
      this.currentToken.type = 'Operator';
      this.currentToken.value = this.readOperator();
      this.currentToken.isAssignOperator = Patterns.assign.test(this.currentToken.value);
    } else {
        let start = this.pos;
        this.advance();
        this.currentToken.value = this.input.slice(start, this.pos);
        if (Patterns.blockStart.test(this.currentToken.value)) {
          this.currentToken.type = 'BlockStart';
        } else if (Patterns.blockClose.test(this.currentToken.value)) {
          this.currentToken.type = 'BlockClose'
        } else if (this.currentToken.value === '`') {
          this.currentToken.type = 'TemplateLiteralExpStart'
        } else if (this.currentToken.value && ';.,:'.indexOf(this.currentToken.value) < 0) {
          this.currentToken.value += this.readIllegalToken();
          this.currentToken.type = 'IllegalToken';
        }
    }
  }

  private readIllegalToken() {
    let start = this.pos;
    while(!this.isLineEnd() && this.curChar !== ';') {
      this.advance();
    }
    return this.input.slice(start, this.pos);
  }

  private readNumber() {
    let start = this.pos;
    this.consumeNumber();
    return this.input.slice(start, this.pos);
  }

  private consumeNumber() {
    if (this.curCharCode === 48) { // 0开头
      switch (this.nextCharCode) {
        case 98: // '0b'开头，二进制数
          this.advance(2);
          this.consumeBinary();
          break;
        case 120: // '0x'开头, 16进制数
          this.advance(2);
          this.consumeHex();
          break;
        default:
          this.advance();
          break;
      }
    } else {
      this.currentToken.type = 'NumberLiteral';
      let isReadingDecimal = false;
      while((isNumberCharCode(this.curCharCode) || this.curCharCode === 46) && !this.isReadAll()) { // 46 为 '.'
        if (this.curCharCode === 46) {
          if (isReadingDecimal) { // 一个nunber里不应有两个小数点
            this.consumeUnexpect([]);
            return;
          }
          isReadingDecimal = true;
        }
        this.advance();
      }
    }
  }

  private readString() {
    this.stringStartToken = this.curCharCode;
    this.advance();
    let start = this.pos;
    this.consumeString();
    return this.input.slice(start, this.pos);
  }

  private consumeString() {
    while(this.curCharCode !== this.stringStartToken && this.curCharCode !== 10/*\n*/ && !this.isReadAll()) {
      this.advance();
    }
  }

  private readIdentifier() {
    let start = this.pos;  
    this.advance();
    this.consumeIdentifier();
    return this.input.slice(start, this.pos);
  }

  private consumeIdentifier() {
    while(isIdentifierChar(this.curCharCode)) {
      this.advance();
      if (this.isReadAll()) break;
    }
  }

  private readOperator() {
    let start = this.pos;
    if (
      Patterns.canReapeat.test(this.curChar) && this.nextCharCode === this.curCharCode ||
      Patterns.canPrefixAssign.test(this.curChar) && this.nextCharCode === 61 /* '='*/ ||
      this.curCharCode === 33 /* '!' */  && this.nextCharCode === 61
    ) {
      this.advance();
    } 
    if (this.curCharCode === 61 && this.nextCharCode === 61) {
      this.advance();
    }
    this.advance();
    return this.input.slice(start, this.pos);
  }

  private safelyParseNode() {
    let node = this.parseNode();
    if (!this.parsingNode) {
      return node;
    }
    if (assertUnexpect(this.parsingNode, node)) return null;
    return node;
  }

  private getExpectedNode(expectedCode: number) {
    let node = this.safelyParseNode();
    
    if (node) {
      if((expectedCode & node.code) === node.code) return node;
      this.parsingNode.unexpectedNodes.push(new UnExpectStatement(node, '应为表达式'));
    } else if (this.isReadAll()) {
      this.parsingNode.isUnexpectEnd = true;
    } else {
      if (this.parsingNode && this.parsingNode.unexpectedNodes.length) return null;
      if (this.currentToken.value === '(' && expectedCode === NodeCode.Expression) return this.parseBracketEnwrapedExpression();
      if (this.currentToken.value === '{' && (expectedCode & NodeCode.ObjectLiteralExpression) === NodeCode.ObjectLiteralExpression) return this.parseObjLiteralExp();
      if (this.currentToken.value === '[' && (expectedCode & NodeCode.ArrayLiteralExpression) === NodeCode.ArrayLiteralExpression) return this.parseArrExp();
      if (this.currentToken.value === '/' && (expectedCode & NodeCode.RegExpression) === NodeCode.RegExpression) return this.parseRegStatement();
      this.parsingNode.unexpectedNodes.push(new UnExpectStatement(this.currentToken.value, `字符 '${this.currentToken.value}' 不该出现在此处`, this.currentToken.loc))
    }

    return null;
  }

  private expectExpression() {
    return this.getExpectedNode(NodeCode.Expression)
  }

  private tryToGetExpectedNode(expectedCode: number) {
    let reset = this.markPos();
    let node = this.parseNode();

    if (
      node && 
      !node.unexpectedNodes.length && 
      (node.code & expectedCode) === node.code
    ) return node;
    reset();
    return null;
  }

  private parseBlock(terminationTest: Function = (node: AstNode) => !node && this.currentToken.value === '}') {
    let prevDepth = this.depth;
    this.depth ++;
    let block = new Block(), prevContext = this.excutionFlag, prevParsingNode = this.parsingNode;
    block.loc = {start:this.pos, end: null};
    block.depth = this.depth;
    this.excutionFlag = 0;
    this.parsingNode = null;

    while(true) {
      if (this.isReadAll()) {
        prevParsingNode.isUnexpectEnd = true;
        break;
      }
      let node = this.parseNode();
      if (!node) {
        if (this.currentToken.value === '{') {
          const reset = this.markPos();
          node = this.parseObjLiteralExp();
          if (
            (node as any).code === NodeCode.ObjectLiteralExpression && 
            !(node as any).properties.length && 
            (node as any).unexpectedNodes.length
          ) {
            reset();
            node = this.parseBlock();
          }
        } else if (this.currentToken.value === '[') {
          node = this.parseArrExp()
        }
      } 
      if (node) {
        if (node.isUnexpectEnd) {
          block.body.push(new UnExpectStatement(node, 'unexpect end value'));
        } else {
          block.body.push(node);
        }
      }
      if (terminationTest(node)) break;
    }

    this.excutionFlag = prevContext;
    this.parsingNode = prevParsingNode;
    this.depth = prevDepth;

    let len = block.body.length;

    if (len) {
      block.loc.end = block.body[len - 1].loc.end;
    } else {
      block.loc.end = block.loc.start
    }

    return block;
  }

  private parseUnaryExpression() {
    let node: UnaryExpression = new UnaryExpression(this.currentToken);
    let finishParse = this.startParse(node);

    node.prefix = true;
    node.operator = this.currentToken.value;
    node.argument = this.expectExpression();
    return finishParse();
  }

  // statement parse start
  private parseImportStatement() {
    let node = this.tryToParseCallExpression(new IdentifierLiteralExpression(this.currentToken))
    if (node) {
      return node;
    } else {
      node = new ImportStatement(this.currentToken);
      let finishParse = this.startParse(node, IS_PARSING_IMPORT);
      
      if(node.from = this.tryToGetExpectedNode(NodeCode.StringLiteralExpression)) return finishParse();
      if (this.consumeNextWordIfMatch('{')) {
        node.specifiers = this.getImportedSpecifiers();
      } else if (
        node.imported = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)
      ) {
        if (
          this.consumeNextWordIfMatch('as') && 
          !(node.local = this.getExpectedNode(NodeCode.IdentifierLiteralExpression))
        ) {
            return finishParse();
        } 
      } 

      if (
        node.unexpectedNodes.length ||
        !this.expectToken('from')
      ) return finishParse();

      node.from = this.getExpectedNode(NodeCode.StringLiteralExpression);
      return finishParse();
    }
  }

  private getImportedSpecifiers() {
    let specifiers = [], expectComma = false;
    while(!this.consumeNextWordIfMatch('}') && !this.isReadAll()) {
      if (expectComma) {
        if (!this.expectToken(',')) {
          break;
        }
      } else {
        let node: IdentifierLiteralExpression = this.getExpectedNode(NodeCode.IdentifierLiteralExpression);
        if (!node) break;
        let specifier: ImportSpecifier = {
          imported: node,
          local: null
        }
        if (this.consumeNextWordIfMatch(':') || this.consumeNextWordIfMatch('as')) {
          if (!(specifier.local = this.getExpectedNode(NodeCode.IdentifierLiteralExpression))) {
            break;
          }
        }
        specifiers.push(specifier);
      }
      expectComma = !expectComma;
    }
    return specifiers;
  }

  private parseVarDeclarationStatement() {
    this.isParsingVarDeclaration = true;
    let statement: VariableDeclarationStatement = new VariableDeclarationStatement(this.currentToken);
    let finishParse = this.startParse(statement, IS_PARSING_VARDECLARATION);
    let declaration: Expression;

    while(declaration = this.getExpectedNode(NodeCode.IdentifierLiteralExpression | NodeCode.AssignmentExpression)) {
      statement.declarations.push(declaration);
      if (!this.consumeNextWordIfMatch(',')) {
        break
      }
    }
    this.isParsingVarDeclaration = false;
    return finishParse();
  }

  

  private parseFunDeclarationStatement() {
    let isClassMethod = this.currentToken.value !== 'function';
    let statement: FunctionDeclarationStatement = new FunctionDeclarationStatement(this.currentToken);
    let finishParse = this.startParse(statement, IS_PARSING_FUNDECLARATION);
    this.isParsingFunDeclaration = true;

    if (
      (statement.identifier = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)) &&
      this.expectToken('(')
    ) {
      let params: IdentifierLiteralExpression;
      if (!this.consumeNextWordIfMatch(')')) {
        while(
          params = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)
        ) {
          statement.params.push(params);
          if (this.consumeNextWordIfMatch(')')) {
            break;
          } else if (this.expectToken(',')) {
            continue;
          }
        }
      }
    }

    if (isClassMethod && statement.identifier) statement.loc.start = statement.identifier.loc.start;

    if(statement.unexpectedNodes.length) return finishParse();

    if (this.expectToken('{')) {
      statement.body = this.parseBlock();
      statement.body.functionBlock = true;
    }

    return finishParse();
  }

  private tryParseFunciotnExpress() {
    let currentToken = this.currentToken;
    if (this.consumeNextWordIfMatch('(')) {
      this.isParsingFunDeclaration = true;
      let expression: FunctionExpression = new FunctionExpression(currentToken);
      let finishParse = this.startParse(expression);
      let param: IdentifierLiteralExpression;
      if (!this.consumeNextWordIfMatch(')')) {
        while(
          param = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)
        ) {
          expression.params.push(param);
          if ( this.consumeNextWordIfMatch(')') || !this.expectToken(',')) break;
        }  
      };
      
      if (!expression.unexpectedNodes.length && this.expectToken('{')) {
        expression.body = this.parseBlock();
        expression.body.functionBlock = true;
      }
      return finishParse();
    }
    return null;
  }

  private parseObjLiteralExp() {
    let expression: ObjectLiteralExpression = new ObjectLiteralExpression(this.currentToken);
    let finishParse = this.startParse(expression);
    let key: IdentifierLiteralExpression | StringLiteralExpression, value: Expression;
    this.excutionFlag |= IS_PARSING_OBJECT_KEY;
    while(!this.consumeNextWordIfMatch('}') && (key = this.getExpectedNode(NodeCode.ObjectKey))) {
      this.excutionFlag &= ~IS_PARSING_OBJECT_KEY;
      if (this.expectToken(':') && (value = this.getExpectedNode(NodeCode.Expression))) {
        expression.properties.push({
          key: key as any,
          value: value
        });
        this.excutionFlag |= IS_PARSING_OBJECT_KEY;
        if (this.consumeNextWordIfMatch('}') || !this.expectToken(',')) {
          break
        }
      } else {
        break;
      }
    }
    this.excutionFlag &= ~IS_PARSING_OBJECT_KEY;
    if (expression.unexpectedNodes.length) {
      return finishParse()
    } else {
      return this.tryParse(finishParse(false));
    }
  }

  private parseArrExp() {
    let expression: ArrayLiteralExpression = new ArrayLiteralExpression(this.currentToken);
    let finishParse = this.startParse(expression);
    let value: Expression;
    while(!this.consumeNextWordIfMatch(']') && (value = this.expectExpression())) {
      expression.items.push(value);
      if (this.consumeNextWordIfMatch(']') || !this.expectToken(',')) {
        break;
      }
    }
    if (expression.unexpectedNodes.length) {
      return finishParse()
    } else {
      return this.tryParse(finishParse(false));
    }
  }

  private parseTryCatchStatment() {
    let statement: TryCathchStatement = new TryCathchStatement(this.currentToken);
    let finishParse = this.startParse(statement, IS_PARSING_TRY);

    if (!this.expectToken('{')) {
      return finishParse()
    }

    statement.body = this.parseBlock();

    if(this.consumeNextWordIfMatch('catch')) {
      let catchHandler: FunctionDeclarationStatement = this.parseCatchHandler() as FunctionDeclarationStatement;
      if (catchHandler.unexpectedNodes.length) {
        statement.unexpectedNodes.push(catchHandler)
        return finishParse();
      } 
      statement.catchHandler = catchHandler;
    }

    if(this.consumeNextWordIfMatch('finally') && this.expectToken('{')) {
      statement.finalizer = this.parseBlock();
    }

    if (!statement.catchHandler && !statement.finalizer) statement.unexpectedNodes.push(
      new UnExpectStatement(this.currentToken.value, 'expect finally', this.currentToken.loc) 
    )

    return finishParse();
  }

  private parseCatchHandler() {
    let statement: FunctionDeclarationStatement = new FunctionDeclarationStatement(this.currentToken);
    let finishParse = this.startParse(statement, IS_PARSING_FUNDECLARATION);
    this.isParsingFunDeclaration = true;
    statement.identifier = new IdentifierLiteralExpression(this.currentToken);

    if (this.expectToken('(')) {
      let params: IdentifierLiteralExpression;
      if (!this.consumeNextWordIfMatch(')')) {
        while(
          params = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)
        ) {
          statement.params.push(params);
          if (this.consumeNextWordIfMatch(')')) {
            break;
          } else if (this.expectToken(',')) {
            continue;
          }
        }
      }
    }

    if(statement.unexpectedNodes.length) return finishParse();
    if (this.expectToken('{')) {
      statement.body = this.parseBlock();
      statement.body.functionBlock = true;
    }

    return finishParse();
  }

  private parseDoWihleStatement() {
    let statement = new DoWhileStatement(this.currentToken);
    let finishParse = this.startParse(statement, IS_PARSING_DOWHILE);
    this.isParsingLoop = true;
    if (!this.expectToken('{')) return finishParse();
    statement.body = this.parseBlock();

    this.expectToken('while') && 
    this.expectToken('(') &&
    (statement.test = this.expectExpression()) && 
    this.expectToken(')') 

    return finishParse();
  }

  private parseWhileStatment() {
    let statement: WhileStatement = new WhileStatement(this.currentToken);
    let finishParse = this.startParse(statement, IS_PARSING_SWITCH);
    this.isParsingLoop = true;

    if (
      this.expectToken('(') &&
      (statement.test = this.expectExpression()) && 
      this.expectToken(')') &&
      this.expectToken('{')
    ) {
      statement.consequence = this.parseBlock()
    }

    return finishParse();
  }

  private parseExpressions(endFlag) {
    let exprs = [];
    while(!this.isReadAll()) {
      let expr = this.expectExpression();
      exprs.push(expr);
      if (this.isNextWordIs(endFlag) || !this.consumeNextWordIfMatch(',')) return exprs;
    }
  }

  private parseForStatement() {
    let statement: ForStatement = new ForStatement(this.currentToken);
    let finishParse = this.startParse(statement)
    this.isParsingLoop = true;
    if (!this.expectToken('(')) return finishParse();

    if (!this.consumeNextWordIfMatch(';')) {
      let init = this.getExpectedNode(NodeCode.Expression | NodeCode.VariableDeclarationStatement);
      if (!init) {
        return finishParse()
      } else if (
        init.code === NodeCode.IdentifierLiteralExpression || 
        init.code === NodeCode.VariableDeclarationStatement &&
        init.declarations.length === 1 && 
        init.declarations[0].code !== NodeCode.AssignmentExpression
      ) {
        if (
          (statement.forOf = this.consumeNextWordIfMatch('of')) ||
          (statement.forIn = this.consumeNextWordIfMatch('in'))
        ) {
          statement.left = init;
          if (
            ( 
              statement.forIn ? statement.right = this.expectExpression() : 
              statement.right = this.expectExpression()
            ) && 
            this.expectToken(')') &&
            this.expectToken('{')
          ) {
            statement.body = this.parseBlock();
          }
          return finishParse()
        }
      }
      statement.init = init;
      if (!this.expectToken(';')) return finishParse();
    }

    if (
      !this.consumeNextWordIfMatch(';') && 
      !(statement.test = this.expectExpression()) &&
      !this.expectToken(';')
    ) {
      return finishParse()
    }

    if (
      this.consumeNextWordIfMatch(')') ||
      this.expectToken(';') &&
      (statement.update = this.parseExpressions(')')) &&
      this.expectToken(')') 
    ) {
      if (this.expectToken('{')) statement.body = this.parseBlock()
    }
    
    return finishParse()
  }

  private parseRegStatement() {
    let expression: RegExpressioin = new RegExpressioin(this.currentToken);
    let finishParse = this.startParse(expression);
    let pos = this.pos - 1, escape = false;
    while(!this.isReadAll() && !(!escape && this.curChar === '/')) {
      this.advance();
      if (this.curChar === '\n') {
        expression.unexpectedNodes.push(new UnExpectStatement(this.input.slice(pos, this.pos), '未完成的正则表达式', {
          start: pos,
          end: this.pos
        }))
        return finishParse();
      }
      if (escape) {
        escape = false
      } else if (this.curChar === '\\') {
        escape = true;
      }
    }
    this.advance();
    expression.pattern = this.input.slice(pos, this.pos);
    if (this.curChar === 'i' || this.curChar === 'g') {
      let reset = this.markPos();
      this.next();
      if (!/i|g|ig|gi/.test(this.currentToken.value)) {
        reset()
      } else {
        expression.flag = this.currentToken.value;
      }
    }
    return finishParse();
  }

  private parseIfStatement() {
    let statement: IfStatement = new IfStatement(this.currentToken);
    let finishParse = this.startParse(statement);
    let expectLineEnd = false;

    let parseConditionBlock = () => {
      if (this.consumeNextWordIfMatch('{')) {
        return this.parseBlock()
      } else {
        expectLineEnd = true;
        let currentLine = this.currentLine;
        let reset = this.markPos();
        let block = new Block();
        if (this.consumeNextWordIfMatch('else')) {
          if (currentLine === this.currentLine) {
            statement.unexpectedNodes.push(new UnExpectStatement('else', 'statement expect', this.currentToken.loc));
            return null;
          }
          reset();
          return block;
        } else if (this.consumeNextWordIfMatch(';')) {
          reset();
          return block;
        }

        let nextStatement = this.safelyParseNode();
        if (nextStatement) {
          block.body.push(nextStatement)
        }
        return block;
      }
    }
    
    if (
      !this.expectToken('(') ||
      !(statement.test = this.expectExpression()) ||
      !this.expectToken(')') 
    ) {
      return finishParse()
    }

    statement.consequent = parseConditionBlock();

    if(statement.unexpectedNodes.length || expectLineEnd && !this.isLineEnd()) return finishParse();
    expectLineEnd = false;

    if(this.consumeNextWordIfMatch('else')) {
      if (this.consumeNextWordIfMatch('if')) {
        statement.alternate = this.parseIfStatement() as IfStatement;
      } else if (this.expectToken('{')) {
        statement.alternate = this.parseBlock();
      }
    }
    return finishParse(); 
  }

  private parseBreakStatement() {
    let statement: BreakStatement = new BreakStatement(this.currentToken);
    let finishParse = this.startParse(statement);
    if (!this.isLineEnd() && !this.isNextWordIs(';')) {
      statement.argument = this.expectExpression();
    }
    
    if (!this.isParsingLoop) return new UnExpectStatement(finishParse(), '"break" 语句只能在循环语句里使用')
    return finishParse();
  }

  private parseReturnStatement() {
    let statement: ReturnStatement = new ReturnStatement(this.currentToken);
    let finishParse = this.startParse(statement);

    if (!this.isLineEnd() && !this.isNextWordIs(';')) {
      statement.argument = this.expectExpression();
    }

    if (!this.isParsingFunDeclaration) return new UnExpectStatement(finishParse(), 'A "return" statement can only be used within a function body')
    return finishParse();
  }

  private parseContinueStatement() {
    let statement: ContinueStatement = new ContinueStatement(this.currentToken);
    let finishParse = this.startParse(statement);

    if (!this.isLineEnd() && !this.isNextWordIs(';')) {
      statement.argument = this.expectExpression();
    }

    if (!this.isParsingLoop) return new UnExpectStatement(finishParse(), '"continue" 语句只能用在循环语句内')
    return finishParse();
  }

  private parseSwitchStatement() {
    let statement: SwitchStatement = new SwitchStatement(this.currentToken);
    let finishParse = this.startParse(statement);
    let caseStatement: SwitchCaseStatement;
    
    if (!(
      this.expectToken('(') &&
      (statement.discriminant = this.expectExpression()) &&
      this.expectToken([')', '{'])
    )) return finishParse()

    while(!this.consumeNextWordIfMatch('}')) {
      if (caseStatement = this.parseCaseStatement() as SwitchCaseStatement) {
        if (caseStatement.unexpectedNodes.length) {
          break;
        }
        statement.cases.push(caseStatement)
      } else {
        break
      }
    }

    return finishParse();
  }

  private parseCaseStatement() {
    if (
      !this.consumeNextWordIfMatch('case') &&
      !this.consumeNextWordIfMatch('default') 
    ) {
      this.next();
      this.parsingNode.unexpectedNodes.push(new UnExpectStatement(this.currentToken.value, 'expect "case" or "default"', this.currentToken.loc))
      return null
    }

    let statement: SwitchCaseStatement = new SwitchCaseStatement(this.currentToken);
    let finishParse = this.startParse(statement, IS_PARSING_CASE)
    this.isParsingLoop = true;
    statement.isDefault = this.currentToken.value === 'default'

    if (!statement.isDefault && !(statement.test = this.expectExpression())) {
      return finishParse();
    }

    if (this.expectToken(':')) {
      if (this.consumeNextWordIfMatch('{')) {
        statement.consequent = this.parseBlock()
      } else {
        let reset = this.markPos()
        statement.consequent = this.parseBlock((statement) => {
          if (
            !statement &&
            ['case', 'default', '}'].includes(this.currentToken.value)
          ) {
            reset();
            return true;
          } else {
            reset = this.markPos();
          }
        })
      }
    }

    return finishParse();
  }

  private parseThrowStatement() {
    let statement = new ThrowStatement(this.currentToken);
    let finishParse = this.startParse(statement);
    statement.argument = this.expectExpression();
    return finishParse();
  }

  private parseWithStatement() {
    let statement = new WithStatement(this.currentToken);
    let finishParse = this.startParse(statement);
    if (
      this.expectToken('(') &&
      (statement.context = this.expectExpression()) &&
      this.expectToken(')') &&
      this.expectToken('{')
    ) {
      statement.body = this.parseBlock();
    }
    return finishParse();
  }

  private parseDeleteStatement() {
    let statement = new DeleteStatement(this.currentToken);
    let finishParse = this.startParse(statement);
    statement.argument = this.getExpectedNode(NodeCode.MemberExpression);
    return finishParse();
  }

  private parseNewStatement() {
    let expression: NewExpressioin = new NewExpressioin(this.currentToken);
    let finishParse = this.startParse(expression);
    expression.callee = this.getExpectedNode(NodeCode.CallExpression | NodeCode.IdentifierLiteralExpression);
    return finishParse();
  }

  private parseClassDeclarationStatement() {
    let statement: ClassDeclarationStatement = new ClassDeclarationStatement(this.currentToken);
    let finishParse = this.startParse(statement, IS_PARSING_CLASSDECLARATION);

    if (
      !(statement.className = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)) ||
      this.consumeNextWordIfMatch('extends') && 
      !(statement.super = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)) ||
      !this.expectToken('{')
    ) {
      return finishParse();
    }

    while(!this.consumeNextWordIfMatch('}') && !this.isReadAll()) {
      let method = this.parseClassMehod();
      if(!method) return finishParse();
      statement.methods.push(method as FunctionDeclarationStatement);
    }
    return finishParse();
  }

  private parseClassMehod() {
    let reset = this.markPos();
    this.next();
    if (this.currentToken.type !== 'IdentifierLiteral') {
      this.parsingNode.unexpectedNodes.push(new UnExpectStatement(
        this.currentToken.value,
        'expect identifier',
        this.currentToken.loc
      ))
      return null;
    }
    reset();
    let statement = this.parseFunDeclarationStatement();
    if (statement.unexpectedNodes.length) {
      this.parsingNode.unexpectedNodes.push(statement);
      return null
    } 
    return statement;
  }

  private parseExportStatement() {
    let statement: ExportDeclarationStatement = new ExportDeclarationStatement(this.currentToken);
    let finishParse = this.startParse(statement);
    if (this.consumeNextWordIfMatch('{')) {
      let identifier: IdentifierLiteralExpression;
      while(identifier = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)) {
        let exportSpecifier: ExportSpecifier = {
          exported: identifier,
          local: null
        }
        if (this.consumeNextWordIfMatch('as')) {
          if (exportSpecifier.local = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)) {
            statement.specifiers.push(exportSpecifier)
          } else {
            return finishParse();
          }
        }
        statement.specifiers.push(exportSpecifier);
        if (this.consumeNextWordIfMatch('}')) break;
        if (!this.expectToken(',')) return finishParse();
      }
    } else {
      let identifier: AstNode = this.getExpectedNode(NodeCode.Declaration | NodeCode.IdentifierLiteralExpression);
      if (identifier) {
        statement.exported = identifier;
        if ((identifier.code & NodeCode.Declaration) === identifier.code) {
           return finishParse();
        }
        if (this.consumeNextWordIfMatch('as') && !(statement.local = this.getExpectedNode(NodeCode.IdentifierLiteralExpression))) {
          return finishParse();
        }
      } else {
        return finishParse();
      }
      
    }

    this.expectToken('from') &&
    (statement.from = this.getExpectedNode(NodeCode.StringLiteralExpression))

    return finishParse();
  }

  private parseTypeOfExpression() {
    let expression = new TypeOfExpression(this.currentToken);
    let finishParse = this.startParse(expression, IS_PARSING_TYPEOF);
    expression.argument = this.expectExpression();
    if (expression.unexpectedNodes.length) {
      return finishParse()
    } else {
      return this.tryParse(finishParse(false));
    }
  }

  private parseVoidExpression() {
    let expression = new VoidExpression(this.currentToken);
    let finishParse = this.startParse(expression, IS_PARSING_VOID);
    expression.argument = this.expectExpression();
    if (expression.unexpectedNodes.length) {
      return finishParse()
    } else {
      return this.tryParse(finishParse(false));
    }
  }

  private parseTemplateLiteralExp() {
    let node: TemplateLiteralExppression = new TemplateLiteralExppression(this.currentToken);
    let finishParse = this.startParse(node)
    let consumeString = () => {
      while(this.curCharCode !== 96 && !this.isReadAll() && this.input.slice(this.pos + 1, this.pos + 3) !== '${') {
        this.advance();
      }
    }
    while(this.curCharCode !== 96) {
      let start = this.pos, str: StringLiteralExpression;
      consumeString();
      str = new StringLiteralExpression({
          value: this.input.slice(start, this.pos),
          loc: {
            start: start,
            end: this.pos
          }
      })
      if (this.isReadAll()) { // 模版字符串到代码结尾都没有闭合
        str && node.unexpectedNodes.push(new UnExpectStatement(str, '未闭合的模板字符串', {
          start: node.loc.start,
          end: this.pos
        }));
        return finishParse()
      }
      node.content.push(str);
      if (this.curCharCode === 96) break;
      let value: AstNode;
      if( // 遇到了 '${' 符号
        (value = this.expectExpression()) &&
        this.expectToken('}')
      ) {
        node.content.push(value);
        continue;
      }
      break;
    }
    this.advance();
    return finishParse();
  }

  private parseBracketEnwrapedExpression() {
    let expression: BracketEnwrapedExpressioin = new BracketEnwrapedExpressioin(this.currentToken), excutionFlag = this.excutionFlag;
    this.excutionFlag = 0;
    let finishParse = this.startParse(expression);
    if (
      (expression.expression = this.expectExpression()) &&
      this.expectToken(')')
    ) {
      this.excutionFlag = excutionFlag;
      return this.tryParse(finishParse(false));
    }
    this.excutionFlag = excutionFlag;
    return finishParse();
  }

  private tryParse(expression: Expression) {
    let result = this.tryParseTernary(expression) || this.tryParseSuffixUnary(expression) || this.tryParseMember(expression) || 
      this.tryParseComputedMember(expression) || this.tryToParseCallExpression(expression) || this.parseBinaryExpression(expression) || expression;
    if (result === expression && !this.parsingNode) {
      this.parsingNode = expression;
      this.expectExpressionEnd();
      this.parsingNode = null;
    } 
    return result; 
  }

  private tryParseTernary(expression: Expression) {
    if (this.excutionFlag & IS_PARSING_COMPUTE || !this.consumeNextWordIfMatch('?')) {
      return null;
    }

    let statement: TernaryExpression = new TernaryExpression(expression);
    let finishParse = this.startParse(statement);

    (statement.consequent = this.expectExpression()) &&
    this.expectToken(':') &&
    (statement.alternate = this.expectExpression())

    return finishParse();
  }

  private tryParseMember(propOwener: Expression) {
    if (!this.consumeNextWordIfMatch('.')) return null// '.';
    let expression: MemberExpression = new MemberExpression(propOwener);
    let finishParse = this.startParse(expression, IS_PARSING_ACCESSPROP);

    if(expression.property = this.getExpectedNode(NodeCode.IdentifierLiteralExpression)) {
      let result = finishParse(false);
      return this.tryParseAssign(result) || this.tryParse(result);
    }
    return finishParse();
  }

  private tryParseComputedMember(propOwener: Expression) {
    if (!this.consumeNextWordIfMatch('[')) return null;
    let expression: MemberExpression = new MemberExpression(propOwener);
    expression.isComputed = true;
    let finishParse = this.startParse(expression);

    if(
      (expression.property = this.expectExpression()) &&
      this.consumeNextWordIfMatch(']')
    ) {
      let result = finishParse(false);
      return this.tryParseAssign(result as Expression) || this.tryParse(result);
    }
    
    return finishParse();
  }

  private tryToParseCallExpression(fnName: AstNode) {
    if (!this.consumeNextWordIfMatch('(')) return null;    
    let node = new CallExpression(fnName);
    let finishParse = this.startParse(node);
    if (!this.consumeNextWordIfMatch(')')) {
      while(!this.isReadAll()) {
        let nextNode: AstNode = this.expectExpression();
        if (nextNode) {
          node.arguments.push(nextNode);
        } else {
          return finishParse();
        }
        if (this.consumeNextWordIfMatch(')')) break;
        if (!this.expectToken(',')) return finishParse();
      }
    }
  
    return this.tryParse(finishParse(false));
  }

  private tryParseSuffixUnary(expression: Expression) {
    if (expression.code !== NodeCode.IdentifierLiteralExpression && expression.code !== NodeCode.MemberExpression) return null;
    let reset = this.markPos();
    this.next()
    if (!Patterns.canBeSuffixUnary.test(this.currentToken.value)) {
      reset();
      return null;
    }

    let newExpression: UnaryExpression = new UnaryExpression(this.currentToken);
    newExpression.suffix = true; 
    newExpression.argument = expression;
    newExpression.loc.start = expression.loc.start;
    return  this.startParse(newExpression)();
  }

  private tryParseAssign(left: Expression) {
    if ((left.code & NodeCode.AssigmentLeft) !== left.code) return null;
    let reset = this.markPos();
    this.next();
    if (!this.currentToken.isAssignOperator) {
      reset();
      return null;
    } 
    let prevIsParsingVarDeclaration = this.isParsingVarDeclaration;
    this.isParsingVarDeclaration = false;
    let expression: AssignmentExpression = new AssignmentExpression({loc: {start: left.loc.start}});
    let finishParse = this.startParse(expression);
    expression.left = left;
    if (this.excutionFlag & IS_PARSING_VARDECLARATION && this.currentToken.value !== '=') {
      expression.unexpectedNodes.push(new UnExpectStatement(this.currentToken.value, 'expect "="', this.currentToken.loc));
      return finishParse();
    }
    expression.operator = this.currentToken.value;
    expression.right = this.expectExpression();
    this.isParsingVarDeclaration = prevIsParsingVarDeclaration;
    return finishParse();
  }

  private parseBinaryExpression(first: Expression) {
    if (this.excutionFlag & IS_PARSING_TYPEOF || this.excutionFlag & IS_PARSING_VOID) return first;
    let reset = this.markPos();
    this.next();
    if (this.excutionFlag & IS_PARSING_COMPUTE || this.currentToken.type !== 'Operator') {
      reset();
      return first;
    }

    let comparePriorityAndInsert = (op1: BinaryExpression, op2: BinaryExpression, parent?: BinaryExpression) => {
      if (priorityMap[op1.operator]  < priorityMap[op2.operator]) {
        if (op1.right.code === NodeCode.BinaryExpression) {
          comparePriorityAndInsert(op1.right as BinaryExpression, op2, op1);
        } else {
          op2.left = op1.right;
          op1.right = op2;
          parentRef = op1;
        }
      } else {
        op2.left = op1;
        if (parent) { 
          parent.right = op2;
        } else {
          expression = op2;
          finishParse();
          finishParse = this.startParse(expression, IS_PARSING_COMPUTE);
        }
      }
    }

    let setBinaryExpressionLoc = (binaryExpression: BinaryExpression) => {
      if (binaryExpression.left.code === NodeCode.BinaryExpression) setBinaryExpressionLoc(binaryExpression.left as BinaryExpression);
      binaryExpression.loc.start = binaryExpression.left.loc.start;
      if (binaryExpression.right) {
        if (binaryExpression.right.code === NodeCode.BinaryExpression) setBinaryExpressionLoc(binaryExpression.right as BinaryExpression); 
        binaryExpression.loc.end = binaryExpression.right.loc.end;
      }
    }

    let last: BinaryExpression, parentRef;
    let expression: BinaryExpression = last = new BinaryExpression(first); 
    expression.operator = this.currentToken.value;
    let finishParse = this.startParse(expression, IS_PARSING_COMPUTE);
    last.right = this.getExpectedNode(NodeCode.Expression);

    while (last.right) { 
        let reset = this.markPos();
        this.next();
        if (this.currentToken.type !== 'Operator' || this.currentToken.value === '?') {
          reset();
          break;
        } 
        let current = new BinaryExpression();
        (<BinaryExpression>current).operator = this.currentToken.value;
        comparePriorityAndInsert(last, current as BinaryExpression, parentRef);
        last = current as BinaryExpression;
        last.right = this.getExpectedNode(NodeCode.Expression);   
        if (this.isReadAll()) break;
    } 

    setBinaryExpressionLoc(expression);
    return this.tryParseTernary(finishParse()) || expression;
  }
 
  private parseIsStartWithKeyword() {
    switch(this.currentToken.value) {
      case 'import':
        return this.parseImportStatement();
      case 'let':
      case 'const':
      case 'var':  
        return this.parseVarDeclarationStatement();
      case 'function':    
        return this.tryParseFunciotnExpress() || this.parseFunDeclarationStatement();
      case 'try':
        return this.parseTryCatchStatment();
      case 'do':
        return this.parseDoWihleStatement();
      case 'while':
        return this.parseWhileStatment();
      case 'for':
        return this.parseForStatement();  
      case 'if':
        return this.parseIfStatement();
      case 'return':
        return this.parseReturnStatement();
      case 'switch':
        return this.parseSwitchStatement();
      case 'throw':
        return this.parseThrowStatement();
      case 'with':
        return this.parseWithStatement();
      case 'delete':  
        return this.parseDeleteStatement();
      case 'typeof':
        return this.parseTypeOfExpression();
      case 'void':
        return this.parseVoidExpression();  
      case 'new':
        return this.parseNewStatement();  
      case 'class':
        return this.parseClassDeclarationStatement();
      case 'export':
        return this.parseExportStatement();   
      case 'break':
        return this.parseBreakStatement();  
      case 'continue':
        return this.parseContinueStatement();
      default:
        return null;
    }
  }

  private skipLineComment() {
    while(this.curCharCode !== 13 && this.curCharCode !== 10 && this.pos < this.input.length) {
      this.advance();
    }
  }

  private skipBlockComment() {
    while(this.input.slice(this.pos, this.pos + 2) !== '*/' && this.pos < this.input.length) {
      this.advance();
    }
    this.pos += 2;
  }

  private consumeBinary() {
    while(this.curCharCode >= 48 && this.curCharCode <= 49 && !this.isReadAll()) {
      this.advance()
    }
  }

  private consumeHex() {
    while(isHexCharCode(this.curCharCode) && !this.isReadAll()) {
      this.advance();
    }
  }

  private consumeUnexpect(stopTest: Function[]) {
    while(!stopTest.some(testFn => testFn(this.curCharCode)) && !this.isReadAll()) {
        this.advance();
    }
  }
};