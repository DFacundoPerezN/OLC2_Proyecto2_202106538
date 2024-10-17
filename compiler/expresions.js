import { globalPower } from "./compiler.js";
import { getType } from "./synthesis.js";
import { translateSentence } from "./translator.js";

let ultraPointer = 0;
function resetUltraPointer() {
    ultraPointer = 0;
}

function translateExpression(node) {
    console.log('translating Expression: '+ JSON.stringify(node, null, 2));
    if ( node.children.length == 0 ) {
        console.log('No children');
        if(node.type === 'float'){//si es un flotante realiza el proceso de conversion
            var hexFloat = toIEEE754Hex(node.value);
            console.log('Float value: '+node.value+' in hex: '+hexFloat);
            globalPower.output += "\tli a0, " + hexFloat 
            + "\t# Cargar el valor binario del flotante "+node.value+"\n";
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
        if (node.children.length == 1) {// Used for not operation or unary minus
            var rightType = getType(node.children[0]);
        }else{
            console.log('Addition');
            var leftType = getType(node.children[0]);
            var rightType = getType(node.children[1]);
        }

        if(node.type === '+'){
            aritmeticTraductionBase(node, leftType, rightType);
            if (leftType == "float" || rightType == "float") {
                floatOperands(); //Mover a ft1 y ft2 los operandos
                globalPower.output += "\t" + "fadd.s ft0, ft1, ft2\t# Sumar flotantes\n";
                return "ft0";
            } else { //if left and right are int
                intOperands(); //Mover a t1 y t2 los operandos
                globalPower.output += "\tadd t0, t1, t2\t# Sumar enteros\n";
                return "t0";
            }
        }
        else if(node.type === '-'){
            if (node.children.length == 1) {
                console.log('Unary minus');
                var right = translateExpression(node.children[0]);//return t0 or ft0
                if (rightType == "float") {
                    //en ft0 esta el que debemos negar
                    // globalPower.output += "\t"+"flw ft0, "+ultraPointer+"(sp)\t# Mover a ft1 el primer operador\n";
                    // ultraPointer -= 4;
                    globalPower.output += "\t" + "fneg.s ft0, ft0 \t# Negative float\n";
                    globalPower.output += "\t" + "fsw ft0, "+ultraPointer+"(sp)\t# Guardar el flotante al stack\n";
                    ultraPointer += 4;
                    return "ft0";
                } else { //if right is int
                    // globalPower.output += "\t"+"lw t0, "+ultraPointer+"(sp)\t# Mover a t0 el primer operador\n";
                    // ultraPointer -= 4;
                    globalPower.output += "\tneg t0, t0\t# Negative\n";
                    globalPower.output += "\t"+"sw t0, "+ultraPointer+"(sp)\t# Mover a stack\n";
                    ultraPointer += 4;
                    return "t0";
                }
            } else { //if node.children.length == 2
                aritmeticTraductionBase(node, leftType, rightType);
                if (leftType == "float" || rightType == "float") {
                    floatOperands(); //Mover a ft1 y ft2 los operandos
                    globalPower.output += "\t" + "fsub.s ft0, ft1, ft2\t# Restar flotantes\n";
                    return "ft0";
                } else { //if left is int
                    intOperands(); //Mover a t1 y t2 los operandos
                    globalPower.output += "\tsub t0, t1, t2\t# Restar enteros\n";
                    return "t0";
                }
            }
        } else if(node.type === '*'){
            console.log('Multiplication');
            aritmeticTraductionBase(node, leftType, rightType);
            if (leftType == "float" || rightType == "float") {
                floatOperands(); //Mover a ft1 y ft2 los operandos
                globalPower.output += "\t" + "fmul.s ft0, ft1, ft2\t# Multiplicar flotantes\n";
                return "ft0";
            } else { //if left and right are int
                intOperands(); //Mover a t1 y t2 los operandos
                globalPower.output += "\tmul t0, t1, t2\t# Multiplicar enteros\n";
                return "t0";
            }
        } else if(node.type === '/'){
            console.log('Division');
            aritmeticTraductionBase(node, leftType, rightType);
            if (leftType == "float" || rightType == "float") {
                floatOperands(); //Mover a ft1 y ft2 los operandos
                globalPower.output += "\t" + "fdiv.s ft0, ft1, ft2\t# Dividir flotantes\n";
                return "ft0";
            } else { //if are Integers
                intOperands(); //Mover a t1 y t2 los operandos
                globalPower.output += "\tdiv t0, t1, t2\t# Dividir enteros\n";
                return "t0";
            }
        } else if(node.type === '%'){
            console.log('Modulus');
            aritmeticTraductionBase(node, leftType, rightType);
            if (leftType == "float" || rightType == "float") {
                console.log('Error: Operands must be int → '+leftType+' '+rightType);
            } else { //if are Integers
                intOperands(); //Mover a t1 y t2 los operandos
                globalPower.output += "\trem t0, t1, t2\t# Modulo enteros\n";
                return "t0";
            }
        } else if(node.type === '=='){
            getType(node);
            relationalTraductionBase(node, leftType, rightType);
            if(leftType == "float"  || rightType == "float"){
                floatOperands(); //Mover a ft1 y ft2 los operandos
                globalPower.output += "\t" + "feq.s t0, ft1, ft2\t# Comparar flotantes\n";
            } else if(leftType == "string" && rightType == "string"){// if(leftType == "string" && rightType == "string")
                globalPower.output += "\t"+"#STRING EQUAL NOT IMPLEMENTED\n";
            } else {
                if (leftType == "int") {
                    intOperands(); //Mover a t1 y t2 los operandos
                } else { //if are chars or booleans
                    byteOperands();
                }
                globalPower.output += "\t" + "xor t3, t1, t2\t# Compara bits\n";
                globalPower.output += "\t" + "seqz t0, t3\t# Si t3 = 0, t1 = 1 (true)\n";
            }
            return "t0";
        } else if(node.type === '!='){
            getType(node);
            relationalTraductionBase(node, leftType, rightType);
            if(leftType == "float"  || rightType == "float"){
                floatOperands(); //Mover a ft1 y ft2 los operandos
                globalPower.output += "\t" + "feq.s t0, ft1, ft2\t# Comparar flotantes\n";
                globalPower.output += "\txori t0, t0 1	#Changing last bit\n";
            } else if(leftType == "string" && rightType == "string"){// if(leftType == "string" && rightType == "string")
                globalPower.output += "\t"+"#STRING NOT EQUAL NOT IMPLEMENTED\n";
            } else {
                if (leftType == "int") {
                    intOperands(); //Mover a t1 y t2 los operandos
                } else { //if are chars or booleans
                    byteOperands();
                }
                globalPower.output += "\t" + "xor t3, t1, t2\t# Comparar temporales\n";
                globalPower.output += "\t" + "snez t0, t3\t# Si t3 = 0, t1 = 1 (true)\n";
            }
            return "t0";
        } else if(node.type === '<='){
            getType(node);
            relationalTraductionBase(node, leftType, rightType);
            if(leftType == "float"  || rightType == "float"){
                floatOperands(); //Mover a ft1 y ft2 los operandos
                globalPower.output += "\t" + "fle.s t0, ft1, ft2\t# Comparar flotantes <=\n";
            } else {
                if (leftType == "int") {
                    intOperands(); //Mover a t1 y t2 los operandos
                } else { //if are chars or booleans
                    byteOperands();
                }
                globalPower.output += "\t" + "sgt t3, t1, t2    \t# Compara si t1 > t2\n";
                globalPower.output += "\t" + "xori t0, t3, 1\t# Se invierte el resultado (1 bit)\n";
            }
            return "t0";
        } else if(node.type === '>='){
            getType(node);
            relationalTraductionBase(node, leftType, rightType);
            if(leftType == "float"  || rightType == "float"){
                floatOperands(); //Mover a ft1 y ft2 los operandos
                globalPower.output += "\t" + "fge.s t0, ft1, ft2\t# Comparar flotantes\n";
            } else {
                if (leftType == "int") {
                    intOperands(); //Mover a t1 y t2 los operandos
                } else { //if are chars or booleans
                    byteOperands();
                }                
                globalPower.output += "\t" + "slt t3, t1, t2    \t# Compara si t1 < t2\n";
                globalPower.output += "\t" + "xori t0, t3, 1\t# Se invierte el resultado (1 bit)\n";
            }
            return "t0";
        } else if(node.type === '<'){
            getType(node);
            relationalTraductionBase(node, leftType, rightType);
            if(leftType == "float"  || rightType == "float"){
                floatOperands(); //Mover a ft1 y ft2 los operandos
                globalPower.output += "\t" + "flt.s t0, ft1, ft2\t# Comparar flotantes\n";
            } else {
                if (leftType == "int") {
                    intOperands(); //Mover a t1 y t2 los operandos
                } else { //if are chars or booleans
                    byteOperands();
                }                
                globalPower.output += "\t" + "slt t0, t1, t2    \t# Compara si t1 < t2\n";
            }
            return "t0";
        } else if(node.type === '>'){
            getType(node);
            relationalTraductionBase(node, leftType, rightType);
            if(leftType == "float"  || rightType == "float"){
                floatOperands(); //Mover a ft1 y ft2 los operandos
                globalPower.output += "\t" + "fgt.s t0, ft1, ft2\t# Comparar flotantes\n";
            } else if(leftType == "string" && rightType == "string"){// if(leftType == "string" && rightType == "string")
                globalPower.output += "\t"+"#STRING NOT IMPLEMENTED\n";
            } else {
                if (leftType == "int") {
                    intOperands(); //Mover a t1 y t2 los operandos
                } else { //if are chars or booleans
                    byteOperands();
                }
                globalPower.output += "\t" + "sgt t0, t1, t2    \t# Compara si t1 > t2\n";
            }
            return "t0";
        } else if(node.type === '&&'){
            getType(node);
            byteTraductionBase(node); //Operaciones para guardar los operandos en el stack
            byteOperands(); //Mover a t1 y t2 los operandos en bytes
            globalPower.output += "\t" + "and t0, t1, t2\t# AND de enteros\n";
        } else if(node.type === '||'){
            getType(node);
            byteTraductionBase(node); //Operaciones para guardar los operandos en el stack
            byteOperands(); //Mover a t1 y t2 los operandos en bytes
            globalPower.output += "\t" + "or t0, t1, t2\t# OR de enteros\n";
        } else if(node.type === '!'){
            var right = translateExpression(node.children[0]);//return t0 or ft0
            //ultraPointer -= 4; //1
            globalPower.output += "\txori t0, t0, 1\t\n";
            //ultraPointer += 4; //1
        } 
        else{
            console.log(node.type+' Not implemented yet'); 
            globalPower.output += "\t"+"li t0, " + node.value + "\n";
            return "t0";
        }

    }
}

function intOperands() {
    globalPower.output += "\t"+"lw t2, "+ultraPointer+"(sp)\t# Mover a t2 segundo operador\n";
    ultraPointer -= 4;
    globalPower.output += "\t"+"lw t1, "+ultraPointer+"(sp)\t# Mover a t1 el primer operador\n";
    //ultraPointer -= 4;
}

function floatOperands() {
    globalPower.output += "\t"+"flw ft2, "+ultraPointer+"(sp)\t# Mover a ft2 segundo operador\n";
    ultraPointer -= 4;
    globalPower.output += "\t"+"flw ft1, "+ultraPointer+"(sp)\t# Mover a ft1 el primer operador\n";
    //ultraPointer -= 4;
}

function aritmeticTraductionBase(node, leftType, rightType) {//Can be improved to use less parameters and less registers
    if (leftType == "float") {
        var left = translateExpression(node.children[0]); // return ft0
        //globalPower.output += "\tfmv.s ft1, ft0\t# Copiar el flotante del primer operador en ft1\n";
        globalPower.output += "\t" + "fsw ft0, "+ultraPointer+"(sp)\t# Mover el primer flotante al stack\n";
        ultraPointer += 4;
        var right = translateExpression(node.children[1]); //if float, return ft0, if int, return t0
        if (rightType == "int") { //need to convert right to float
            globalPower.output += "\t" + "fcvt.s.w ft2, t0\t# Convertir 2do operador a flotante en ft2\n";
            globalPower.output += "\t" + "fsw ft2, "+ultraPointer+"(sp)\t# Mover el flotante al stack\n";
        } else { //both are float
            //globalPower.output += "\tfmv.s ft2, ft0\t# Copiar el flotante del 2do operador en ft2\n";
            globalPower.output += "\t" + "fsw ft0, "+ultraPointer+"(sp)\t# Mover el segundo flotante al stack\n";
        }
        //ultraPointer += 4;
        // return "ft0";
    } else { //if left is int
        var left = translateExpression(node.children[0]); // return t0
        if (rightType == "float") { //need to convert left(t0) to float
            globalPower.output += "\t" + "fcvt.s.w ft1, t0\t# Convertir a flotante el primer operador\n";
            globalPower.output += "\t" + "fsw ft1, "+ultraPointer+"(sp)\t# Mover el flotante al stack\n";
            ultraPointer += 4;
            var right = translateExpression(node.children[1]); //return ft0
            globalPower.output += "\t" + "fsw ft0, "+ultraPointer+"(sp)\t# Mover el flotante a stack\n";
            //ultraPointer += 4;
            //globalPower.output += "\t" + "fadd.s ft0, ft1, "+right+"\t# Sumar flotantes\n";
            //return "ft0";
        } 
        else{ //both are int
            globalPower.output += "\t"+"sw t0, "+ultraPointer+"(sp)\t# Mover a stack (primer operador)\n";
            ultraPointer += 4;
            var right = translateExpression(node.children[1]); //if float, return ft0, if int, return t0
            globalPower.output += "\t"+"sw t0, "+ultraPointer+"(sp)\t# Mover a stack (segundo operador)\n";
            //ultraPointer += 4;
            //globalPower.output += "\tmv t2, t0\t# Mover t2 (segundo operador)\n";//(Honestamente podria dejarlo en t0)
            //return "t0";
        }
    }
}

function byteOperands() {
    globalPower.output += "\t"+"lb t2, "+ultraPointer+"(sp)\t# Mover a t2 segundo operador\n";
    ultraPointer -= 4; //1
    globalPower.output += "\t"+"lb t1, "+ultraPointer+"(sp)\t# Mover a t1 el primer operador\n";
    //ultraPointer -= 1;
}

function stringOperands() {
    
}

function relationalTraductionBase(node, leftType, rightType) {
    if (leftType == "float") {
        aritmeticTraductionBase(node, leftType, rightType);
    } else if (leftType == "int") { 
        aritmeticTraductionBase(node, leftType, rightType);
    } else if (leftType == "string"){
        globalPower.output += "\t"+"#STRING EQUAL NOT IMPLEMENTED\n";
    } else {
        byteTraductionBase(node);      
    }
}
    
function byteTraductionBase(node) {
    var left = translateExpression(node.children[0]); //if float, return ft0, if int, return t0
    globalPower.output += "\t"+"sb t0, "+ultraPointer+"(sp)\t# Mover a stack (primer byte)\n";
    ultraPointer += 4; //1
    var right = translateExpression(node.children[1]); //if float, return ft0, if int, return t0
    globalPower.output += "\t"+"sb t0, "+ultraPointer+"(sp)\t# Mover a stack (segundo byte)\n";
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
    translateExpression,
    resetUltraPointer
};