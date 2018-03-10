
const figlet = require('figlet');
const chalk = require('chalk');

/**
 * Dar color a un string
 *
 * @param msg String a "colorear".
 * @param color Color con el que se va a pintar.
 * @returns {string} Devuelve el string msg con el color indicado.
 */
const colorize = (msg,color) =>{
    if(typeof color !== "undefined") {
        msg = chalk[color].bold(msg);
    }
    return msg;
};

/**
 * Escribe un mensaje de log.
 *
 * @param msg
 * @param color
 */
const log = (msg,color) =>{
    console.log(colorize(msg,color));
};

/**
 * Escribe un mensaje log en grande
 * @param msg
 * @param color
 */
const biglog = (msg,color) =>{
    log(figlet.textSync(msg,{horizontalLayout:'full'}),color);
};


const errorlog = (emsg) =>{
    console.log(`${colorize("Error","red")}: ${colorize(colorize(emsg,"red"),"bgYellowBright")}`);
};


exports = module.exports = {
    colorize,
    log,
    biglog,
    errorlog
};