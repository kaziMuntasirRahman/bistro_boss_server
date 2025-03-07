const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const jwt = require('jsonwebtoken')

const app = express()
const port = process.env.PORT || 5000

//middlewares
app.use(cors())
app.use(express.json())

app.get('/', (_, res) => {
  res.send('Hello from the server side...')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clustermuntasir.bwzlexy.mongodb.net/?retryWrites=true&w=majority&appName=clusterMuntasir`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

const db = client.db('BistroBossDB')
const userCollection = db.collection('users')
const menuCollection = db.collection('menu')
const reviewCollection = db.collection('reviews')
const cartCollection = db.collection('carts')

async function run () {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect()

    //middlewares
    const verifyToken = (req, res, next) => {
      console.log('Inside verifyToken middleware: ', req.headers.authorization)
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'Forbidden Access...' })
      }
      const token = req.headers.authorization.split(' ')[1]
      console.log('the token is: ' + token)
      if (!token) {
        return res
          .status(401)
          .send({ message: 'Bad Request!!! no token is served' })
      } else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
          if (error) {
            return res
              .status(403)
              .send({ message: 'Bad Request!!! error token' })
          }
          req.decodedData = decoded
          next()
        })
      }
    }

    //use verify admin after verifying token
    const verifyAdmin = async (req, res, next) => {
      const email = req.decodedData.email
      const query = { email: email }
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'admin'
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next()
    }

    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '7d'
      })
      res.send({ token })
    })

    // add new user
    app.post('/users', async (req, res) => {
      console.log('Post /users api is hitting...')
      const data = req.body
      // check existence of the user
      const checkExistence = await userCollection.findOne({ email: data.email })
      if (checkExistence) {
        return res.send({ message: "It's an existing user.", existUser: true })
      }
      const user_id = (await userCollection.countDocuments()) + 1
      const role = 'user'
      const result = await userCollection.insertOne({ ...data, user_id, role })
      return res.send(result)
    })

    // get all users
    app.get('/users', verifyToken, verifyAdmin, async (_, res) => {
      console.log('Get /users api is hitting...')
      res.send(await userCollection.find().toArray())
    })

    // get an users
    app.get('/users/:email', async (req, res) => {
      console.log('Get /users:email api is hitting...')
      const { email } = req.params
      const result = await userCollection.findOne({ email: email })
      console.log(result)
      res.send(result)
    })

    // delete an uses
    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      console.log('delete /users api is hitting')
      const id = req.params.id
      const result = await userCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(result)
    })

    // check if user is admin
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      // console.log(req.decodedData)
      if (email !== req.decodedData.email) {
        return res.status(403).send({ message: 'unauthorized access!!!' })
      }
      const query = { email: email }
      const user = await userCollection.findOne(query)
      let admin = false
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin })
    })

    // post a recipe
    app.post('/menu', verifyToken, verifyAdmin, async (req, res) => {
      console.log('post /menu api is hitting...')
      const { name, recipe, image, category, price } = req.body
      const result = await menuCollection.insertOne({
        name,
        recipe,
        image,
        category,
        price
      })
      res.send(result)
    })

    // get all menu item
    app.get('/menu', async (_, res) => {
      console.log('Get /menu api is hitting...')
      const result = await menuCollection.find().toArray()
      res.send(result)
    })

    // delete a recipe
    app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      console.log('delete /menu api is hitting...')
      const id = req.params.id
      const result = await menuCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(result)
    })

    // get all reviews
    app.get('/reviews', verifyToken, async (_, res) => {
      console.log('get /reviews api is hitting...')
      const result = await reviewCollection.find().toArray()
      res.send(result)
    })

    // post a cart
    app.post('/carts', verifyToken, async (req, res) => {
      console.log('post /carts api is hitting...')
      const newCart = req.body
      const result = await cartCollection.insertOne(newCart)
      // console.log(result)
      res.send(result)
    })

    // get all cart
    app.get('/carts', verifyToken, async (req, res) => {
      const { email } = req.query
      // console.log(email);
      console.log('get /carts api is hitting...')
      const result = await cartCollection.find({ userEmail: email }).toArray()
      res.send(result)
      // res.send([{ totalCart: result.length }, result])
    })

    // delete an item from cart
    app.delete('/carts/:id', verifyToken, async (req, res) => {
      const { id } = req.params
      console.log('delete /carts/:id api is hitting for id no: ', id)
      const result = await cartCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(result)
    })

    // post a new review
    app.post('/reviews', verifyToken, async (req, res) => {
      console.log('post /reviews api is hitting...')
      const newReview = req.body
      const result = await reviewCollection.insertOne(newReview)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close()
  }
}
run().catch(console.dir)

app.listen(port, () => {
  console.log('The server is running in the port no ' + port)
})
