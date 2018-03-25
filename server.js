//SETUP
require('dotenv').config()
const express = require('express')
const app = express()
const axios = require('axios')

const port = process.env.port || '3002'

//VARIABLES
const username = process.env.USERNAME
const password = process.env.PASSWORD
const deviceId = process.env.DEVICE_ID
const appType = process.env.APP_TYPE
const deviceDetails = `{
                "AppVersion": "1",
                "DeviceId": "${deviceId}",
                "DeviceNickname": "Test Device",
                "OSVersion": "1",
                "HasBarcodeScanner": "false",
                "AppType": "${appType}",
                "Device": "1",
                "Platform": "1"
}`

const baseUrl = process.env.BASE_URL
const getBuildingsPath = `/?u=${username}&p=${password}&t=${appType}&d=${deviceId}&format=json`

//ROUTES
app.get('/', (req, res) => {

  axios.get(`${baseUrl}${getBuildingsPath}`)
    .then(response => {
      const bldg = response.data.Buildings[0]

      const occupanciesPath = `/Buildings/${bldg.Id}/Occupancies?u=${username}&p=${password}&l=${bldg.LoginId}&d=${deviceId}&format=json`
      const eventTypesPath = `/Buildings/${bldg.Id}/EventLogTypes?u=${username}&p=${password}&l=${bldg.LoginId}&d=${deviceId}&format=json`
      const eventsPath = `/Buildings/${bldg.Id}/Events?u=${username}&p=${password}&l=${bldg.LoginId}&d=${deviceId}&format=json`

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
    .catch(err => {
      console.log(err)
      // const authDevicePath = `/Auth?u=${username}&p=${password}&l=${bldg.LoginId}&format=json`

      // axios.post(`${baseUrl}${authDevicePath}`, deviceDetails)
      // .then(newDeviceDetails => {
      //   console.log(newDeviceDetails.data)
      // })
      // .catch(err => console.log('Authorization of device failed:', err))
      })
  })
  .catch(err => console.log(err))
})

app.get('/api/events', (req, res) => {
  res.json(app.locals.events)
})

app.listen(port, () => {
  console.log(`Listening on ${port}`)
})