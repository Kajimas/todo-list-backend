// Import the required modules
const express = require("express"); // Import express module
const dotenv = require("dotenv"); // Import dotenv module
// const mongoose = require("mongoose"); // Import mongoose module
const cors = require("cors"); // Import CORS module

const app = express(); // Initialize the express app
// const router = express.Router(); // Create a new express router

// Use CORS middleware to enable cross-origin requests
app.use(cors());

dotenv.config(); // Configure dotenv to load the .env file

// Define the port for the server
const PORT = process.env.PORT || 3000;
// const DB_USERNAME = process.env.DB_USERNAME;
// const DB_PASSWORD = process.env.DB_PASSWORD;
// const DB_NAME = process.env.DB_NAME;

const taskData = [
  { task: "Task 1", completed: false },
  { task: "Task 2", completed: true },
];

app.use(express.json());

// Tests that will be removed later
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/testdotenv", (req, res) => {
  res.send(process.env.TEST_VARIABLE);
});

app.get("/testjson", (req, res) => {
  res.json(taskData);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// const CONFIG = {
//     DB_URL: `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.sloy5er.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,
//     DB_NAME: DB_NAME,
//   };

// mongoose
//   .connect(CONFIG.DB_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("DB Connected!"))
//   .catch((err) => {
//     console.error(`Could not connect to MongoDB Atlas. ${err}`);
//   });

// // Define the middleware for the express app
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Simple endpoint to test the setup
// router.get("/hello", (req, res) => {
//   res.send("Hello World!");
// });

// // Mount the router on the '/api' path
// app.use("/api", router);

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is listening on port ${PORT}`);
// });
