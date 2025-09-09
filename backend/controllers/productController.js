import cloudinary from "cloudinary";
import productModel from "../models/productModel.js";
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestSeller,
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !subCategory || !sizes) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }
    
    // Validate and parse sizes
    let parsedSizes;
    try {
      parsedSizes = JSON.parse(sizes);
      if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
        throw new Error("Sizes must be a non-empty array");
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid sizes format"
      });
    }
    
    // Handle image uploads
    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );
    
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required"
      });
    }
    
    // Upload images to Cloudinary
    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        try {
          const result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
            folder: "products",
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto" }
            ]
          });
          return result.secure_url;
        } catch (error) {
          throw new Error(`Failed to upload image: ${error.message}`);
        }
      })
    );
    
    const productData = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: Number(price),
      subCategory: subCategory.trim(),
      bestSeller: bestSeller === "true",
      sizes: parsedSizes,
      image: imagesUrl,
      date: Date.now(),
    };
    
    const product = new productModel(productData);
    await product.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Product added successfully",
      product: {
        id: product._id,
        name: product.name,
        price: product.price
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to add product" 
    });
  }
};
const listProduct = async (req, res) => {
  try {
    const products = await productModel.find({}).sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch products" 
    });
  }
};

const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }
    
    const product = await productModel.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    res.json({ 
      success: true, 
      message: "Product removed successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to remove product" 
    });
  }
};

const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }
    
    const product = await productModel.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    res.json({ 
      success: true, 
      product 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch product" 
    });
  }
};

export { addProduct, listProduct, singleProduct, removeProduct };
