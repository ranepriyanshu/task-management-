// // import express from "express";
// // import dotenv from "dotenv";
// // import cors from "cors";
// // import connect from "./src/db/connect.js";
// // import cookieParser from "cookie-parser";
// // import fs from "node:fs";
// // import errorHandler from "./src/helpers/errorhandler.js";

// // dotenv.config();

// // const port = process.env.PORT || 8000;

// // const app = express();

// // // middleware
// // app.use(
// //   cors({
// //     origin: [process.env.CLIENT_URL, "http://localhost:3000"],
// //     credentials: true,
// //   })
// // );
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));
// // app.use(cookieParser());

// // // error handler middleware
// // app.use(errorHandler);

// // //routes
// // const routeFiles = fs.readdirSync("./src/routes");

// // routeFiles.forEach((file) => {
// //   // use dynamic import
// //   import(`./src/routes/${file}`)
// //     .then((route) => {
// //       app.use("/api/v1", route.default);
// //     })
// //     .catch((err) => {
// //       console.log("Failed to load route file", err);
// //     });
// // });

// // const server = async () => {
// //   try {
// //     await connect();

// //     app.listen(port, () => {
// //       console.log(`Server is running on port ${port}`);
// //     });
// //   } catch (error) {
// //     console.log("Failed to strt server.....", error.message);
// //     process.exit(1);
// //   }
// // };

// // server();
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connect from "./src/db/connect.js";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import errorHandler from "./src/helpers/errorhandler.js";
import winston from "winston"; // for better logging


dotenv.config();

const port = process.env.PORT || 8000;

const app = express();

// Logger setup using Winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});

// middleware
app.use(
  cors({
    origin: "http://localhost:3000", // or whatever your frontend URL is
    credentials: true,
    
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// error handler middleware
app.use(errorHandler);

// Routes dynamic loading
const routeFiles = fs.readdirSync("./src/routes");

routeFiles.forEach((file) => {
  // use dynamic import
  import(`./src/routes/${file}`)
    .then((route) => {
      app.use("/api/v1", route.default);
    })
    .catch((err) => {
      logger.error(`Failed to load route file: ${file}`, err);
    });
});

const server = async () => {
  try {
    await connect();

    const serverInstance = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });

    // Graceful shutdown for the server
    process.on("SIGINT", () => {
      logger.info("Shutting down server...");
      serverInstance.close(() => {
        logger.info("Server closed.");
        process.exit(0);
      });
    });

    process.on("SIGTERM", () => {
      logger.info("Termination signal received...");
      serverInstance.close(() => {
        logger.info("Server terminated.");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server.....", error.message);
    process.exit(1);
  }
};

server();




