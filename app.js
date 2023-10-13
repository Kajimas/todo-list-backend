"use strict";

// Import the required modules
const express = require("express"); // Import express module
const dotenv = require("dotenv"); // Import dotenv module
const cors = require("cors"); // Import CORS module
const swaggerDocument = require("./swagger.json");
const swaggerUi = require("swagger-ui-express"); // Import swagger-ui-express module
const mongoose = require("mongoose"); // Import mongoose module

const app = express(); // Initialize the express app

// Use CORS middleware to enable cross-origin requests
app.use(cors());
app.use(express.json());

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
app.get("/:email/todo", async (req, res, next) => {
  try {
    const email = req.params.email; // Grab the email from the URL parameter
    const user = await User.findOne({ email: email }); // Search user by the email parameter
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
app.post("/:email/todo", async (req, res, next) => {
  try {
    const email = req.params.email;
    const taskDetails = req.body;

    // Validate task details (you can expand upon this)
    if (!taskDetails.task || taskDetails.completed === undefined) {
      return res.status(400).send("Invalid task details");
    }

    // Find the user by email and update their 'todo' list
    const user = await User.findOneAndUpdate(
      { email: email },
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
 * confirms that the Server is listening on the port
 */
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
