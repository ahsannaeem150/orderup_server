import {imageModel} from "../../models/imageModel.js";
import {menuModel} from "../../models/itemModel.js";
import {v4 as uuidv4} from "uuid";
import {restaurantModel} from "../../models/restaurantModel.js";

export const addMenuItemController = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            costPrice,
            stock,
            maxStock,
            minStock,
            category,
            tags,
            supplierName,
            supplierContact,
            preparationTime,
            unit,
            weight,
            expiryDate
        } = req.body;

        const restaurantId = req.params.id;
        const restaurant = await restaurantModel.findById(restaurantId);

        const requiredFields = {
            name: "Item name is required",
            price: "Price is required",
            costPrice: "Cost price is required",
            stock: "Stock quantity is required",
            maxStock: "Max stock is required",
            minStock: "Min stock is required",
            preparationTime: "Preparation time is required"
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([field]) => !req.body[field])
            .map(([_, message]) => message);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Item image is required"
            });
        }

        // Handle image upload
        const image = new imageModel({
            name: `${uuidv4()}.${req.file.mimetype.split("/")[1]}`,
            data: req.file.buffer,
            contentType: req.file.mimetype,
        });
        await image.save();

        // Create new menu item
        const newMenuItem = new menuModel({
            name,
            description,
            price: parseFloat(price),
            costPrice: parseFloat(costPrice),
            stock: parseInt(stock),
            maxStock: parseInt(maxStock),
            minStock: parseInt(minStock),
            category,
            tags: JSON.parse(tags),
            supplier: {
                name: supplierName,
                contact: supplierContact
            },
            preparationTime: parseInt(preparationTime),
            unit,
            weight: weight ? parseFloat(weight) : undefined,
            expiryDate: new Date(expiryDate),
            image: image._id,
            createdAt: Date.now(),
            restaurant: restaurantId,
            availability: true
        });

        const savedItem = await newMenuItem.save();

        restaurant.menu.push(savedItem._id);
        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Menu item added successfully",
            item: savedItem
        });

    } catch (error) {
        console.error("Error adding menu item:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error occurred"
        });
    }
};