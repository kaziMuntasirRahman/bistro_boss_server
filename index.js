const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000

//middlewares
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
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

const db = client.db('BistroBoss')
const menuCollection = db.collection('menu')

async function run () {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect()

    app.get('/menu', async (req, res) => {
      console.log("Get '/menu' api is hitting...");
      const result = await menuCollection.find().toArray();
      res.send(result);
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
