export const IS_PARSING_COMPUTE = 0b1;
export const IS_PARSING_CASE = 0b10;
export const IS_PARSING_TRY = 0b100;
export const IS_PARSING_DOWHILE = 0b1000;
export const IS_PARSING_CLASSDECLARATION = 0b10000;
export const IS_PARSING_IMPORT = 0b100000;
export const IS_PARSING_VARDECLARATION = 0b1000000;
export const IS_PARSING_FUNDECLARATION = 0b10000000;
export const IS_PARSING_ACCESSPROP = 0b100000000;
export const IS_PARSING_SWITCH = 0b1000000000;
export const IS_PARSING_TYPEOF = 0b10000000000;
export const IS_PARSING_VOID = 0b100000000000;
export const IS_PARSING_OBJECT_KEY = 0b1000000000000;

export const NEED_PURE_IDENTIFIER = IS_PARSING_FUNDECLARATION | IS_PARSING_ACCESSPROP;

export const priorityMap = {
  '+': 14,
  '-': 14,
  '*': 15,
  '/': 15,
  '=': 3,
  '+=': 3,
  '-=': 3,
  '*=': 3,
  '/=': 3,
  '~=': 3,
  '^=': 3,
  '|=': 3,
  '&=': 3,
  '?': 4,
  'instanceof': 4,
  'in': 4,
  '&&': 6,
  '||': 5,
  '&': 9,
  '^': 8,
  '|': 7,
  '==': 10,
  '===': 10,
  '!=': 10,
  '!==': 10,
  '>': 11,
  '>=': 11,
  '<': 11,
  '<=': 11
}

export const ExpectCloseMap = {
  '[': ']',
  '(': ')',
  '"': '"',
  '\'': '\'',
  '{': '}',
  '\`': '\`',
  '\/': '\/'
}

const exprBit = 0b1 << 31;
const staBit = 0b1 << 30;
const expressionKey = [
  'IdentifierLiteralExpression', 'NumberLiteralExpression', 'StringLiteralExpression', 'ArrayLiteralExpression',
  'ObjectLiteralExpression', 'ParticularLiteralExpression', 'TemplateLiteralExpression', 'TernaryExpression',
  'UnaryExpression', 'AssignmentExpression', 'BinaryExpression', 'MemberExpression',
  'CallExpression', 'RegExpression', 'NewExpression', 'TypeOfExpression',
  'FunctionExpression', 'VoidExpression', 'BracketEnwrapedExpressioin'
]

const literalKey = [
  'IdentifierLiteralExpression', 'NumberLiteralExpression', 'StringLiteralExpression', 'ArrayLiteralExpression',
  'ObjectLiteralExpression', 'ParticularLiteralExpression', 'TemplateLiteralExpression'
]

const loopKey = [
  'DoWhileStatement', 'ForStatement', 'ForOfStatement', 'WhileStatement', 'ForInStatement'
]

const declarationKey = [
  'VariableDeclarationStatement', 'FunctionDeclarationStatement', 'ExportDeclarationStatement', 'ClassDeclarationStatement'
]

export const NodeCode = {
  IdentifierLiteralExpression: exprBit | 0b1,
  NumberLiteralExpression: exprBit | 0b1 << 1,
  StringLiteralExpression: exprBit | 0b1 << 2, 
  ArrayLiteralExpression: exprBit | 0b1 << 3,
  ObjectLiteralExpression: exprBit | 0b1 << 4,
  ParticularLiteralExpression:  exprBit | 0b1 << 5,
  TemplateLiteralExpression:  exprBit | 0b1 << 6,
  ObjectKey: null,
  Literal: null,
  AssigmentLeft: null,

  TernaryExpression: exprBit | 0b1 << 7,
  UnaryExpression: exprBit | 0b1 << 8,
  AssignmentExpression: exprBit | 0b1 << 9,
  BinaryExpression: exprBit | 0b1 << 10,
  MemberExpression: exprBit | 0b1 << 11,
  CallExpression: exprBit | 0b1 << 12,
  RegExpression: exprBit | 0b1 << 13,
  NewExpression: exprBit | 0b1 << 14,
  TypeOfExpression: exprBit | 0b1 << 15,
  FunctionExpression: exprBit | 0b1 << 16,
  VoidExpression:  exprBit | 0b1 << 17,
  BracketEnwrapedExpressioin: exprBit | 0b1 << 18,
  Expression: null,

  IfStatement: staBit | 0b1,
  VariableDeclarationStatement: staBit | 0b1 << 1,
  FunctionDeclarationStatement: staBit | 0b1 << 2,
  ImportStatement: staBit | 0b1 << 3,
  ClassDeclarationStatement: staBit | 0b1 << 4,
  SwitchCaseStatement: staBit | 0b1 << 5,
  SwitchStatement: staBit | 0b1 << 6,
  DoWhileStatement: staBit | 0b1 << 7,
  ExportDeclarationStatement: staBit | 0b1 << 8,
  ForStatement: staBit | 0b1 << 9,
  ForOfStatement: staBit | 0b1 << 10,
  TryCathchStatement: staBit | 0b1 << 11,
  WhileStatement: staBit | 0b1 << 12,
  ForInStatement: staBit | 0b1 << 13,
  WithStatement: staBit | 0b1 << 14,
  ReturnStatement: staBit | 0b1 << 15,
  BreakStatement: staBit | 0b1 << 16,
  ContinueStatement: staBit | 0b1 << 17,
  ThrowStatement: staBit | 0b1 << 18,
  DeleteStatement: staBit | 0b1 << 19,
  UnexpectStatement: staBit | 0b1 << 20,
  Loop: null,
  Declaration: null
}

NodeCode.ObjectKey = NodeCode.StringLiteralExpression | NodeCode.IdentifierLiteralExpression;
NodeCode.Literal = literalKey.reduce((result, key) => result |= NodeCode[key], 0);
NodeCode.AssigmentLeft = NodeCode.IdentifierLiteralExpression | NodeCode.MemberExpression;
NodeCode.Expression = expressionKey.reduce((result, key) => result |= NodeCode[key], 0);
NodeCode.Loop = loopKey.reduce((result, key) => result |= NodeCode[key], 0);
NodeCode.Declaration = declarationKey.reduce((result, key) => result |= NodeCode[key], 0);

