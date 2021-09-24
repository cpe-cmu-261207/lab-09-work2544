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
import bcrypt, { hash } from 'bcrypt'

const app = express()
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}));

type Role = 'admin' | 'customer'
type UserorOther=User|any
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

var users: User[] = [...initialUsers]

const SECRET = 'mysecret'
type MyJwtPayload = {
  username: string
} & jwt.JwtPayload

app.get('/user/login', async (req, res) => {
  const user = auth(req)
  if (!user) return res.status(404).json({ status: 'failed', message: 'Invalid username or password' })
  const username = user.name
  const password = user.pass
  const foundUser = users.find(x => x.username === username && bcrypt.compareSync(password, x.password))
  console.log(users)
  if (!foundUser) return res.status(404).json({ status: 'failed',"message" : "Invalid username or password" })
  const token = jwt.sign({ username }, SECRET, { expiresIn: '10h' })
  return res.json({ status: 'success', token })
})//ok

app.post('/user/regis', async (req, res) => {  
  const user=req.body;
  let ReqKey=Object.keys(req.body)
  if ('username'==ReqKey[0]&&'password'==ReqKey[1]&&'role'==ReqKey[2])  
  {
    const username = user.username
    const password=user.password
    if(users.find(x=>x.username===username)!==undefined)
    {
      return res.status(400).json({status: 'failed', message: 'Username is already used'})
    }
    if(typeof(user.username)!=="string"&&
       typeof(user.password)!=="string"&&
       typeof(user.role)!=="string")
       {
        return res.status(400).json({status: 'failed', message: 'Invalid input'})
       }
       
    if(user.role=="admin"&&ReqKey.length===3)
    {
      if(user.money!=null)
      {
        return res.status(400).json({status: 'failed', message: 'Invalid input'})
      }
      user.password=bcrypt.hashSync(password,10)
      users.push(user)
      return res.status(200).json({status: 'success', username:username})
    }
    else if(user.role=="customer"&&ReqKey.length===4)
    {
      if(user.money==null)
      {
        return res.status(400).json({status: 'failed', message: 'Invalid input'})
      }
      user.password=bcrypt.hashSync(password,10)
      users.push(user)
      return res.status(200).json({status: 'success', username:username})
    }
  }  
    return res.status(401).json({status: 'failed', message: 'Authentication failed'})
})//ok
const checkToken = async (req: Request, res: Response, next: NextFunction) => {
  const bearerHeader = req.headers['authorization']
  if (bearerHeader) {
    const splited = bearerHeader.split(' ')
    const token = splited[1]
    try {
      const decoded = jwt.verify(token, SECRET) as MyJwtPayload
      const username = decoded.username
      req.username = username
      next()
    } catch {
      return res.status(401).json({ status: 'failed'})
    }
  }
  else
    return res.status(401).json({ status: 'failed' })
}
app.get('/money',checkToken, async (req, res) => {
  const foundUser = users.find(x => x.username === req.username) as User
  if (!foundUser||foundUser.role=="admin")  return res.status(401).json({status: 'failed', message: 'Authentication failed'})
  return res.json({
    status: 'success',
    username: foundUser.username,
    money: foundUser.money
  })  
})

app.put('/money/topup', (req, res) => {
  let ReqKey=Object.keys(req.body)
  if ('username'==ReqKey[0]&&'amount'==ReqKey[1]&&ReqKey.length===2)  
  {
  const foundUser = users.find(x => x.username === req.body.username) as User
  if (!foundUser)  return res.status(401).json({status: 'failed', message: 'Authentication failed'})
  const amount = req.body.amount
  if(amount<0||foundUser.role=="admin")
  return res.status(400).json({status: 'failed', message: "Invalid input"})
  foundUser.money += amount
  return res.json({
    status: 'success',
    username:foundUser.username,
    money: foundUser.money
  })
}
else
{
  return res.status(401).json({status: 'failed', message: 'Authentication failed'})
}
})

app.delete('/reset', (req, res) => {
  users=[initialUsers[0]]
  return res.json({status: 'success'})
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log('Server is running at port ' + port)
})
