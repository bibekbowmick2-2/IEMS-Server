require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')

const port = process.env.PORT || 9000
const app = express()
// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.28bsr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  try {
    const db = client.db('study_portal')
    const userCollection = db.collection('users')
    const sessionCollection = db.collection('sessions')
    // const plantsCollection = db.collection('plants')

    // save or update a user in db


    // Generate jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })


    const verifyToken = async (req, res, next) => {
      const token = req.cookies?.token
    
      if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          console.log(err)
          return res.status(401).send({ message: 'unauthorized access' })
        }
        console.log('Decoded JWT:', decoded); 
        req.decoded = decoded;
        next();
      })
    }
    
    
    
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }



    

   
    // users related api
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });



    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    // menu related apis
    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log('Decoded Token Email:', req.decoded.email); // Debugging
      console.log('Requested Email:', email);
      // console.log(req.decoded);

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      console.log('Admin:', admin);
      
      res.send({ admin });
    })



    app.get('/users/tutor/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log('Decoded Token Email:', req.decoded.email); // Debugging
      console.log('Requested Email:', email);
      // console.log(req.decoded);

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let tutor = false;
      if (user) {
        tutor = user?.role === 'tutor';
      }
      console.log('Tutor:', tutor);
      
      res.send({ tutor });
    })




    app.post('/create-session', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await sessionCollection.insertOne(item);
      res.send(result);
    });

    app.patch('/users/:role/:id', verifyToken, verifyAdmin, async (req, res) => {
      const {role,id}= req.params;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: role
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })





    app.post('/users/:email', async (req, res) => {
      const email = req.params.email
      const query = { email }
      const user = req.body
      console.log(user);
      // check if user exists in db
      const isExist = await userCollection.findOne(query)
      if (isExist) {
        return res.send({ message: 'user already exists' })
      }

  

    
  

     

        const result = await userCollection.insertOne({
           ...user,
           timestamp: Date.now(),
   
         })

         res.send(result)
      
      
     
    })

    
    
    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // save a plant data in db
    // app.post('/plants', verifyToken, async (req, res) => {
    //   const plant = req.body
    //   const result = await plantsCollection.insertOne(plant)
    //   res.send(result)
    // })

    // // get all plants from db
    // app.get('/plants', async (req, res) => {
    //   const result = await plantsCollection.find().limit(20).toArray()
    //   res.send(result)
    // })

  
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from studyportal Server..')
})

app.listen(port, () => {
  console.log(`studyportal is running on port ${port}`)
})