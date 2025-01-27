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
    const bookedSessionCollection = db.collection('bookedSessions')
    const commentCollection =  db.collection('comments')
    const noteCollection =  db.collection('notes')
    const feedbackCollection =  db.collection('feedbacks')
    const uploadMaterialCollection =  db.collection('uploadMaterials')
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


    //normal users
    app.get('/tutor-user', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });



    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })



    app.delete('/session/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await sessionCollection.deleteOne(query);
      res.send(result);
    })



    app.delete('/delete-note/:id', verifyToken,async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await noteCollection.deleteOne(query);
      res.send(result);
    })

    

    app.delete('/delete-materials/:id', verifyToken,async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await uploadMaterialCollection.deleteOne(query);
      res.send(result);
    })


    
    

    // menu related apis
    app.get('/sessions', async (req, res) => {
      const result = await sessionCollection.find().toArray();
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





    app.get('/users/student/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log('Decoded Token Email:', req.decoded.email); // Debugging
      console.log('Requested Email:', email);
      // console.log(req.decoded);

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let student = false;
      if (user) {
        student = user?.role === 'student';
      }
      console.log('Student:', student);
      
      res.send({ student });
    })




    app.post('/create-session', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await sessionCollection.insertOne(item);
      res.send(result);
    });


    app.post('/create-note', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await noteCollection.insertOne(item);
      res.send(result);
    });



    app.post('/feedback', verifyToken, verifyAdmin, async (req, res) => {
      const {title,description,tutorname,email,session_title} = req.body;
      const result = await feedbackCollection.insertOne({title,description,tutorname,email,session_title});
      res.send(result);
    });

   

    app.post('/upload-material', verifyToken,async (req, res) => {
      const {session_title, title, sessionId, tutorEmail, link, imageUrl } = req.body;
      const result = await uploadMaterialCollection.insertOne({ session_title,title, sessionId, tutorEmail, link, imageUrl,session_title });
      res.send(result);
    });


    app.get('/view-materials', async (req, res) => {
      const result = await uploadMaterialCollection.find().toArray();
      res.send(result);
    });


    app.get('/feedbacks', async (req, res) => {
      const result = await feedbackCollection.find().toArray();
      res.send(result);
    });


    app.get("/search", verifyToken,verifyAdmin, async (req, res) => {
      const query = req.query.q;

      try {
        const items = await userCollection
          .find({
            $or: [{ email: { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } },
           ],
          })
          .toArray();
        res.send(items);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });


    app.get('/manage-note', async (req, res) => {
      const result = await noteCollection.find().toArray();
      res.send(result);
    });


    


    app.post('/bookings', async (req, res) => {
      const item = req.body;
      console.log(item);

      if(item._id)
      {
         delete item._id
      }
    
      try {
      
        const existingBooking = await bookedSessionCollection.findOne({
          email: item.email,
          session_title: item.session_title,
          

        });
    
        if (existingBooking) {
          return res
            .status(400)
            .send({ message: "You have already booked this session!" });
        }
    
    
        const result = await bookedSessionCollection.insertOne(item);
        res.send(result);
      } catch (error) {
        console.error("Error inserting booking:", error);
        res.status(500).send({ message: "Failed to book session!" });
      }
    });
    


    app.post("/comment", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await commentCollection.insertOne(data);
      res.send(result);
    });

    app.get("/commentm/:id", async (req, res) => {
      const id = req.params.id;
      const result = await commentCollection.find({ productId: id }).toArray();
      res.send(result);
    });





    app.get("/bookedsessionall", async (req, res) => {
    
    
      const result = await bookedSessionCollection.find().toArray();
      res.send(result);
      
    });

    // app.get("/bookedsession/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const result = await bookedSessionCollection.find({ _id: id }).toArray();
    //   res.send(result);
    // });
    
    

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



    app.patch('/sessions/:status/:id', verifyToken, verifyAdmin, async (req, res) => {
      const {status,id}= req.params;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: status
        }
      }
      const result = await sessionCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })



    app.patch('/request/:id', verifyToken, async (req, res) => {
      const {id}= req.params;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: 'pending'
        }
      }
      const result = await sessionCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    app.patch('/registration/fee/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const {fee}= req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          fee: fee
        }
      }
      const result = await sessionCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })




    app.patch('/manage-note/:id', async (req, res) => {
      const id = req.params.id;
      const { title, description } = req.body; 
    
      try {
        const result = await noteCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              title,
              description,
            },
          }
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating note:", error);
        res.status(500).send({ message: "Failed to update note" });
      }
    });


 


    app.patch('/update-materials/:id',verifyToken, async (req, res) => {
      const id = req.params.id;
      const { title, link} = req.body; 
    
      try {
        const result = await uploadMaterialCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              title,
              link,
            },
          }
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating note:", error);
        res.status(500).send({ message: "Failed to update note" });
      }
    });





    app.patch('/manage-session/:id', verifyToken,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const { title, description, start_date, end_date, duration, fee, class_start_date, class_end_date  } = req.body; 
    
      try {
        const result = await sessionCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              title,
              description,
              start_date,
              end_date,
              duration,
              fee,
              class_start_date,
              class_end_date,

      
            },
          }
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating note:", error);
        res.status(500).send({ message: "Failed to update note" });
      }
    });



   
    





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