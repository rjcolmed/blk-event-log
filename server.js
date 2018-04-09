//SETUP
require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const axios = require('axios')
const getEventsByUnit = require('./web_services/getEventsByUnit')
const getBuildings = require('./web_services/getBuildings')
const cors = require('cors')

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())

const port = process.env.port || '3002'
const baseUrl = process.env.BASE_URL

app.get('/', (req, res) => {
  res.render('index')
})

app.post('/', (req, res) => {
  getBuildings(baseUrl, req, res, app)
})

app.get('/api/events', (req, res) => {
  res.json(app.locals.events)
})

app.listen(port, () => {
  console.log(`Listening on ${port}`)
})

