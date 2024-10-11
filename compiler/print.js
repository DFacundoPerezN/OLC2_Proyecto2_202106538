import { getType } from "./synthesis.js";
import { globalPower } from "./compiler.js";

function translatePrint(node){
    for (const child of node.children) {
        var type = getType(child);

        if(child.type == "identifier"){
            var id = child.value;
            var varType = globalPower.IdMap.get(id).type;
            if (globalPower.IdMap.get(id).value == "null") {
                globalPower.output += "\tla a1, null\n";
                globalPower.output += "\tli a2, 4\n";
                globalPower.output += "\tcall printString\n";                
            }
            else if(varType == "int"){
                globalPower.output += "\t#Llevando a imprimir entero\n";
                globalPower.output += "\t"+"la a1, " + id + "\n";
                //globalPower.output += "\t"+"lw a0, (a1)\n";
                globalPower.output += "\tcall printInt\n";
                // globalPower.output += "\t"+"li a7, 1\n";
                // globalPower.output += "\t"+"ecall\n";
            } else if(varType == "float"){
                globalPower.output += "\t#Todavia no se implementa el print de floats\n";
                // globalPower.output += "\t"+"la a0, " + id + "\n";
                // globalPower.output += "\t"+"li a7, 2\n";
                // globalPower.output += "\t"+"ecall\n";
            } else if(varType == "char"){
                globalPower.output += "\tla a1, " + id + "\n";
                globalPower.output += "\tli a2, 1\n";
                globalPower.output += "\tcall printString\n";
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
    translatePrint
};