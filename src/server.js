const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const connectDB = require("./config/database");
const path = require("path");
const fileUpload = require("express-fileupload");
const errorHandler = require("./middleware/error");

// Load env vars
console.log("🔧 Loading environment variables...");
dotenv.config({ path: "./src/config/config.env" });

// Connect to database
console.log("🔌 Connecting to MongoDB...");
connectDB();

// Route files
const auth = require("./routes/auth");
const hotels = require("./routes/hotels");
const flights = require("./routes/flights");
const tours = require("./routes/tours");
const bookings = require("./routes/bookings");
const users = require("./routes/users");
const reviews = require("./routes/reviews");
const bookingCom = require("./routes/bookingCom");
const admin = require("./routes/admin");
const mongodbHotels = require("./routes/mongodbHotels");
const localServices = require("./routes/localServices");
const restaurants = require("./routes/restaurants");
const events = require("./routes/eventRoutes");
const payments = require("./routes/payments");
const destinations = require("./routes/destinations");

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// File upload
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: "/tmp/",
    debug: process.env.NODE_ENV === "development",
  })
);

// Raw body parser for Stripe webhooks
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Enable CORS
console.log("🌐 Enabling CORS...");
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Set security headers with configurations for static files
console.log("🔒 Setting security headers...");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Serve static files
console.log("📂 Setting up static file serving...");
app.use(express.static(path.join(__dirname, "../public")));

// Rate limiting
console.log("⚡ Setting up rate limiting...");
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Compress responses
console.log("📦 Enabling response compression...");
app.use(compression());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  console.log("🔍 Enabling development logging...");
  app.use(morgan("dev"));
}

// Swagger API Documentation
console.log("📚 Setting up Swagger API documentation...");
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Tourism Booking API Documentation",
  })
);

// Set static folder
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Tourism Booking API",
    documentation: "/api-docs",
    version: "1.0.0",
  });
});

// Mount routers
console.log("🛣️ Mounting API routes...");
// Auth routes
app.use("/api/auth", auth);

// User routes
app.use("/api/users", users);

// Resource routes
app.use("/api/hotels", hotels);
app.use("/api/flights", flights);
app.use("/api/tours", tours);
app.use("/api/reviews", reviews);
app.use("/api/bookings", bookings);
app.use("/api/booking", bookingCom);
app.use("/api/admin", admin);
app.use("/api/mongodb-hotels", mongodbHotels);
app.use("/api/local-services", localServices);
app.use("/api/restaurants", restaurants);
app.use("/api/events", events);
app.use("/api/payments", payments);
app.use("/api/destinations", destinations);

// Legacy v1 routes - keep for backward compatibility
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/hotels", hotels);
app.use("/api/v1/flights", flights);
app.use("/api/v1/tours", tours);
app.use("/api/v1/reviews", reviews);
app.use("/api/v1/bookings", bookings);
app.use("/api/v1/booking", bookingCom);
app.use("/api/v1/admin", admin);
app.use("/api/v1/mongodb-hotels", mongodbHotels);
app.use("/api/v1/local-services", localServices);
app.use("/api/v1/restaurants", restaurants);
app.use("/api/v1/events", events);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Only start the server if we're not in test mode
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(PORT, () => {
    console.log(`
        🚀 Server is running!
        🌍 Mode: ${process.env.NODE_ENV}
        🏃‍♂️ Port: ${PORT}
        📝 API Documentation: http://localhost:${PORT}/api-docs
        `);
  });
}

module.exports = app;

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error("❌ Unhandled Rejection:", err.message);
  // Close server & exit process
  if (process.env.NODE_ENV !== "test") {
    if (server) {
      server.close(() => process.exit(1));
    }
  }
});
