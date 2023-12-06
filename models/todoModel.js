import mongoose from "mongoose"

const Schema = mongoose.Schema;

const todoSchema = new Schema({
    task_name: {
        type: 'string',
        required: true,
    },
    isCompleted: {
        type: 'boolean',
        required: true,
    },
    userName: {
        type: 'string',
        required: true,
    }
})

const todoModel = mongoose.model('todo', todoSchema);
export default todoModel;