const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const { authenticate } = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get all destinations
router.get('/', async (req, res) => {
  try {
    const { country, search } = req.query;
    let query = {};

    // Filter by country if provided
    if (country) {
      query.country = country;
    }

    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const destinations = await Destination.find(query)
      .sort({ name: 1 });
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching destinations' });
  }
});

// Get destination by ID
router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json(destination);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching destination' });
  }
});

// Create destination (admin only)
router.post('/', [authenticate, admin], async (req, res) => {
  try {
    const { name, country, description, imageUrl } = req.body;

    // Check if destination with same name exists
    const existingDestination = await Destination.findOne({ name });
    if (existingDestination) {
      return res.status(400).json({ message: 'Destination with this name already exists' });
    }

    const destination = new Destination({
      name,
      country,
      description,
      imageUrl
    });

    await destination.save();
    res.status(201).json(destination);
  } catch (error) {
    res.status(400).json({ message: 'Error creating destination' });
  }
});

// Update destination (admin only)
router.put('/:id', [authenticate, admin], async (req, res) => {
  try {
    const { name, country, description, imageUrl } = req.body;

    // Check if another destination with same name exists
    const existingDestination = await Destination.findOne({
      name,
      _id: { $ne: req.params.id }
    });
    if (existingDestination) {
      return res.status(400).json({ message: 'Destination with this name already exists' });
    }

    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      { name, country, description, imageUrl },
      { new: true }
    );

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    res.json(destination);
  } catch (error) {
    res.status(400).json({ message: 'Error updating destination' });
  }
});

// Delete destination (admin only)
router.delete('/:id', [authenticate, admin], async (req, res) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting destination' });
  }
});

module.exports = router; 