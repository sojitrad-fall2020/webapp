const db = require("../models");
const auth = require('basic-auth');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Usercontroller = require("../controllers/user-controller");
const Quescontroller = require("./question-controller");
const Answer = db.answer;

exports.create = async (req, res) => {
    var userCredentials = auth(req);
    var username = userCredentials.name;
    var password = userCredentials.pass;
    var answer_text = req.body.answer_text;
    var questionId = req.params.questionId;
    var uuid = uuidv4();

    if (!answer_text) {
        res.status(400).send({
            Message: "please provide answer_text !"
        });
    }

    const user = await Usercontroller.IsValid(username, password);
    if (!user) {
        res.status(401).send({
            Message: "User is not authorized !"
        });
    }
    const ifQuesExists = await Quescontroller.ifQuesExists(questionId);
    if (!ifQuesExists) {
        res.status(400).send({
            Message: "Question not found !"
        });
    }

    const answer = {
        id: uuid,
        answer_text: req.body.answer_text,
        QuestionId: questionId,
        UserId: user[0].id
    }

    Answer.create(answer).then(ans => {
        res.status(201).send(ans);
    }).catch(err => {
        res.send({
            Message: "Error in creating answer"
        });
        console.log(err);
    });

}

exports.getAnswerById = (req, res) => {

    // validation for mandatory question and answerid else bad 404
    if (!req.params.questionId || !req.params.answerId) {
        res.status(404).send({
            Message: "questionid and answerid required !"
        })
    }

    return Answer.findAll(
        {
            where:
            {
                id: req.params.answerId,
                QuestionId: req.params.questionId
            }
        })
        .then(ques => {
            res.status(200).send(ques);
        }).catch(err => {
            res.status(404).send({
                Message: "Answer not found"
            });
        });
}

exports.getAnswerByQuesId = (quesId) => {
    return Answer.findAll(
        {
            where:
            {
                QuestionId: quesId
            }
        })
        .then(ans => {
            return ans;
        }).catch(err => {
            console.log(err);
        });

}

exports.deleteAnswer = async (req, res) => {

    const existUser = await Usercontroller.IsAuthenticated(req, res);
    if (existUser) {
        Answer.destroy({
            where:
            {
                id: req.params.answerId,
                QuestionId: req.params.questionId,
                UserId: existUser[0].id
            }
        }).then((result) => {
            if (result == 0) {
                res.status(404).send({
                    Message: "Answer not found !"
                });
            }
            res.status(204).send();
        }).catch(err => { res.status(204).send() })
    } else {
        res.status(401).send({
            Message: "user unauthorized"
        });
    }
}

exports.updateAnswer = async (req, res) => {
    
    var currentDate = new Date();
    var answertext = req.body.answer_text;
    var questionId = req.params.questionId;
    var answerId = req.params.answerId;


    if (!answertext) {
        res.status(400).send({
            Message: "please provide answer_text !"
        });
    }
  

    const existUser = await Usercontroller.IsAuthenticated(req, res);
    console.log(existUser[0].id);
    if (existUser) {
        Answer.update({
            answer_text: answertext,
            updated_timestamp: currentDate,
        }, {
            where:
            {
                id: answerId,
                UserId: existUser[0].id,
                QuestionId: questionId
            }
        })
            .then((result) => {
                if (result == 0) {
                    res.status(404).send({
                        Message: "User can only update their own answers"
                    });
                }
                else {
                    res.send(204);
                    console.log({
                        Message: "Answer updated" + result
                    });
                }
            });
    }
    else {
        res.status(401).send({
            Message: "unauthorized"
        });
    }
}

