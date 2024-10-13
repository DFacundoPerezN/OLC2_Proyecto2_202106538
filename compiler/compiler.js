import { NodeBase } from '../structs/nodes.js';
import { Symbol_s } from '../structs/symbol.js';
import { translateSentence } from './translator.js';

let globalPower = {
    IdMap: new Map(),
    data: '.data\n',
    output: '.text\n .globl _start\n',
    tagCounter: 0,
    printCounter: 0,
    symbolTable: []
};

class Compiler {
    constructor() {
        this.ast = null;
    }
    
    addAst(ast) {
        this.ast = ast;
    }
   
    getOutput() {
    return globalPower.data + globalPower.output + '\n\n'+
    'endProgram:    # Finalizar el programa \n'+
    '\tli   a0, 0     \n'+
    '\tli   a7, 93      # Syscall para salir del programa\n'+
    '\tecall\n\n'+
    //Print string function
    'printString: \n'+
    '\tli a0, 1 \n'+
    '\tli a7, 64 \n'+
    '\tecall \n'+
    '\tret \n\n'+
    //Print new line function
    'printNewline:\n'+
    '\tla a1, newline         # Cargar la direccion del salto de linea"\n'+
    '\tli a2, 1               # Longitud de 1 byte"\n'+
    '\tjal t4, printString \n'+
    '\tret\n'+
    //Print Integer function
    'printInt:\n'+
    '\tlw a0, (a1)\n'+
	'\tli a7, 1 \n'+
	'\tecall\n'+
    '\tret\n'+
    //Print Float function
    'printFloat:\n'+
	'\tli a7, 2 \n'+
	'\tecall\n'+
    '\tret\n'
    ;
    }   

    resetOutput() {  
        globalPower.data = '.data\n\tnewline: .byte 10\n\tnull: .string "null"\n\ttrue: .string "true"\n\tfalse: .string "false"\n';
        globalPower.output = '.text \n.globl _start\n\n_start:\n\n';
        globalPower.tagCounter = 0;
        globalPower.printCounter = 0;
    }

    resetIdMap() {
    globalPower.IdMap.clear();
    }

    execute() {
        translate(this.ast);
    }
}

function addSymbol(id, type_symbol, type_var, line, column){
    try{
    globalPower.symbolTable.push(new Symbol_s(id, type_symbol, type_var, line, column));
    } catch (e) {
        console.log('Error adding symbol to symbolTable: '+e);
    }
  }

function translate(node){
    for (const child of node.children) {
        translateSentence(child);
    }
}

export{
    Compiler,
    addSymbol,
    globalPower
}