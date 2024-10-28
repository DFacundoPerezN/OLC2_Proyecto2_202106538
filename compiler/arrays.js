import { getType, getDefaultValue, getNewType } from "./synthesis.js";
import { globalPower } from "./compiler.js";
import { translateExpression } from "./expresions.js";

function translateArrayDec (node) {
    //console.log('Array Declaration: '+ JSON.stringify(node, null, 2));
    const type = node.children[0].type;
    console.log('Array of Type: '+type);
    const id = node.children[0].children[1].value;    
    //console.log('Array of ID: '+id);
    // const size = node.children[2].value;
    // const varType = getNewType(type);
    // globalPower.IdMap.set(id, {type: varType, value: new Array(size).fill(getDefaultValue(varType))});
    if (node.children[1].type === 'list'){
        transleteDeclarationList(id, type, node.children[1]);
    } else if (node.children[1].type === 'new'){
        translateDeclarationNew(id, type, node.children[1]);
    } else { //if (node.children[1].type === 'identifier' )
        translateDeclarationCopy(id, type, node.children[1]);
    } 
    
    globalPower.data += "\n";
    console.log(globalPower.IdMap);
}

function transleteDeclarationList(id, type, node){
    const values = [];
    const varType = getNewType(type);
    globalPower.data += "\t" + id + ": ."+varType+" ";
    for (const element of node.children){
        globalPower.data += element.value + " ";
        values.push(element.value);
    }

    globalPower.IdMap.set(id, {type: type, value: values});
}

function translateDeclarationNew(id, type, node){
    const values = [];
    const size = node.children[1].value;
    const defaultValue = getDefaultValue(type);
    const varType = getNewType(type);
    //console.log('Default Value: '+defaultValue);
    globalPower.data += "\t" + id + ": ."+varType+" ";
    for (let i = 0; i < size; i++){
        globalPower.data += defaultValue + " ";
        values.push(defaultValue);
    }
    globalPower.IdMap.set(id, {type: type, value: values});
}

function translateDeclarationCopy(id, type, node){
    const values = [];
    const copyId = node.value;
    const copy = globalPower.IdMap.get(copyId);
    const varType = getNewType(type);
    globalPower.data += "\t" + id + ": ."+varType+" ";
    for (const value of copy.value){
        globalPower.data += value + " ";
        values.push(value);
    }
    globalPower.IdMap.set(id, {type: type, value: values});
}

function arrayValue(node){
    const id = node.children[0].value;      //
    const array = globalPower.IdMap.get(id);
    const type = array.type;
    const index = translateExpression(node.children[1]); //value of the index in t0
    globalPower.output += "\t# Accessing array value\n";
    if (type ==='int' || type === 'float'){
        globalPower.output += "\t" + "li t1, 4\t# bytes de .word(int) o .float\n";
    } else if (type === 'boolean' || type === 'char'){
        globalPower.output += "\t" + "li t1, 1\t# 1 .byte\n";
    }
    globalPower.output += "\tmul t0, t0, t1\t# Multiplicar el índice por el tamaño del tipo\n";
    globalPower.output += "\t" + "la t4, "+ id + "\t# Cargar la dirección\n";
    globalPower.output += "\t" + "add t4, t4, t0\t# Sumar la dirección con el índice\n";
    if (type === 'float'){
        globalPower.output += "\t" + "flw ft0, (t4)\t# Cargar el valor del arreglo a ft0\n";
        return 'ft0';
    }   
    globalPower.output += "\t" + "lw t0, (t4)\t# Cargar el valor del arreglo a t0\n";
    return 't0';
}

function translateArrayAssign(node){
    //get the type of the expression
    const type = getType(node.children[2]);
    //the first node is the id of the array
    const id = node.children[0].value;
    //the second node is the index
    globalPower.output += "\t# Assigning value to array\n";
    const index = translateExpression(node.children[1]);
    if (type ==='int' || type === 'float'){
        globalPower.output += "\t" + "li t1, 4\t# bytes de .word(int) o .float\n";
    } else if (type === 'boolean' || type === 'char'){
        globalPower.output += "\t" + "li t1, 1\t# 1 .byte\n";
    }
    globalPower.output += "\tmul t1, t1, t0\t# Multiplicar el índice por el tamaño del tipo\n";
    globalPower.output += "\t" + "la t4, "+ id + "\t# Cargar la dirección\n";
    globalPower.output += "\t" + "add t4, t4, t1\t# Sumar la dirección con el índice\n";
    //the third node is the expression value
    const exp = translateExpression(node.children[2]); //value of the expression in t0 or ft0
    //If the type is float, the value must be stored in a floating point register
    if( type === 'float'){
        globalPower.output += "\t" + "fsw ft0, (t4) \t# Almacenar el flotante\n";
        return "ft0";
    } //If the type is char or boolean, the value must be stored in a byte
    else if (type === 'char' || type === 'boolean') { 
        globalPower.output += "\t" + "sb t0, (t4)\t# Almacenar el byte\n";
    }
    else if (type === 'int'){//If the type is int, the value must be stored in a word
        globalPower.output += "\t" + "sw t0, (t4)\t# Almacenar el int(word)\n";
    } else {
        globalPower.output += "\t ##TYPE: "+type+" IS NOT IMPLEMENTED YET\n";
    }

    //console.log(globalPower.IdMap);
    return "t0";
}

function printJoin(identifier, call = 'call'){
    const length = globalPower.IdMap.get(identifier).value.length;
    const varType = globalPower.IdMap.get(identifier).type;
    globalPower.output += "# Printing Join\n";
    globalPower.output += "\t"+"la t5, " + identifier + " # Load array direcction\n";
    globalPower.output += "\t"+"li t6, "+length+" # Load array length\n";

    globalPower.output += "join_"+globalPower.tagCounter+": \n";
    globalPower.output += "\t"+"beqz t6, end_join_"+globalPower.tagCounter+" # Si es igual a 0 termina\n";
    switch (varType) {
        case 'int':
            globalPower.output += "\t"+"lw t0, (t5) # Load int value\n";
            globalPower.output += "\t"+"mv a0, t0\n";
            globalPower.output += "\t"+call+" printInt\n";
            globalPower.output += "\t"+"addi t5, t5, 4 # Move to next value\n";
            break;
        case 'float':
            globalPower.output += "\t"+"flw ft0, (t5) # Load float value\n";
            globalPower.output += "\t"+"fmv.s fa0, ft0\t #Copiar el float: ft0 a fa0\n";
            globalPower.output += "\t"+call+" printFloat\n";
            globalPower.output += "\t"+"addi t5, t5, 4 # Move to next value\n";
            break;
        case 'char':
            globalPower.output += "\t"+"lb a1, (t5) # Load byte value\n";
            globalPower.output += "\tli a2, 1\t #espacio a imprimir: 1\n";
            globalPower.output += "\t"+call+" printString\n";
            globalPower.output += "\t"+"addi t5, t5, 1 # Move to next value\n";
            break;
        case 'boolean':
            globalPower.output += "\t"+"lb t0, (t5) # Load byte value\n";
            globalPower.output += "\t"+"mv a0, t0\n";
            globalPower.output += "\t"+call+" printBoolean\n";
            globalPower.output += "\t"+"addi t5, t5, 1 # Move to next value\n";
            break;
        default:
            console.log('Error: Type not supported');
            break;
    }
    globalPower.output += "\t"+"addi t6, t6, -1 # Decrement counter\n";
    globalPower.output += "\t"+"beqz t6, end_join_"+globalPower.tagCounter+" # Si es igual a 0 termina\n";

    globalPower.output += "\t li a0, ','"+ "\n"+
                        "\t li a7, 11 \n"+
                        "\t ecall \n";

    globalPower.output += "\t li a0, ' '"+ "\n"+
                        "\t li a7, 11 \n"+
                        "\t ecall \n";

    globalPower.output += "\t"+"j join_"+globalPower.tagCounter+" # Repeat\n"
                        + "end_join_"+globalPower.tagCounter+":\n";
                        
    globalPower.tagCounter++;
}

function translateIndexOf(node){
    //first node is the id of the array
    const id = node.children[0].value;
    if (!globalPower.IdMap.has(id)){
        throw "Error: Array "+id+" not declared (array no declarado)";
    }
    //second node is the expression value
    const exp = translateExpression(node.children[1]); //the value of the expression is in t0 or ft0
    globalPower.output += "\t# Searching index of array\n";
    const length = globalPower.IdMap.get(id).value.length;
    const varType = globalPower.IdMap.get(id).type;
    globalPower.output += "\t"+"li t3, -1 \t# t3 = -1\n";
    globalPower.output += "\tmv t4, zero \t# t4 = 0\n";
    globalPower.output += "\t"+"la t5, " + id + " # Load array direcction\n";
    globalPower.output += "\t"+"li t6, "+length+" # Load array length\n";

    globalPower.output += "indexS_"+globalPower.tagCounter+": \n";
    globalPower.output += "\t"+"beq t4, t6, end_indexS_"+globalPower.tagCounter+" # Si t4=t6 termina\n";
    if(varType === 'float'){        
        globalPower.output += "\t"+"flw ft1, (t5) # Load float value\n";
        globalPower.output += "\t"+"fsgt ft2, ft1, ft0 # Compare float values\n";
        globalPower.output += "\tbeqz ft2, found_"+globalPower.tagCounter+" # If the value is found\n";
        globalPower.output += "\t"+"addi t5, t5, 4\t# bytes de .float\n";
    } else if(varType === 'int'){
        globalPower.output += "\tlw t1, (t5)\t#\n";
        globalPower.output += "\t"+"beq t1, t0, found_"+globalPower.tagCounter+" # If the value is found\n";
        globalPower.output += "\t"+"addi t5, t5, 4\t# bytes de .word\n";
    } else{
        globalPower.output += "\tlb t1, (t5)\t#\n";
        globalPower.output += "\t"+"beq t1, t0, found_"+globalPower.tagCounter+" # If the value is found\n";
        globalPower.output += "\t"+"addi t5, t5, 1\t# bytes de .word\n";
    }
    globalPower.output += "\taddi t4, t4, 1\n";
    globalPower.output += "\tj indexS_"+globalPower.tagCounter+" \n";
    globalPower.output += "found_"+globalPower.tagCounter+": \n";
    globalPower.output += "\tmv t3, t4 \t# t3 = t4\n";
    globalPower.output += "end_indexS_"+globalPower.tagCounter+": \n";
    globalPower.output += "\tmv t0,t3 \t# t0 = t3\n";
    globalPower.tagCounter++;
    return 't0';
}

export { 
    translateArrayDec,
    arrayValue,
    translateArrayAssign,
    printJoin,
    translateIndexOf
};