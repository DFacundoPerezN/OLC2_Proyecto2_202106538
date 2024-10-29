import { getType } from "./synthesis.js";
import { globalPower } from "./compiler.js";
import { translateExpression } from "./expresions.js";
import { printJoin } from "./arrays.js";

function translatePrint(node, call= 'call'){
    for (const child of node.children) {
        var type = getType(child);

        if(child.type == "identifier"){
            var id = child.value;
            var varType = globalPower.IdMap.get(id).type;
            if (globalPower.IdMap.get(id).value == "null") {
                globalPower.output += "\tla a1, null\n";
                globalPower.output += "\tli a2, 4\n";
                globalPower.output += "\t"+call+" printString\n";                
            }
            else if(varType == "int"){
                globalPower.output += "\t#Llevando a imprimir entero\n";
                globalPower.output += "\t"+"la a1, " + id + "\n";
                globalPower.output += "\t"+"lw a0, (a1)\n";
                globalPower.output += "\t"+call+" printInt\n";
                // globalPower.output += "\t"+"li a7, 1\n";
                // globalPower.output += "\t"+"ecall\n";
            } else if(varType == "float"){
                globalPower.output += "\tla a1, "+ id+"\n";
                globalPower.output += "\t"+"flw fa0, (a1)\n";
                globalPower.output += "\t"+call+" printFloat\n";
            } else if(varType == "char"){
                globalPower.output += "\tla a1, " + id + "\n";
                globalPower.output += "\tli a2, 1\t #espacio a imprimir: 1\n";
                globalPower.output += "\t"+call+" printString\n";
            } else if(varType == "string"){
                console.log("Trying to print :"+id);
                var varLength = globalPower.IdMap.get(id).value.length;
                globalPower.output += "\t"+"la a1, " + id + "\n";
                globalPower.output += "\t"+"li a2, "+(varLength-2)+"\n";
                globalPower.output += "\t"+call+" printString\n";
            }  else if(varType == "boolean"){
                globalPower.output += "\t"+"la a1, " + id + "\n";
                globalPower.output += "\t"+"lb a0, (a1)\n";
                globalPower.output += "\t"+call+" printBoolean\n"; 
            }
            else {
                console.log("Error: Type mismatch: " + varType + " !== " + type);
            }
        }
        else if(child.type == "join"){
            console.log("Printing join");
            printJoin(child.children[0].value);
        }
        else if(child.type == "typeof"){
            translatePrintTypeOf(child);
        }
        else if(child.type == "toUpperCase"){
            var chain = child.children[0].value;
            translatePrintUpper(chain);
        }
        else if(child.type == "toLowerCase"){
            var chain = child.children[0].value;
            translatePrintLower(chain);
        }
        else if(type == "string"){
            if(child.children.length == 0){ //System.out.println(<string>+<string>);
                globalPower.output += "\t"+"la a1, " + saveStringforPrint(child.value) + "\n";
                globalPower.output += "\t"+"li a2, "+ (child.value.length-2)+"\n";
                globalPower.output += "\t"+call+" printString\n";
            } else {
                translatePrint(child);
            }            
            //incrementar contador de strings
            globalPower.printCounter++;
        } else if(type == "float"){
            //translateExpression of float
            var exp = translateExpression(child);
            globalPower.output += "\t"+"fmv.s fa0, ft0\t #Copiar el float: ft0 a fa0\n";
            globalPower.output += "\t"+call+" printFloat\n";
        }
        else if(type == "char"){
            globalPower.output += "\t"+"li a0, " + child.value + "\n";
            globalPower.output += "\t"+"li a7, 11\n";
            globalPower.output += "\t"+"ecall\n";
            //incrementar contador de strings
            globalPower.printCounter++;
        } else {
            //translateExpression int, boolean
            var exp = translateExpression(child);
            globalPower.output += "\t"+"mv a0, t0\n";
            if (type == "int") {
                globalPower.output += "\t"+call+" printInt\n";
            } else if (type == "boolean") {
                globalPower.output += "\t"+call+" printBoolean\n";
            }
        }
    }
    globalPower.output += "\t"+call+" printNewline\t# Imprimir un salto de línea\n";
}

function saveStringforPrint(value){
    let id = "print_" + globalPower.printCounter.toString();
    globalPower.data += "\t" + id +": .asciz " + value + "\n";
    return id;
}

function translatePrintTypeOf(node){
    const type = getType(node.children[0]);
    for ( const character of type){
        globalPower.output += "\t"+"li a0, " + character.charCodeAt(0) + "\n";
        globalPower.output += "\t"+"li a7, 11\n";
        globalPower.output += "\t"+"ecall\n";
    }
}
function translatePrintUpper(chain){
    for ( const character of chain){
        globalPower.output += "\t"+"li a0, " + character.charCodeAt(0) + "\n";
        if(character.charCodeAt(0) > 96 && character.charCodeAt(0) < 123){
            globalPower.output += "\t"+"addi a0, a0, -32\n";
        }
        globalPower.output += "\t"+"li a7, 11\n";
        globalPower.output += "\t"+"ecall\n";
    }
}
function translatePrintLower(chain){
    for ( const character of chain){
        globalPower.output += "\t"+"li a0, " + character.charCodeAt(0) + "\n";
        if(character.charCodeAt(0) > 64 && character.charCodeAt(0) < 91){
            globalPower.output += "\t"+"addi a0, a0, 32\n";
        }
        globalPower.output += "\t"+"li a7, 11\n";
        globalPower.output += "\t"+"ecall\n";
    }
}

export {
    translatePrint
};