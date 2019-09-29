const connectRedis = require('connect-redis')
const cors = require('cors')
const express = require('express')
const session = require('express-session')
const redis = require('redis')

const PORT = 8000

const usersDb = [{ id: '7H5FtwuiIhepa9', name: 'Sven', email: 'sven@example.com' }]

const RedisStore = connectRedis(session)

const app = express()

const sessionOptions = {
  store: new RedisStore({ client: redis.createClient() }),
  secret: 'some secret from your env',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 15 * 1000,
    sameSite: 'lax',
    httpOnly: true,
  },
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1)
  sessionOptions.cookie.secure = true
}

// Change the origin for staging / production
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(session(sessionOptions))

// Middleware to attach the client user data to the request for safe things
// like showing their name or profile picture URL in a nav bar. No ID or anything
// sensitive, which are available on req.session.user for the API server to use.
app.use((req, res, next) => {
  const user = req.session.user
  if (user) {
    const { id, ...clientUserData } = user
    req.clientUserData = clientUserData
  }
  next()
})

// Middleware to require authentication on some pages
const protected = (req, res, next) => {
  if (!req.session.user) {
    res.sendStatus(401)
  } else {
    next()
  }
}

app.get('/login/:email', (req, res) => {
  const foundUser = usersDb.find(u => u.email === req.params.email)
  if (foundUser) {
    req.session.user = foundUser
    res.sendStatus(200)
  } else {
    res.sendStatus(401)
  }
})

app.get('/logout', (req, res) => {
  req.session.destroy()
  res.sendStatus(200)
})

app.get('/me', (req, res) => res.json(req.clientUserData))

app.get('/public-data', (req, res) => res.json({ public: 'data' }))

app.get('/private-data', protected, (req, res) => res.json({ private: 'data' }))

app.listen(PORT, () => console.log(`API listening on port ${PORT}`))
