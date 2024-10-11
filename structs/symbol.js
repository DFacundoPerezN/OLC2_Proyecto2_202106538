class Symbol_s {
  constructor(id, type_symbol, type_var, line, column) {
    this.id = id;
    this.type_symbol = type_symbol;
    this.type_var = type_var;
    this.line = line;
    this.column = column;
    this.ambit = 'global';
  }
}

export {
  Symbol_s
};