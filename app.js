"use strict";

// Import the required modules
const express = require("express"); // Import express module
const dotenv = require("dotenv"); // Import dotenv module
const cors = require("cors"); // Import CORS module
const swaggerDocument = require("./swagger.json");
const swaggerUi = require("swagger-ui-express"); // Import swagger-ui-express module
const mongoose = require("mongoose"); // Import mongoose module

const ObjectId = mongoose.Types.ObjectId; // Import ObjectId type from mongoose
const app = express(); // Initialize the express app

// Use CORS middleware to enable cross-origin requests
app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

// function for simple validation of email
function extractAndValidateEmail(req, res, next) {
  const email = req.params.email;
  if (typeof email !== "string") {
    return res.status(400).send("Input must be a string!");
  }
  req.email = email;
  next();
}

// Define the port for the server
dotenv.config(); // Configure dotenv to load the .env file
const PORT = process.env.PORT || 3000;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

/**
 * Define the configuration URL for the database
 */
const CONFIG = {
  DB_URL: `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.sloy5er.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,
};

/**
 * Define the schema for the Task collection
 */
const taskSchema = new mongoose.Schema({
  task: String,
  completed: Boolean,
});

/**
 *  Define the schema for the User collection
 */
const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  todo: [taskSchema],
  doing: [taskSchema],
  done: [taskSchema],
});

/**
 * Define the model for the User collection
 */
const User = mongoose.model("User", userSchema);

/**
 * Connect to the database
 */
mongoose
  .connect(CONFIG.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connected");
  })
  .catch((err) => {
    console.error(`Could not connect to MongoDB Atlas. ${err}`);
    process.exit(1); // Exit process with failure
  });

/**
 * Serve the swagger documentation
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes

/**
 * gets all users
 */
app.get("/", async (req, res) => {
  try {
    const users = await User.find();
    if (!users || users.length === 0) {
      return res.status(404).send("Users not found");
    }
    return res.json(users);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

/**
 * checks todo tasks of a user by email
 */
app.get("/:email/todo", extractAndValidateEmail, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.email }); // Search user by the email parameter

    if (!user) {
      return res.status(404).send("User not found");
    }
    return res.json(user.todo); // Return only the 'todo' tasks
  } catch (err) {
    console.error(err);
    next(err); // Pass the error to the next middleware
  }
});

/**
 * creates new todos for a user by email
 */
app.post("/:email/todo", extractAndValidateEmail, async (req, res, next) => {
  try {
    const taskDetails = req.body;

    // Validate task details (you can expand upon this)
    if (!taskDetails.task || taskDetails.completed === undefined) {
      return res.status(400).send("Invalid task details");
    }

    // Find the user by email and update their 'todo' list
    const user = await User.findOneAndUpdate(
      { email: req.email },
      { $push: { todo: taskDetails } },
      { new: true, useFindAndModify: false } // 'new: true' returns the updated document
    );

    if (!user) {
      return res.status(404).send("User not found");
    }

    return res.json(user.todo); // Return the updated 'todo' list
  } catch (err) {
    console.error(err);
    next(err);
  }
});

/**
 * gets a todo task of a user by the taskID
 * used for testing purposes only
 */
app.get("/:email/todo/:taskId", async (req, res, next) => {
  try {
    const { email, taskId } = req.params;

    // Convert taskId to ObjectId
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    // Find the user with the given email
    const user = await User.findOne({ email: email });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      return res.status(404).send(`User with email ${email} not found.`);
    }

    // Find the specific task using Array#find
    const task = user.todo.find((t) => t._id.equals(taskObjectId));

    if (!task) {
      console.error(`Task with ID ${taskId} not found for user ${email}.`);
      return res
        .status(404)
        .send(`Task with ID ${taskId} not found for user ${email}.`);
    }

    // Return the found task
    return res.json(task);
  } catch (err) {
    console.error(
      `Error while processing request for user ${req.params.email} and task ${req.params.taskId}: ${err.message}`
    );
    next(err);
  }
});

/**
 * Updates a todo task of a user by taskID
 */
app.put(
  "/:email/todo/:taskId",
  extractAndValidateEmail,
  async (req, res, next) => {
    try {
      const { email, taskId } = req.params;
      const updatedTask = req.body; // Extract the updated task details from request body

      // Convert taskId to ObjectId
      const taskObjectId = new mongoose.Types.ObjectId(taskId);

      // Find the user with the given email
      const user = await User.findOne({ email: email });

      if (!user) {
        console.error(`User with email ${email} not found.`);
        return res.status(404).send(`User with email ${email} not found.`);
      }

      console.log("Target Task ID:", taskId);

      // Validate the updated task details
      if (!updatedTask.task || updatedTask.completed === undefined) {
        return res.status(400).send("Invalid task details");
      }

      console.log("User's Tasks:", user.todo);

      const task = user.todo.id(taskId);
      if (!task) {
        return res.status(404).send("Task not found");
      }

      // Update the task
      task.set(updatedTask);

      await user.save();

      return res.json(task); // Return the updated task
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

/**
 * Deletes a todo task of a user by task ID
 */
app.delete("/:email/todo/:taskId", async (req, res, next) => {
  try {
    const { email, taskId } = req.params;

    // Convert taskId to ObjectId
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    // Find the user with the given email
    const user = await User.findOne({ email: email });
    if (!user) {
      console.error(`User with email ${email} not found.`);
      return res.status(404).send(`User with email ${email} not found.`);
    }

    // Find the specific task using Array#find
    const task = user.todo.find((t) => t._id.equals(taskObjectId));
    if (!task) {
      console.error(`Task with ID ${taskId} not found for user ${email}.`);
      return res
        .status(404)
        .send(`Task with ID ${taskId} not found for user ${email}.`);
    }

    // Remove the task from the user's todo array
    const taskIndex = user.todo.indexOf(task);
    user.todo.splice(taskIndex, 1);

    // Save the user with the task removed
    await user.save();

    return res.status(204).send(); // 204 No Content, indicates successful deletion
  } catch (err) {
    console.error(
      `Error while processing request for user ${req.params.email} and task ${req.params.taskId}: ${err.message}`
    );
    next(err);
  }
});

/**
 * confirms that the Server is listening on the port
 */
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
