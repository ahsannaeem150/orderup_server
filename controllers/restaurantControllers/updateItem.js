import {menuModel} from "../../models/itemModel.js";
import {restaurantModel} from "../../models/restaurantModel.js";

export const updateItemController = async (req, res) => {
    try {
        const {restaurantId, itemId} = req.params;
        const {operation, ...updateData} = req.body;
        const file = req.file;

        // Validate restaurant exists
        const restaurant = await restaurantModel.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({message: 'Restaurant not found'});
        }

        // Find the item with restaurant validation
        const item = await menuModel.findOne({_id: itemId, restaurant: restaurantId});
        if (!item) {
            return res.status(404).json({message: 'Item not found'});
        }

        let update = {};
        let message = 'Item updated successfully';

        // Handle different operations
        switch (operation) {
            case 'general':
                update = processGeneralUpdate(updateData);
                break;

            case 'stock':
                update = processStockUpdate(updateData, item);
                break;

            case 'availability':
                update = {availability: !item.availability};
                message = `Item marked as ${!item.availability ? 'available' : 'unavailable'}`;
                break;

            case 'image':
                if (!file) throw new Error('No image provided');
                update = {image: file.filename};
                break;

            default:
                return res.status(400).json({message: 'Invalid operation type'});
        }

        // Apply the update
        const updatedItem = await menuModel.findByIdAndUpdate(
            itemId,
            {
                $set: {
                    ...update,
                    updatedAt: Date.now()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        res.json({
            message,
            item: updatedItem.toObject({virtuals: true})
        });

    } catch (error) {
        res.status(400).json({
            message: 'Operation failed',
            error: error.message
        });
    }
}

// Helper function for general updates
function processGeneralUpdate(data) {
    const numericFields = ['price', 'costPrice', 'maxStock', 'minStock', 'weight', 'preparationTime'];
    const dateFields = ['expiryDate', 'lastRestocked'];

    return Object.entries(data).reduce((acc, [key, value]) => {
        if (numericFields.includes(key)) {
            acc[key] = Number(value);
            if (isNaN(acc[key])) throw new Error(`Invalid number value for ${key}`);
        } else if (dateFields.includes(key)) {
            acc[key] = new Date(value);
            if (isNaN(acc[key])) throw new Error(`Invalid date format for ${key}`);
        } else if (key === 'tags') {
            acc[key] = JSON.parse(value);
        } else {
            acc[key] = value;
        }
        return acc;
    }, {});
}

// Helper function for stock operations
function processStockUpdate(data, currentItem) {
    const validTypes = ['restock', 'adjust'];
    if (!validTypes.includes(data.type)) {
        throw new Error('Invalid stock operation type');
    }

    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid stock amount');
    }

    const update = {
        stock: data.type === 'restock' ? currentItem.stock + amount : amount
    };

    if (data.type === 'restock') {
        update.lastRestocked = new Date();
    }

    if (update.stock > currentItem.maxStock) {
        throw new Error('Stock cannot exceed maximum capacity');
    }

    return update;
}
