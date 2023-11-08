const mongoose = require("mongoose");
const { mongoUrl, secretKey } = require("./db.json");

mongoose.connect(mongoUrl);

const { Schema } = mongoose;

const usersSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const Users = mongoose.model("users", usersSchema);

const booksSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    genre: {
        type: String,
        required: true,
    },
    ratings: [
        {
            userId: {
                type: String,
                required: true,
            },
            grade: {
                type: Number,
                required: true,
            },
        },
    ],
    averageRating: {
        type: Number,
        required: true,
    },
});

const Books = mongoose.model("books", booksSchema);

const db = { Users, Books };

module.exports = { db, secretKey };
