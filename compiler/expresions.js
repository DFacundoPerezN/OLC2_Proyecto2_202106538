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


export { 
    translateExpression
};