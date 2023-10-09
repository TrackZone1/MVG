const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const allowedOrigins = ["http://localhost:3000"];
app.use(
    cors({
        origin: function (origin, callback) {
            // Vérifier si l'origine fait partie des origines autorisées
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Access denied by CORS"));
            }
        },
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true, // Si vous avez besoin d'envoyer des cookies et des en-têtes d'authentification
    })
);

const signupRoute = require("./routes/api/auth/signup");
app.post("/api/auth/signup", signupRoute);

const loginRoute = require("./routes/api/auth/login");
app.post("/api/auth/login", loginRoute);

const booksRoute = require("./routes/api/books");
app.all("/api/books", booksRoute);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
