import mongoose from "mongoose"

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: 'string',
        required: true,
    },
    userName: {
        type: 'string',
        required: true,
        unique: true,
    },
    email: {
        type: 'string',
        required: true,
        unique: true,
    },
    password: {
        type: 'string',
        required: true,
    }
})

const userModel = mongoose.model('user', userSchema);
export default userModel;