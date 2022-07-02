export const Patterns = {
    keywords: /^(?:break|case|catch|continue|debugger|default|do|else|finally|for|function|if|return|switch|throw|try|var|while|with|instanceof|typeof|void|delete|new|in|const|class|extends|export|import|from|let|as)$/,
    whiteSpaceOrComment: /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g,
    reservedWordsStrict: /^(?:enum|await|implements|interface|let|package|private|protected|public|static|yield)$/,
    reservedWordsStrictBind: /^(?:enum|await|implements|interface|let|package|private|protected|public|static|yield|eval|arguments)$/,
    reservedWords: /^(?:enum|await)$/,
    keywordRelationalOperator: /^in(stanceof)?$/,
    stringStart: /^(?:'|")$/,
    blockStart: /^(?:\[|\(|\{)$/,
    blockClose: /^(?:\]|\)|\})$/,
    operators: /^(?:\+|-|\*|\/|\!|\||%|\&|\^|~|<<|>>|\+\+|--|>|<|>=|<=|\&\&|\|\||==|===|=|\!==|\?|instanceof|in)$/,
    lineBreak: /\r\n?|\n|\u2028|\u2029/, // 换行符
    unaryOperator: /^(?:\+\+|\-\-|\+|\-|\!\~)$/,
    canPrefixAssign: /^(?:\+|\-|\*|\/|\||\%|\&|\^|\<\<|\>\>|\>|\<|\=)$/,
    assign: /^(?:\=|\+\=|\-\=|\*\=|\/\=|\%\=|\|\=|\&\=|\>\>\=|\<\<\=)$/,
    canReapeat: /^(?:\+|\-|\*|\||\&)$/,
    canBeSuffixUnary:/^(?:\+\+|\-\-)$/,
    ParticularLiteral: /\btrue\b|\bfalse\b|\bnull\b|\bundefined\b|\bNaN\b/,
    prefixUnary: /\+|-|~|\+\+|--|\!/
}
