const { expect } = require('chai');
const sinon = require('sinon');

describe('Destination Route Handlers', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Mock request object
    req = {
      body: {},
      params: {},
      query: {},
      user: { userId: 'admin123', role: 'admin' }
    };
    
    // Mock response object
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    
    // Mock next function
    next = sinon.spy();
  });
  
  describe('getAllDestinations', () => {
    it('should get all destinations without filters', async () => {
      // Mock Destination model
      const Destination = {
        find: sinon.stub().returns({
          sort: sinon.stub().resolves([
            {
              _id: 'dest1',
              name: 'Paris',
              country: 'France',
              description: 'City of Light',
              imageUrl: 'https://example.com/paris.jpg'
            },
            {
              _id: 'dest2',
              name: 'Rome',
              country: 'Italy',
              description: 'Eternal City',
              imageUrl: 'https://example.com/rome.jpg'
            }
          ])
        })
      };
      
      // Implementation of get all destinations handler
      const getAllDestinations = async (req, res) => {
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
      };
      
      // Call the handler
      await getAllDestinations(req, res);
      
      // Assertions
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.be.an('array').with.lengthOf(2);
      expect(response[0]).to.have.property('name', 'Paris');
      expect(response[1]).to.have.property('name', 'Rome');
    });
    
    it('should filter destinations by country', async () => {
      // Mock Destination model with filtered results
      const Destination = {
        find: sinon.stub().returns({
          sort: sinon.stub().resolves([
            {
              _id: 'dest1',
              name: 'Paris',
              country: 'France',
              description: 'City of Light',
              imageUrl: 'https://example.com/paris.jpg'
            }
          ])
        })
      };
      
      // Implementation of get all destinations handler
      const getAllDestinations = async (req, res) => {
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
      };
      
      // Set query params for filtering
      req.query.country = 'France';
      
      // Call the handler
      await getAllDestinations(req, res);
      
      // Assertions
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.be.an('array').with.lengthOf(1);
      expect(response[0]).to.have.property('name', 'Paris');
      expect(response[0]).to.have.property('country', 'France');
      
      // Verify the correct query was passed to find
      expect(Destination.find.calledWith({ country: 'France' })).to.be.true;
    });
  });
  
  describe('getDestinationById', () => {
    it('should get a destination by ID', async () => {
      // Mock Destination model
      const Destination = {
        findById: sinon.stub().resolves({
          _id: 'dest1',
          name: 'Paris',
          country: 'France',
          description: 'City of Light',
          imageUrl: 'https://example.com/paris.jpg'
        })
      };
      
      // Implementation of get destination by ID handler
      const getDestinationById = async (req, res) => {
        try {
          const destination = await Destination.findById(req.params.id);
          if (!destination) {
            return res.status(404).json({ message: 'Destination not found' });
          }
          res.json(destination);
        } catch (error) {
          res.status(500).json({ message: 'Error fetching destination' });
        }
      };
      
      // Set params
      req.params.id = 'dest1';
      
      // Call the handler
      await getDestinationById(req, res);
      
      // Assertions
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('_id', 'dest1');
      expect(response).to.have.property('name', 'Paris');
    });
    
    it('should return 404 if destination not found', async () => {
      // Mock Destination model
      const Destination = {
        findById: sinon.stub().resolves(null)
      };
      
      // Implementation of get destination by ID handler
      const getDestinationById = async (req, res) => {
        try {
          const destination = await Destination.findById(req.params.id);
          if (!destination) {
            return res.status(404).json({ message: 'Destination not found' });
          }
          res.json(destination);
        } catch (error) {
          res.status(500).json({ message: 'Error fetching destination' });
        }
      };
      
      // Set params
      req.params.id = 'nonexistent';
      
      // Call the handler
      await getDestinationById(req, res);
      
      // Assertions
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Destination not found');
    });
  });
  
  describe('createDestination', () => {
    it('should create a destination with valid data', async () => {
      // Mock Destination model
      const Destination = {
        findOne: sinon.stub().resolves(null),
        prototype: {
          save: sinon.stub().resolves(true)
        }
      };
      
      // Mock constructor
      const DestinationConstructor = function(data) {
        this._id = 'new-dest';
        this.name = data.name;
        this.country = data.country;
        this.description = data.description;
        this.imageUrl = data.imageUrl;
        this.save = Destination.prototype.save;
      };
      
      // Implementation of create destination handler
      const createDestination = async (req, res) => {
        try {
          const { name, country, description, imageUrl } = req.body;
    
          // Check if destination with same name exists
          const existingDestination = await Destination.findOne({ name });
          if (existingDestination) {
            return res.status(400).json({ message: 'Destination with this name already exists' });
          }
    
          const destination = new DestinationConstructor({
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
      };
      
      // Set request body
      req.body = {
        name: 'Berlin',
        country: 'Germany',
        description: 'Historic city with rich culture',
        imageUrl: 'https://example.com/berlin.jpg'
      };
      
      // Call the handler
      await createDestination(req, res);
      
      // Assertions
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('name', 'Berlin');
      expect(response).to.have.property('country', 'Germany');
    });
    
    it('should return 400 if destination with same name exists', async () => {
      // Mock Destination model
      const Destination = {
        findOne: sinon.stub().resolves({
          _id: 'existing',
          name: 'Paris',
          country: 'France'
        })
      };
      
      // Implementation of create destination handler
      const createDestination = async (req, res) => {
        try {
          const { name, country, description, imageUrl } = req.body;
    
          // Check if destination with same name exists
          const existingDestination = await Destination.findOne({ name });
          if (existingDestination) {
            return res.status(400).json({ message: 'Destination with this name already exists' });
          }
    
          // The rest of the function would not be called
          res.status(201).json({});
        } catch (error) {
          res.status(400).json({ message: 'Error creating destination' });
        }
      };
      
      // Set request body with existing name
      req.body = {
        name: 'Paris',
        country: 'France',
        description: 'City of Light',
        imageUrl: 'https://example.com/paris.jpg'
      };
      
      // Call the handler
      await createDestination(req, res);
      
      // Assertions
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Destination with this name already exists');
    });
  });
  
  describe('deleteDestination', () => {
    it('should delete a destination', async () => {
      // Mock Destination model
      const Destination = {
        findByIdAndDelete: sinon.stub().resolves({
          _id: 'dest1',
          name: 'Paris',
          country: 'France'
        })
      };
      
      // Implementation of delete destination handler
      const deleteDestination = async (req, res) => {
        try {
          const destination = await Destination.findByIdAndDelete(req.params.id);
          if (!destination) {
            return res.status(404).json({ message: 'Destination not found' });
          }
          res.json({ message: 'Destination deleted successfully' });
        } catch (error) {
          res.status(500).json({ message: 'Error deleting destination' });
        }
      };
      
      // Set params
      req.params.id = 'dest1';
      
      // Call the handler
      await deleteDestination(req, res);
      
      // Assertions
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Destination deleted successfully');
    });
    
    it('should return 404 if destination not found', async () => {
      // Mock Destination model
      const Destination = {
        findByIdAndDelete: sinon.stub().resolves(null)
      };
      
      // Implementation of delete destination handler
      const deleteDestination = async (req, res) => {
        try {
          const destination = await Destination.findByIdAndDelete(req.params.id);
          if (!destination) {
            return res.status(404).json({ message: 'Destination not found' });
          }
          res.json({ message: 'Destination deleted successfully' });
        } catch (error) {
          res.status(500).json({ message: 'Error deleting destination' });
        }
      };
      
      // Set params
      req.params.id = 'nonexistent';
      
      // Call the handler
      await deleteDestination(req, res);
      
      // Assertions
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Destination not found');
    });
  });
}); 