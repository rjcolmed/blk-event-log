const axios = require('axios')

module.exports = (baseUrl, eventsPath, occupanciesPath, eventTypesPath, res, app) => {
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
