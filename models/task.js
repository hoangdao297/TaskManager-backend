const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
    {
        task_description: {
            type: String,
            trim: true,
            required: true
        },
        completed: {
            type: Boolean,
            default: false
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        }
    },
    {
        timestamp: true
    }
);

const Task = mongoose.model("Task",TaskSchema);

module.exports =Task;