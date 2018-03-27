//SETUP
require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const axios = require('axios')

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

const port = process.env.port || '3002'

const baseUrl = process.env.BASE_URL

//ROUTES
app.get('/', (req, res) => {
  res.render('index')
})

app.post('/', (req, res) => {
  const username = req.body.username
  const password = req.body.password
  const deviceId = req.body.deviceId
  const getBuildingsPath = `/?u=${username}&p=${password}&t=2&d=${deviceId}&format=json`

  let deviceDetails = `{
    "AppVersion": "1",
    "DeviceId": "${deviceId}",
    "DeviceNickname": "Test Device",
    "OSVersion": "1",
    "HasBarcodeScanner": "false",
    "AppType": "2",
    "Device": "1",
    "Platform": "1"
  }`

  axios.get(`${baseUrl}${getBuildingsPath}`)
    .then(response => {
      const bldg = response.data.Buildings[0]

      const occupanciesPath = `/Buildings/${bldg.Id}/Occupancies?u=${username}&p=${password}&l=${bldg.LoginId}&d=${deviceId}&format=json`
      const eventTypesPath = `/Buildings/${bldg.Id}/EventLogTypes?u=${username}&p=${password}&l=${bldg.LoginId}&d=${deviceId}&format=json`
      const eventsPath = `/Buildings/${bldg.Id}/Events?u=${username}&p=${password}&l=${bldg.LoginId}&d=${deviceId}&format=json`

      if ( bldg.DeviceStatus === 0 ) {
        const authDevicePath = `/Auth?u=${username}&p=${password}&l=${bldg.LoginId}&format=json`
        
        return axios({
            method: 'post',
            url: `${baseUrl}${authDevicePath}`,
            headers: {
              'Content-Type': 'application/json'
            },
            data: deviceDetails
          })
          .then(results => {
            return getEventsByUnit(baseUrl, eventsPath, occupanciesPath, eventTypesPath, res)
          })
          .catch(err => console.log('Device authorization failed: ', err))
      } else {
        getEventsByUnit(baseUrl, eventsPath, occupanciesPath, eventTypesPath, res)
      }
  })
  .catch(err => console.log(err))
})

app.get('/api/events', (req, res) => {
  res.json(app.locals.events)
})

app.listen(port, () => {
  console.log(`Listening on ${port}`)
})

const getEventsByUnit = (baseUrl, eventsPath, occupanciesPath, eventTypesPath, res) => {
  return axios.get(`${baseUrl}${eventsPath}`)
    .then(allEvents => {

      return allEvents.data.map(event => {
        return { 
          OccupancyId: event.OccupancyId,
          TypeId: event.TypeId
        }
      })
    })
    .then(newEventsList => {
      axios.get(`${baseUrl}${occupanciesPath}`)
      .then(allOccupancies => {
        newEventsList.forEach(newEvent => {
          allOccupancies.data.forEach(occupancy => {
            if ( occupancy.Id === newEvent.OccupancyId ) {
              newEvent.Number = occupancy.Number
            }
          })
        })

        return newEventsList
      })
      .then(newUnitEventsList => {
        axios.get(`${baseUrl}${eventTypesPath}`)
        .then(allEventTypes => {
          allEventTypes.data.forEach(eventType => {
            newUnitEventsList.forEach(newUnitEvent => {
              if ( eventType.Id === newUnitEvent.TypeId ) {
                newUnitEvent.ShortDescription = eventType.ShortDescription
              }
            })
          })

          return newUnitEventsList
        })
        .then(newUnitEventsTypesList => {
          return newUnitEventsTypesList.reduce((acc, nextEvent) => {
            delete nextEvent.OccupancyId
            delete nextEvent.TypeId

            if ( acc.hasOwnProperty(nextEvent.Number) ) {
              acc[nextEvent.Number].events.push(nextEvent)
              acc[nextEvent.Number].count++
            } else {
              acc[nextEvent.Number] = { events: [nextEvent], count: 1 }
            }

            return acc
          }, {})
        })
        .then(eventsByUnit => {
          app.locals.events = eventsByUnit
          res.send('Events ready to be consumed at /api/events')
        })
      })
      .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}