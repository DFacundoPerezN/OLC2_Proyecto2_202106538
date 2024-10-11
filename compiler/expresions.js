import { globalPower } from "./compiler.js";
import { getType } from "./synthesis.js";
import { translateSentence } from "./translator.js";

function translateExpression(node) {
    console.log('translating: '+ JSON.stringify(node, null, 2));
    if ( node.children.length == 0 ) {
        if(node.type == 'float'){
            var hexFloat = toIEEE754Hex(node.value);
            globalPower.output += "\tli a0, " + hexFloat 
            + "\t# Cargar el valor binario del flotante\n";
            globalPower.output += "\tfmv.w.x ft0, a0    "
            +"\t# Mover el valor binario a un registro flotante\n";
            return "ft0";
        }
        //else if(node.type == 'int'){ //si es un entero
        globalPower.output += "\t"+"li t0, " + node.value + "\n";
        return "t0";
    }
}

function toIEEE754Hex(num) {
    // Crear un buffer de 4 bytes (32 bits)
    let buffer = new ArrayBuffer(4);    
    // Crear un DataView que nos permita manipular los bytes del buffer
    let view = new DataView(buffer);    
    // Escribir el número como un flotante de 32 bits
    view.setFloat32(0, num);    
    // Leer el contenido como un entero sin signo de 32 bits
    let intRepresentation = view.getUint32(0);    
    // Convertir a hexadecimal
    return '0x' + intRepresentation.toString(16).toUpperCase().padStart(8, '0');
}

function translatePrint(node){
    for (const child of node.children) {
        var type = getType(child);

        if(type == "identifier"){
            var id = child.value;
            var varType = globalPower.IdMap.get(id).type;
            if(varType == "int"){
                globalPower.output += "\t"+"la a0, " + id + "\n";
                globalPower.output += "\t"+"li a7, 1\n";
                globalPower.output += "\t"+"ecall\n";
            } else if(varType == "float"){
                globalPower.output += "\t"+"la a0, " + id + "\n";
                globalPower.output += "\t"+"li a7, 2\n";
                globalPower.output += "\t"+"ecall\n";
            } else if(varType == "string"){
                var varLength = globalPower.IdMap.get(id).length;
                globalPower.output += "\t"+"la a1, " + id + "\n";
                globalPower.output += "\t"+"li a2, "+(varLength-1)+"\n";
                globalPower.output += "\t"+"call printString\n";
            } else {
                console.log("Error: Type mismatch: " + varType + " !== " + type);
            }
        }
        else if(type == "string"){
            globalPower.output += "\t"+"la a1, " + saveStringforPrint(child.value) + "\n";
            globalPower.output += "\t"+"li a2, "+ (child.value.length-1)+"\n";
            globalPower.output += "\t"+"call printString\n";
            //incrementar contador de strings
            globalPower.printCounter++;
        } else {
            //translateExpression
            globalPower.output += "\t"+"li a0, " + child.value + "\n";
            globalPower.output += "\t"+"li a7, 1\n";
            globalPower.output += "\t"+"ecall\n";
        }        
    }
    globalPower.output += "\tcall printNewline\t# Imprimir un salto de línea\n";
}

function saveStringforPrint(value){
    let id = "print_" + globalPower.printCounter.toString();
    globalPower.data += "\t" + id +": .asciz " + value + "\n";
    return id;
}

export { 
    translateExpression,
    translatePrint 
};