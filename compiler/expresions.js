import { globalPower } from "./compiler.js";
import { getType } from "./synthesis.js";
import { translateSentence } from "./translator.js";

function translateExpression(node) {
    console.log('translating Expression: '+ JSON.stringify(node, null, 2));
    if ( node.children.length == 0 ) {
        console.log('No children');
        if(node.type === 'float'){//si es un flotante realiza el proceso de conversion
            var hexFloat = toIEEE754Hex(node.value);
            console.log('Float value: '+node.value+' in hex: '+hexFloat);
            globalPower.output += "\tli a0, " + hexFloat 
            + "\t# Cargar el valor binario del flotante\n";
            globalPower.output += "\tfmv.w.x ft0, a0    "
            +"\t# Mover el valor binario a un registro flotante\n";
            //console.log(globalPower.output);
            return "ft0";
        }
        else if(node.type === 'identifier'){
            console.log('Identifier');
            var id = node.value;
            var varType = globalPower.IdMap.get(id).type;
            if(varType == "int" || varType == "char" || varType == "boolean"){
                //Antes devolvia la direccion ahora devuelve el valor
                globalPower.output += "\tla t2, " + id + "\t #dirección de la variable\n";
                globalPower.output += "\tlw t0, (t2)\t#Cargar el valor de la variable\n";
                return "t0";
            } else if(varType == "float"){
                globalPower.output += "\tla t2, "+ id+"\n";
                globalPower.output += "\tflw ft0, (t2)\n";
                return "ft0";
            } else if(varType == "string"){ 
                globalPower.output += "\t#Not implemented opration with string\n";
                var varLength = globalPower.IdMap.get(id).value.length;
                globalPower.output += "\t"+"la t0, " + id + "\n";
                globalPower.output += "\t"+"li t1, "+(varLength-1)+"\n";
                globalPower.output += "\t"+"call printString\n";
                return "t0";
            } else if (globalPower.IdMap.get(id).value == "null") {
                globalPower.output += "\tla t0, null\n";
                return "t0";
            } else {
                console.log("Error: Type mismatch: " + varType + " !== " + type);
            }
        }
        // I think there are missing specifications for other types// Creo que faltan especificaciones para otros tipos
        else { 
            globalPower.output += "\t"+"li t0, " + node.value + "\n";
            return "t0";
        }
    }else{
        if(node.type === '+'){
            console.log('Addition');
            var leftType = getType(node.children[0]);
            var rightType = getType(node.children[1]);
            aritmeticTraductionBase(node, leftType, rightType);
            if (leftType == "float" || rightType == "float") {
                globalPower.output += "\t" + "fadd.s ft0, ft1, ft2\t# Sumar flotantes\n";
                return "ft0";
            } else { //if left is int
                globalPower.output += "\tadd t0, t1, t2\t# Sumar enteros\n";
                return "t0";
            }
        }
        else if(node.type === '-'){
            if (node.children.length == 1) {
                console.log('Unary minus');
                var rightType = getType(node.children[0]);
                var right = translateExpression(node.children[0]);
                if (rightType == "float") {
                    globalPower.output += "\t" + "fneg.s ft0, "+right+" \t# Negative float\n";
                    return "ft0";
                } else { //if right is int
                    globalPower.output += "\tneg t0, "+right+"\t# Negative\n";
                    return "t0";
                }
            } else {
                var leftType = getType(node.children[0]);
                var rightType = getType(node.children[1]);
                aritmeticTraductionBase(node, leftType, rightType);
                if (leftType == "float" || rightType == "float") {
                    globalPower.output += "\t" + "fsub.s ft0, ft1, ft2\t# Restar flotantes\n";
                    return "ft0";
                } else { //if left is int
                    globalPower.output += "\tsub t0, t1, t2\t# Restar enteros\n";
                    return "t0";
                }
            }
        } else if(node.type === '*'){
            console.log('Multiplication');
            var leftType = getType(node.children[0]);
            var rightType = getType(node.children[1]);
            aritmeticTraductionBase(node, leftType, rightType);
            if (leftType == "float" || rightType == "float") {
                globalPower.output += "\t" + "fmul.s ft0, ft1, ft2\t# Multiplicar flotantes\n";
                return "ft0";
            } else { //if left and right are int
                globalPower.output += "\tmul t0, t1, t2\t# Multiplicar enteros\n";
                return "t0";
            }
        } else if(node.type === '/'){
            console.log('Division');
            var leftType = getType(node.children[0]);
            var rightType = getType(node.children[1]);
            aritmeticTraductionBase(node, leftType, rightType);
            if (leftType == "float" || rightType == "float") {
                globalPower.output += "\t" + "fdiv.s ft0, ft1, ft2\t# Dividir flotantes\n";
                return "ft0";
            } else { //if are Integers
                globalPower.output += "\tdiv t0, t1, t2\t# Dividir enteros\n";
                return "t0";
            }
        } else if(node.type === '%'){
            console.log('Modulus');
            var leftType = getType(node.children[0]);
            var rightType = getType(node.children[1]);
            aritmeticTraductionBase(node, leftType, rightType);
            if (leftType == "float" || rightType == "float") {
                console.log('Error: Operands must be int → '+leftType+' '+rightType);
            } else { //if are Integers
                globalPower.output += "\trem t0, t1, t2\t# Modulo enteros\n";
                return "t0";
            }
        }
        console.log('Not implemented yet'); 
        globalPower.output += "\t"+"li t0, " + node.value + "\n";
        return "t0";

    }
}

function aritmeticTraductionBase(node, leftType, rightType) {//Can be improved to use less parameters and less registers
    if (leftType == "float") {
        var left = translateExpression(node.children[0]); // return ft0
        globalPower.output += "\tfsgnj.s ft1, "+left+", "+left+"\t# Copiar el flotante del primer operador en ft1\n";
        var right = translateExpression(node.children[1]); //if float, return ft0, if int, return t0
        if (rightType == "int") { //need to convert right to float
            globalPower.output += "\t" + "fcvt.s.w ft2, "+right+"\t# Convertir 2do operador a flotante en ft2\n";
        } else { //both are float
            globalPower.output += "\tfsgnj.s ft2, "+right+", "+right+"\t# Copiar el flotante del 2do operador en ft2\n";
        }
        // globalPower.output += "\t" + "fadd.s ft0, ft1, ft2\t# Sumar flotantes\n";
        // return "ft0";
    } else { //if left is int
        var left = translateExpression(node.children[0]); // return t0
        if (rightType == "float") { //need to convert left to float
            globalPower.output += "\t" + "fcvt.s.w ft1, "+left+"\t# Convertir a flotante el primer operador\n";
            var right = translateExpression(node.children[1]); //return ft0
            globalPower.output += "\tfsgnj.s ft2, "+right+", "+right+"\t# Copiar el flotante del 2do operador en ft2\n";
            //globalPower.output += "\t" + "fadd.s ft0, ft1, "+right+"\t# Sumar flotantes\n";
            //return "ft0";
        } 
        else{ //both are int
            globalPower.output += "\tmv t1, "+left+"\t# Mover t1 (primer operador)\n";
            var right = translateExpression(node.children[1]); //if float, return ft0, if int, return t0
            globalPower.output += "\tmv t2, "+right+"\t# Mover t2 (segundo operador)\n";//(Honestamente podria dejarlo en t0)
            //return "t0";
        }
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