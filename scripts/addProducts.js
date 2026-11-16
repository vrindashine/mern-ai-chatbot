


require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Product = require("../models/Product");

async function addProducts() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Sample products
    const products = [
      {
        name: "Samsung Galaxy M",
        price: 22000,
        category: "Mobile",
        storage: "128GB",
        battery: "6000mAh",
        description: "Mobile with good battery life"
      },
      {
        name: "Redmi Note",
        price: 18000,
        category: "Mobile",
        storage: "128GB",
        battery: "5000mAh",
        description: "Budget-friendly smartphone"
      },
      {
        name: "iPhone 15",
        price: 55000,
        category: "Mobile",
        storage: "128GB",
        battery: "3349mAh",
        description: "Apple smartphone"
      },
      
{
  name: "HP Pavilion Laptop",
  price: 48000,
  category: "Laptop",
  storage: "512GB SSD",
  ram: "16GB",
  battery: "Good battery life",
  description: "Laptop with 16GB RAM and 512GB SSD"
},
{
  name: "Dell Inspiron Laptop",
  price: 55000,
  category: "Laptop",
  storage: "512GB SSD",
  ram: "16GB",
  battery: "Good battery life",
  description: "Laptop with 16GB RAM and 512GB SSD"
}
    ];

    // Insert or update products without creating duplicates
    for (const product of products) {
      await Product.updateOne(
        { name: product.name },
        { $set: product },
        { upsert: true }
      );
    }

    console.log("Products added successfully!");

  } catch (error) {
    console.error("Error adding products:", error.message);

  } finally {
    await mongoose.connection.close();
  }
}

addProducts();
