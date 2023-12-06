import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({ _id: String}, {strict: false});
const sessionModel = mongoose.model('session', sessionSchema);

export default sessionModel;