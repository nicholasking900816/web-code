import { priorityMap } from './constants';
import { Patterns } from './patterns';
import { UnExpectStatement } from './lib/Statement/UnExpectStatement';
import { AstNode } from './lib/AstNode';
// Test whether a given character code starts an identifier.

export function isIdentifierStart(code) {
  if (code < 65) return code === 36
  if (code < 91) return true
  if (code < 97) return code === 95
  if (code < 123) return true
  // if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code))
  return false
}

// Test whether a given character is part of an identifier.

export function isIdentifierChar(code) {
  if (code < 48) return code === 36
  if (code < 58) return true
  if (code < 65) return false
  if (code < 91) return true
  if (code < 97) return code === 95
  if (code < 123) return true
  // if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code))
  return false
}

export function isNumberCharCode(code) {
  return code >= 48 && code <= 57;
}

export function isNumberStart(code) {
  return code >= 48 && code <= 57;
}

export function isOperator(word: string) {
  return Patterns.operators.test(word);
}

export function isHexCharCode(code: number) {
  return code >= 48 && code <= 57 || code >= 97 && code <= 122 || code >= 65 && code <= 90;
}

export function getPriority(tokenOrLiteratureStatement: any) {
  if (typeof tokenOrLiteratureStatement === 'string') {
    return priorityMap[tokenOrLiteratureStatement] || -1
  } else {
    return -1;
  }
}

export function getLast(arr: Array<any>) {
  return arr[arr.length - 1];
}

export function assertUnexpect(parent: AstNode, child: AstNode, getUnexpectMsg?: (child: AstNode) => string | null) {
  if (child && child.type === 'UnExpectStatement') {
    parent.unexpectedNodes.push(child);
    return true;
  }
  
  let msg = getUnexpectMsg ? getUnexpectMsg(child) : null;
  if (msg) {
    parent.unexpectedNodes.push(new UnExpectStatement(child, msg));
    return true;
  } 
}

export function assertExpectNullStatement(parent: AstNode, child: AstNode, expect: string) {
  if (child) {
    assertUnexpect(parent, child, () => {
      return `expect "${expect}"`
    });
    return false;
  }
  return true;
}