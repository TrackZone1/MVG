const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const { db } = require("../../../db.js");
const { secretKey } = require("../../../db.json");

const authenticateJWT = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res
            .status(401)
            .json({ message: "Authentication tokens required" });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res
                .status(401)
                .json({ message: "Invalid authentication tokens" });
        }

        req.user = decoded;
        next();
    });
};

router.get("/api/books", async (req, res) => {
    if (req.query.id) {
        const book = await db
            .collection("books")
            .findOne({ _id: ObjectId(req.query.id) });

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        return res.json(book);
    } else {
        const books = await db.collection("books").find().toArray();

        return res.json(books);
    }
});

router.get("/api/books/bestrating", async (req, res) => {
    const books = await db
        .collection("books")
        .find()
        .sort({ rating: -1 })
        .limit(3)
        .toArray();

    return res.json(books);
});

router.post("/api/books", authenticateJWT, async (req, res) => {
    if (!req.body.book || !req.body.image) {
        return res.status(400).json({ message: "Missing parameters" });
    }

    const book = req.body.book;
    const image = req.body.image;

    const userId = req.user.id;

    db.collection("books").insertOne({ book, image, userId });

    return res.status(201).json({ message: "Book Added" });
});
