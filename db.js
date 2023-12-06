import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const URL = process.env.Mongo_URL;
const connectToDB = ()=>{
    mongoose.connect(URL)
    .then(()=>{
        console.log("Database connection established");
    }).catch(error=>{
        console.log(error);
    })
}

export default connectToDB;