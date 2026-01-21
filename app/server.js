import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ServerApiVersion } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_SERVER_ERROR: 500
};

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_USER = process.env.MONGO_USER || 'mongo_dev_user';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || 'mongo_dev_password';
const MONGO_HOST = process.env.MONGO_HOST || 'localhost:27017';
const MONGO_URL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}`;

const DB_NAME = "user-account";
const COLLECTION_NAME = "users";

const client = new MongoClient(MONGO_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let server;

app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

try {
  console.log(`Connecting to MongoDB at ${MONGO_HOST}...`);
  await client.connect();
  await client.db("admin").command({ ping: 1 });
  db = client.db(DB_NAME);
  console.log('Connected to MongoDB');
} catch (error) {
  const reason = error.cause?.code || error.message || 'Unknown error';
  console.warn(`MongoDB Unavailable (${reason}). Starting in OFFLINE mode.`);
}

server = app.listen(PORT, () => {
  const status = db ? 'CONNECTED' : 'OFFLINE (Frontend Dev Mode)';

  console.log(`
  ==================================================
  Server initialized successfully!

  Access the app via localhost or your remote IP
  Port: ${PORT}
  Database: ${status}

  Press Ctrl+C to shut down.
  ==================================================
  `);
});

const validateProfileUpdate = (req, res, next) => {
  const { name, email } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Name is required' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Valid email is required' });
  }

  next();
};

app.get('/get-profile', async (req, res) => {
  try {
    if (!db) {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({ error: 'Database not connected' });
    }

    const user = await db.collection(COLLECTION_NAME).findOne({ userid: 1 });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Profile not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error fetching profile' });
  }
});

app.post('/update-profile', validateProfileUpdate, async (req, res) => {
  try {
    if (!db) {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({ error: 'Database not connected' });
    }

    const { name, email, interests } = req.body;

    const userObj = {
      userid: 1,
      name: name.trim(),
      email: email.trim(),
      interests: interests?.trim() || '',
      updatedAt: new Date()
    };

    const result = await db.collection(COLLECTION_NAME).updateOne(
      { userid: 1 },
      { $set: userObj },
      { upsert: true }
    );

    res.json({
      success: true,
      data: userObj,
      modified: result.modifiedCount > 0
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error updating profile' });
  }
});

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (server) {
    server.close(async () => {
      await client.close();
      process.exit(0);
    });
  } else {
    await client.close();
    process.exit(0);
  }
});
