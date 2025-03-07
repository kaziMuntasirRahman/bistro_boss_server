steps of jwt implementation
---------------------------
1. install jwt
    install command: npm i jsonwebtoken

2. import jwt in backend
    const jwt = require('jsonwebtoken')

3. create a secret
    to create a secret, we will go to terminal. type 'node' and enter
    then we will type "require('crypto').randomBytes(64).toString('hex )" and then enter
    copy the 64 bit secret

4. store the secret in .env file
    ACCESS_TOKEN_SECRET=64_bit_secret

5. create a jwt related api and create a token
    app.post("/jwt", async(req, res)=>{
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.send({token})
    }) 

