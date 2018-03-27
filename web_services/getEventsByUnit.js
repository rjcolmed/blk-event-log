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
        
        return newEventsList.filter(event => event.Number )
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
  
          return [...newUnitEventsList].sort((a, b) => {
            return a.Number.localeCompare(b.Number)
          })
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
          const groupedEvents = []

          for (const key in eventsByUnit) {
            if ( eventsByUnit.hasOwnProperty(key) ) {
              groupedEvents.push(eventsByUnit[key])
            }
          }
          app.locals.events = groupedEvents
          res.send('Events ready to be consumed at /api/events')
        })
      })
      .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}
