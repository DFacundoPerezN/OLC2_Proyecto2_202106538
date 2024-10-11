class Error {
    constructor(type, line, column, description) {
        this.type = type;
        this.line = line;
        this.column = column;
        this.description = description;
    }
}