// Create web server

// Import module
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Create web server
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Import module
const { User, Comment } = require('./models');

// Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        res.status(401).send({
            errorMessage: 'You need authorization header'
        });
        return;
    }
    const { userId } = jwt.verify(token, 'my-secret-key');
    User.findByPk(userId).then((user) => {
        res.locals.user = user;
        next();
    });
};

// Get comment list
app.get('/comments/:postID', (req, res) => {
    const postID = parseInt(req.params.postID, 10);
    Comment.findAll({
        where: { postID },
        order: [['id', 'DESC']]
    }).then((comments) => {
        res.send(comments);
    });
});

// Create comment
app.post('/comments', authMiddleware, (req, res) => {
    const { content, postID } = req.body;
    Comment.create({
        content,
        postID,
        userID: res.locals.user.id
    }).then((comment) => {
        res.send(comment);
    });
});

// Modify comment
app.patch('/comments/:commentID', authMiddleware, (req, res) => {
    const commentID = parseInt(req.params.commentID, 10);
    const { content } = req.body;
    Comment.findByPk(commentID).then((comment) => {
        if (res.locals.user.id !== comment.userID) {
            res.status(403).send({
                errorMessage: 'You are not authorized to modify the comment'
            });
            return;
        }
        comment.content = content;
        comment.save().then((comment) => {
            res.send(comment);
        });
    });
});

// Delete comment
app.delete('/comments/:commentID', authMiddleware, (req, res) => {
    const commentID = parseInt(req.params.commentID, 10);
    Comment.findByPk(commentID).then((comment) => {
        if (res.locals.user.id !== comment.userID) {
            res.status(403).send({
                errorMessage: 'You are not