import mongoose from "mongoose";

const Schema = mongoose.Schema;

const accessSchema = new Schema({
    userId: {
        type: 'string',
        required: true,
    },
    lastReq: {
        type: 'string',
        required: true,
    }
})

export const AccessModel = mongoose.model('accessModel', accessSchema);