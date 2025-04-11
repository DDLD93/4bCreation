const mongoose = require("mongoose")
const { mongoURI } = require("../config")

module.exports = async () => {
    dbConn = mongoose.connection;
    dbConn
        .on("connected", () => {
            console.log("Connected to mongoDB");
        })
        .on("connecting", () => {
            console.log("Connecting to mongoDB");
        })
        .on("error", (error) => {
            console.log(`Error connecting to mongoDB >> ${error.message}`);
        })
        .on("disconnected", () => {
            console.log("Disconnected from mongoDB");
            setTimeout(async () => {
                console.log("Reconnecting to mongoDB");
                await mongoose.connect(mongoURI)
            }, 5000);
        })
    await mongoose.connect(mongoURI)
}