declare global {
  namespace Express {
    interface Request {
      username: string;
      role: Role;
    }
  }
}

import express, { Request, Response, NextFunction } from 'express'
import auth from 'basic-auth'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const app = express()
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}));

type Role = 'admin' | 'customer'

type User = {
  username: string
  password: string
  role: Role
  money?: number //define as optional key (Admin account does not has money key)
}

const initialUsers: User[] = [
  {
    username: 'admin',
    password: '$2b$10$yKLJIkR2w0CQCTp1R3/RBuYIOUJmTH4aa2TB53tN21JRco5cy9wp2', //hashed from "1234"
    role: 'admin'
  },
]

let users: User[] = [...initialUsers]

const SECRET = 'mysecret'

app.get('/user/login', async (req, res) => {
  const user = auth(req)
  if (!user) return res.status(404).json({ status: 'failed', message: 'Invalid username or password' })

  const username = user.name
  const password = user.pass
})

app.post('/user/regis', async (req, res) => {
    return res.status(401).json({status: 'failed', message: 'Authentication failed'})
    return res.status(400).json({status: 'failed', message: 'Username is already used'})
    return res.status(400).json({status: 'failed', message: 'Invalid input'})
})

app.get('/money', async (req, res) => {
    return res.status(401).json({status: 'failed', message: 'Authentication failed'})
})

app.put('/money/topup', (req, res) => {
    return res.status(401).json({status: 'failed', message: 'Authentication failed'})
    return res.status(400).json({status: 'failed', message: "Invalid input"})
})

app.delete('/reset', (req, res) => {
  return res.json({status: 'success'})
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log('Server is running at port ' + port)
})
