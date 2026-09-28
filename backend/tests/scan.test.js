jest.setTimeout(120000);
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User.model');
const Scan = require('../src/models/Scan.model');

let token;
let mongoServer;

describe('Scan API', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Scan.deleteMany({});

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Scanner User',
      email: 'scanner@example.com',
      password: 'password123'
    });
    token = res.body.token;
  });

  it('should fail to upload scan if no photo provided', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('No photo was uploaded');
  });

  it('should get empty scan history initially', async () => {
    const res = await request(app)
      .get('/api/scans')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.scans).toEqual([]);
  });
});
