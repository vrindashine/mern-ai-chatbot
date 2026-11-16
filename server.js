
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const Chat = require("./models/Chat");
const Product = require("./models/Product");
const ChatSession = require("./models/ChatSession");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
// Check API key
if (!process.env.GEMINI_API_KEY) {
  console.error("Gemini API key is missing!");
  process.exit(1);
}

// Chapter 39: Product search rate limiter
const productSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Chapter 39: Handle Gemini API errors
function getGeminiErrorMessage(error) {
  const status = error.status || error.statusCode;

  if (status === 429) {
    return "AI request limit reached. Please try again later.";
  }

  if (status === 503) {
    return "AI service is temporarily busy. Please try again.";
  }

  if (status === 401 || status === 403) {
    return "AI service authentication failed.";
  }

  return "Something went wrong. Please try again.";
}


// Start backend and connect Gemini
async function startServer() {
  try {
    await connectDB();

    // Existing Gemini SDK integration
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

     // Chapter 38: Extract product requirements using Gemini
    
    // Chapter 38: Extract and validate product requirements
async function extractProductRequirements(message) {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: `
      Extract product requirements from the customer message.

      Return only valid JSON with these fields:
      category, maxPrice, ram, storage.

      Rules:
      - maxPrice must be a number or null.
      - category, ram and storage must be strings or null.
      - Do not invent missing requirements.
      - Do not include Markdown code fences.

      Customer message: ${message}
    `
  });

  try {
    const result = response.text.trim();

    const requirements = JSON.parse(result);

    // Check whether the response is an object
    if (
      !requirements ||
      typeof requirements !== "object" ||
      Array.isArray(requirements)
    ) {
      throw new Error("Invalid response format.");
    }

    // Check for unexpected fields
const allowedFields = [
  "category",
  "maxPrice",
  "ram",
  "storage"
];

for (const field of Object.keys(requirements)) {
  if (!allowedFields.includes(field)) {
    throw new Error(`Unexpected field: ${field}`);
  }
}
    // Check required fields
    const requiredFields = [
      "category",
      "maxPrice",
      "ram",
      "storage"
    ];

    for (const field of requiredFields) {
      if (!Object.prototype.hasOwnProperty.call(requirements, field)) {
        throw new Error(`Missing field: ${field}`);
      }
    }

    // Validate category
    if (
      requirements.category !== null &&
      typeof requirements.category !== "string"
    ) {
      throw new Error("Invalid category.");
    }

    // Validate maximum price
    if (
      requirements.maxPrice !== null &&
      (
        typeof requirements.maxPrice !== "number" ||
        !Number.isFinite(requirements.maxPrice) ||
        requirements.maxPrice < 0
      )
    ) {
      throw new Error("Invalid maximum price.");
    }

    // Validate RAM and storage
    if (
      requirements.ram !== null &&
      typeof requirements.ram !== "string"
    ) {
      throw new Error("Invalid RAM value.");
    }

    if (
      requirements.storage !== null &&
      typeof requirements.storage !== "string"
    ) {
      throw new Error("Invalid storage value.");
    }
    
    // Validate string lengths
if (
  requirements.category?.trim().length > 50 ||
  requirements.ram?.trim().length > 30 ||
  requirements.storage?.trim().length > 50
) {
  throw new Error("Product requirement is too long.");
}
    return {
      category: requirements.category?.trim() || null,
      maxPrice: requirements.maxPrice,
      ram: requirements.ram?.trim() || null,
      storage: requirements.storage?.trim() || null
    };

  } catch (error) {
    console.error(
      "Requirement extraction error:",
      error.message
    );

    throw new Error("Unable to extract product requirements.");
  }
}

// Chapter 38: Escape special regex characters
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
    
// Chapter 38: Search products using extracted requirements
async function searchProducts(requirements) {
  const filter = {};

  // Only accept a valid requirements object
if (
  !requirements ||
  typeof requirements !== "object" ||
  Array.isArray(requirements)
) {
  throw new Error("Invalid product requirements.");
}
console.log("Product search request received");

  // Normalize category names
if (requirements.category) {
  const category = requirements.category
    .trim()
    .toLowerCase();

  const normalizedCategory = {
    laptops: "Laptop",
    laptop: "Laptop",
    mobiles: "Mobile",
    mobile: "Mobile"
  };

  const matchedCategory =
    normalizedCategory[category] || category;

  filter.category = {
    $regex: `^${escapeRegex(matchedCategory)}$`,
    $options: "i"
  };
}

  if (requirements.maxPrice !== null) {
    filter.price = {
      $lte: requirements.maxPrice
    };
  }

  if (requirements.storage) {
    filter.storage = {
      $regex: escapeRegex(requirements.storage),
      $options: "i"
    };
  }

  if (requirements.ram) {
    filter.ram = {
      $regex: escapeRegex(requirements.ram),
      $options: "i"
    };
  }

  const products = await Product.find(filter);

  return products;
}


    
    // EXISTING AI CHAT ROUTE + MONGODB SAVE
    app.post("/api/ai/chat", authMiddleware, async (req, res) => {
      try {
        const { message, sessionId } = req.body;

        if (!sessionId) {
  return res.status(400).json({
    error: "Session ID is required."
  });
}
        // Validate session ID
if (!mongoose.Types.ObjectId.isValid(sessionId)) {
  return res.status(400).json({
    error: "Invalid session ID."
  });
}

        // Validate message
        if (
          !message ||
          typeof message !== "string" ||
          !message.trim()
        ) {
          return res.status(400).json({
            error: "Please provide a valid message."
          });
        }

        // Message length validation
        if (message.length > 2000) {
          return res.status(400).json({
            error: "Message is too long. Maximum 2000 characters."
          });
        }
       

const session = await ChatSession.findOne({
  _id: sessionId,
  userId: req.userId
});
if (!session) {
  return res.status(404).json({
    error: "Chat session not found."
  });
}
        
        // Get the last 10 conversations from MongoDB
const previousChats = await Chat.find({ sessionId })
  .sort({ createdAt: -1 })
  .limit(10);

// Change the order: oldest conversation first
previousChats.reverse();

// Convert MongoDB records into Gemini conversation format
const conversationHistory = previousChats.flatMap((chat) => [
  {
    role: "user",
    parts: [
      { text: chat.userMessage }
    ]
  },
  {
    role: "model",
    parts: [
      { text: chat.aiResponse }
    ]
  }
]);

// Send previous conversations and the new message to Gemini
const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: [
    ...conversationHistory,
    {
      role: "user",
      parts: [
        { text: message }
      ]
    }
  ]
});

        // Save conversation in MongoDB
        const savedChat = await Chat.create({
          userMessage: message,
          aiResponse: response.text,
          sessionId: sessionId
        });
        
        // Generate a title from the first message
const generatedTitle = message
  .trim()
  .split(/\s+/)
  .slice(0, 6)
  .join(" ")
  .slice(0, 40);

// Update the title only if it is still "New chat"
await ChatSession.findOneAndUpdate(
  {
    _id: sessionId,
    title: "New chat"
  },
  {
    title: generatedTitle
  }
);


        // Send response to React
        res.status(200).json({
          reply: savedChat.aiResponse
        });

      } catch (error) {
          console.error(
    "AI request failed:",
    error.message
  );

  const errorMessage = getGeminiErrorMessage(error);

  res.status(error.status || 500).json({
    error: errorMessage
  });
      }
    });

    // NEW IN LESSON 19: Retrieve chat history
    app.get("/api/ai/history", authMiddleware, async (req, res) => {
      try {
        const { sessionId } = req.query;


        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
  return res.status(400).json({
    error: "Invalid session ID."
  });
}

if (!sessionId) {
  return res.status(400).json({
    error: "Session ID is required."
  });
}
 const session = await ChatSession.findOne({
  _id: sessionId,
  userId: req.userId
});

if (!session) {
  return res.status(404).json({
    error: "Chat session not found."
  });
}      
const page = Number(req.query.page) || 1;

if (!Number.isInteger(page) || page < 1) {
  return res.status(400).json({
    error: "Page must be a positive integer."
  });
}

const limit = 10;
const skip = (page - 1) * limit;

const chats = await Chat.find({ sessionId })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

res.status(200).json(chats);

      } catch (error) {
        console.error(
          "History error:",
          error.message
        );

        res.status(500).json({
          error: "Unable to retrieve chat history."
        });
      }
    });

    app.post("/api/ai/sessions", authMiddleware, async (req, res) => {
  try {
    const newSession = await ChatSession.create({
  title: req.body.title || "New chat",
  userId: req.userId
});

    res.status(201).json(newSession);

  } catch (error) {
    console.error("Session creation error:", error.message);

    res.status(500).json({
      error: "Unable to create chat session."
    });
  }
});
	app.get("/api/ai/sessions", authMiddleware, async (req, res) => {
  try {
   const sessions = await ChatSession.find({
  userId: req.userId
}).sort({ createdAt: -1 });

    res.status(200).json(sessions);

  } catch (error) {
    console.error("Session retrieval error:", error.message);

    res.status(500).json({
      error: "Unable to retrieve chat sessions."
    });
  }
});


app.put("/api/ai/sessions/:sessionId", authMiddleware, async (req, res) => {

  try {
    const { title } = req.body;
      const { sessionId } = req.params;

if (!mongoose.Types.ObjectId.isValid(sessionId)) {
  return res.status(400).json({
    error: "Invalid session ID."
  });
}
    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Please provide a chat title."
      });
    }

    const updatedSession = await ChatSession.findOneAndUpdate(
  {
    _id: sessionId,
    userId: req.userId
  },
  { title: title.trim() },
  { new: true }
);

    if (!updatedSession) {
      return res.status(404).json({
        error: "Chat session not found."
      });
    }

    res.status(200).json(updatedSession);

  } catch (error) {
    console.error("Rename error:", error.message);

    res.status(500).json({
      error: "Unable to rename chat session."
    });
  }
});


app.delete("/api/ai/sessions/:sessionId", authMiddleware, async (req, res) => {

  try {
      const { sessionId } = req.params;

if (!mongoose.Types.ObjectId.isValid(sessionId)) {
  return res.status(400).json({
    error: "Invalid session ID."
  });
}

   const deletedSession = await ChatSession.findOneAndDelete({
  _id: sessionId,
  userId: req.userId
});

    if (!deletedSession) {
      return res.status(404).json({
        error: "Chat session not found."
      });
    }

    await Chat.deleteMany({
      sessionId: sessionId
    });

    res.status(200).json({
      message: "Chat session deleted successfully."
    });

  } catch (error) {
    console.error("Delete error:", error.message);

    res.status(500).json({
      error: "Unable to delete chat session."
    });
  }
});

app.get("/api/auth/profile", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Authentication successful.",
    userId: req.userId
  });
});



// Chapter 37: Get products from MongoDB

 // Chapter 37: Get filtered products from MongoDB
app.get("/api/products", authMiddleware, async (req, res) => {
  try {
    const { category, maxPrice } = req.query;

    const filter = {};

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by maximum price
    if (maxPrice !== undefined) {
      const price = Number(maxPrice);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          error: "Please provide a valid maximum price."
        });
      }

      filter.price = { $lte: price };
    }

    const products = await Product.find(filter);

    res.status(200).json(products);

  } catch (error) {
    console.error("Product retrieval error:", error.message);

    res.status(500).json({
      error: "Unable to retrieve products."
    });
  }
});

 // Chapter 38: AI-powered product search
    app.post("/api/ai/product-search",
  authMiddleware,
  productSearchLimiter,
  async (req, res) =>  {
      try {
        const message =
  typeof req.body.message === "string"
    ? req.body.message.trim()
    : "";

        // Validate customer message
        if (
          !message ||
          typeof message !== "string" ||
          !message.trim()
        ) {
          return res.status(400).json({
            error: "Please provide a valid message."
          });
        }

        if (message.length > 2000) {
          return res.status(400).json({
            error: "Message is too long."
          });
        }

        // Extract requirements using Gemini
        const requirements =
          await extractProductRequirements(message);

        // Search products in MongoDB
        const products =
          await searchProducts(requirements);

        console.log(
  `Product search completed. Results: ${products.length}`
);

        // Send matching products to React
        res.status(200).json({
          requirements,
          products
        });

      } catch (error) {
  console.error(
    "AI product search error:",
    error.message
  );

  const status = error.status || error.statusCode;

  const responseStatus =
    status === 429 ? 429 :
    status === 503 ? 503 :
    status === 401 || status === 403 ? 500 :
    500;

  res.status(responseStatus).json({
    error: getGeminiErrorMessage(error)
  });
}
    });

    // Start server
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running on port 5000");
    });

  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
}

startServer();
