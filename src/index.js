const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


dotenv.config();

const app = express();


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://flower:NREvRIKWBdf4El4Y@cluster0.kvecz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });	
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.log ('error:',error.message);
  }
};
run().catch(console.dir);

let db = client.db("myAppDB");


const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;


// Enable CORS for specific origin
//app.use(cors({
//  origin: 'http://localhost:3000', // Replace with your frontend URL
//  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
//  credentials: true, // If you need to send cookies or authentication
//}));

app.use(cors());


// Middleware
app.use(express.Router());
app.use(express.json());
// Routes

// 1. User Signup
app.post('/signup', async (req, res) => {

  try {
    if (!db) {
      throw new Error('Database not connected');
    }
    const usersCollection = db.collection('myAppCollec');
    const { email, password } = req.body;
    console.log('email:', email);
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("I have an hashed password")
    const newUser = { email, password: hashedPassword };

    await usersCollection.insertOne(newUser);
    console.log("I can write to the DB")
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. User Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!db) {
      throw new Error('Database not connected');
    }
    const usersCollection = db.collection('myAppCollec');
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. Protected Route Example
app.get('/protected', (req, res) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: `Welcome, user ${decoded.id}` });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});
// Basic route for testing
app.get('/', (req, res) => {
  res.send('Backend is working!');
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
