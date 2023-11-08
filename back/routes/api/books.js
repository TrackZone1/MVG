const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const fs = require("fs");
const multer = require("multer");
const { v4 } = require("uuid");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, v4() + ".png");
    },
});

const upload = multer({ storage });

const { db, secretKey } = require("../../db.js");

const authenticateJWT = (req, res, next) => {
    const token = req.header("Authorization");
    const bearer = token.split(" ");

    if (!token) {
        return res
            .status(401)
            .json({ message: "Authentication tokens required" });
    }

    jwt.verify(bearer[1], secretKey, (err, decoded) => {
        if (err) {
            return res
                .status(401)
                .json({ message: "Invalid authentication tokens" });
        }

        req.user = decoded;
        next();
    });
};

router.get("/", async (req, res) => {
    const books = await db.Books.find();

    return res.json(books);
});

router.get("/bestrating", async (req, res) => {
    const books = await db.Books.find().sort({ averageRating: -1 }).limit(3);

    return res.json(books);
});

router.get("/:id", async (req, res) => {
    const book = await db.Books.findOne({ _id: req.params.id });

    return res.json(book);
});

router.post("/", authenticateJWT, upload.single("image"), async (req, res) => {
    if (!req.body.book || !req.file) {
        return res.status(400).json({ message: "Missing parameters" });
    }

    const book = JSON.parse(req.body.book);
    const imageUrl = `http://${req.get("host")}/uploads/${req.file.filename}`;
    const userId = req.user.id;

    console.log(book, imageUrl, userId);

    db.Books.create({
        userId,
        title: book.title,
        author: book.author,
        imageUrl,
        year: book.year,
        genre: book.genre,
        ratings: book.ratings,
        averageRating: book.averageRating,
    }).catch((err) => {
        try {
            fs.unlinkSync(`./uploads/${req.file.filename}`);
        } catch (err) {
            console.log(err);
        }
        return res.status(400).json({ message: err.message });
    });

    return res.status(200).json({ message: "Book Created" });
});

router.put(
    "/:id",
    authenticateJWT,
    upload.single("image"),
    async (req, res) => {
        if (!req.body.book) {
            return res.status(400).json({ message: "Missing parameters" });
        }

        const book = JSON.parse(req.body.book);
        const userId = req.user.id;

        if (req.file) {
            const oldBook = await db.Books.findOne({ _id: req.params.id });
            const filename = oldBook.imageUrl.split("/").pop();

            try {
                fs.unlinkSync(`./uploads/${filename}`);
            } catch (err) {
                console.log(err);
            }

            const imageUrl = `http://${req.get("host")}/uploads/${
                req.file.filename
            }`;

            db.Books.updateOne(
                { _id: req.params.id, userId },
                {
                    $set: {
                        title: book.title,
                        author: book.author,
                        imageUrl,
                        year: book.year,
                        genre: book.genre,
                        ratings: book.ratings,
                        averageRating: book.averageRating,
                    },
                }
            ).catch((err) => {
                try {
                    fs.unlinkSync(`./uploads/${req.file.filename}`);
                } catch (err) {
                    console.log(err);
                }
                return res.status(400).json({ message: err.message });
            });
        } else {
            db.Books.updateOne(
                { _id: req.params.id, userId },
                {
                    $set: {
                        title: book.title,
                        author: book.author,
                        year: book.year,
                        genre: book.genre,
                        ratings: book.ratings,
                        averageRating: book.averageRating,
                    },
                }
            ).catch((err) => {
                try {
                    fs.unlinkSync(`./uploads/${req.file.filename}`);
                } catch (err) {
                    console.log(err);
                }
                return res.status(400).json({ message: err.message });
            });
        }

        return res.status(200).json({ message: "Book Updated" });
    }
);

router.delete("/:id", authenticateJWT, async (req, res) => {
    const userId = req.user.id;

    const book = await db.Books.findOne({ _id: req.params.id });

    const filename = book.imageUrl.split("/").pop();
    try {
        fs.unlinkSync(`./uploads/${filename}`);
    } catch (err) {
        console.log(err);
    }

    if (!book) {
        return res.status(400).json({ message: "Book not found" });
    }

    if (book.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized request" });
    }

    await db.Books.deleteOne({ _id: req.params.id });

    return res.status(200).json({ message: "Book Deleted" });
});

router.post("/:id/rating", authenticateJWT, async (req, res) => {
    // NOT IMPLEMENTED
});

module.exports = router;
