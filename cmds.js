const Sequelize = require('sequelize');

//Incluye  el model.js
const {models} = require('./model');

//Incluye las funcioones para dar color al texto
const {log, biglog, errorlog, colorize} = require("./out");

//Mostrar la ayuda
exports.helpCmd = rl => {
    log("Comandos:");
    log(" h|help - Muestra esta ayuda.");
    log(" list - Listar los quizzes existentes.");
    log(" show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(" add - Añadir un nuevo quiz interactivamente.");
    log(" delete <id> - Borrar el quiz indicado.");
    log(" edit <id> - Editar el quiz indicado.");
    log(" test <id> - Probar el quiz indicado.");
    log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(" credits - Créditos.");
    log(" q|quit - Salir del programa");
    rl.prompt();
};


exports.listCmd = rl =>{
    models.quiz.findAll()
        .each(quiz => {
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error =>{
            errorlog(error.message);
        })
        .then(()=>{
            rl.prompt();
        });
};


const validateId = id  => {
    return new Sequelize.Promise((resolve, reject) => {
        if(typeof id === "undefined"){
            reject (new Error (`Falta el parámetro <id>.`));
        }else{
            id = parseInt(id);
            if(Number.isNaN(id)){
                reject (new Error (`El valor del parámetro <id> no es un número.`));
            }else{
                resolve(id);
            }
        }
    });
};


exports.showCmd = (rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id = ${id}.`);
            }
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error =>{
            errorlog(error.message);
        })
        .then(() =>{
            rl.prompt();
        });
};


const makeQuestion =  (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};


exports.addCmd = rl =>{
    makeQuestion(rl, 'Introduzca una pregunta: ')
        .then( q => {
            return makeQuestion(rl, 'Introduzca una pregunta: ')
                .then(a => {
                    return {question: q, answer: a};
                });
        })
        .then(quiz =>{
            return models.quiz.create(quiz);
        })
        .then(quiz =>{
            log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error =>{
            errorlog('El quiz es erróneo: ');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .then(() => {
            rl.prompt();
        });
};


exports.deleteCmd = (rl, id) =>{
    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

exports.editCmd = (rl, id) =>{
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id = ${id}. `);
            }

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
            return makeQuestion(rl, 'Introduzca la pregunta: ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
                    return makeQuestion(rl, 'Introduzca la respuesta: ')
                        .then(a => {
                            quiz.question = q;
                            quiz.answer = a;
                            return quiz;
                        });
                });
        })
        .then(quiz => {
            return quiz.save();
        })
        .then(quiz =>{
            log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')}: por ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error =>{
            errorlog('El quiz es erróneo: ');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .then(() =>{
            rl.prompt();
        });
};

exports.testCmd = (rl, id) =>{
    /*if(typeof id === "undefined"){
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    }
    else{
        try{
            //const quiz = exports.showCmd(rl,id);
            const quiz = (model.getByIndex(id)).question + "?: ";

            //rl.question(colorize( quiz , 'red'), answer =>{
            //		rl.prompt();
            //});
            rl.question(colorize(quiz, 'red'),respuesta=>{
                if(respuesta.trim().toLowerCase() === model.getByIndex(id).answer.toLowerCase()){
                    log(`Su respuesta es correcta: `);
                    biglog('Correcta', 'green');
                    rl.prompt();
                }
                else{
                    log(`Su respuesta es incorrecta `);
                    biglog('Incorrecta', 'red');
                    rl.prompt();
                }
            });


        }catch(error){
            errorlog(error.message);
            rl.prompt();
        }
    }*/

    let toBePlayed=[];

    models.quiz.findAll({raw:true})
        .then(quizzes=>{
            toBePlayed=quizzes;
        })

    const playOne=()=>{
        return Promise.resolve()
            .then(()=> {

                let quiz = toBePlayed[id];
                toBePlayed.splice(id,1);
                return makeQuestion(rl,quiz.question)
                    .then(answer => {
                        if(answer.toLowerCase().trim()===quiz.answer.toLowerCase().trim()){
                            log("Correcto");
                            rl.prompt();
                        }else{
                            log("incorrecto");
                            rl.prompt();
                        }
                    })
            })
    }
    models.quiz.findAll({raw:true})
        .then(quizzes=>{
            toBePlayed=quizzes;
        })
        .then(()=> {
            return playOne();
        })
        .catch(e => {
            console.log("Error" + e);
        })
        .then(()=> {
            rl.prompt();
        })

};

exports.playCmd = rl =>{
    let score=0;
    let toBePlayed=[];

    models.quiz.findAll({raw:true})
        .then(quizzes=>{
            toBePlayed=quizzes;
        })

        const playOne=()=>{
        return Promise.resolve()
            .then(()=> {

                if(toBePlayed.length<= 0){
                    console.log("FIN");
                    return;
                }

                let pos= Math.floor(Math.random()*toBePlayed.length);
                let quiz = toBePlayed[pos];
                toBePlayed.splice(pos,1);
                return makeQuestion(rl,quiz.question)
                    .then(answer => {
                        if(answer.toLowerCase().trim()===quiz.answer.toLowerCase().trim()){
                            score++;
                            log("Correcto");
                            return playOne();
                        }else{
                            log("incorrecto");
                        }
                    })
            })
    }
    models.quiz.findAll({raw:true})
        .then(quizzes=>{
            toBePlayed=quizzes;
        })
        .then(()=> {
            return playOne();
        })
        .catch(e => {
            console.log("Error" + e);
        })
        .then(()=> {
            console.log(score);
            rl.prompt();
        })
};


exports.creditsCmd = rl =>{
    log('Miguel Rubio Bravo', 'green');
    rl.prompt();
};

exports.quitCmd = rl =>{
    rl.close();
    rl.prompt();
};
