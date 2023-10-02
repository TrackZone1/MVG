const { MongoClient } = require("mongodb");
const { mongoUrl } = require("./db.json");

const client = new MongoClient(mongoUrl);

const db = client.db("mvg");

module.exports = { db };
