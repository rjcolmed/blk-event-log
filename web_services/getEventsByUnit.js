const axios = require('axios')

module.exports = (baseUrl, eventsPath, occupanciesPath, eventTypesPath, res, app) => {

  axios.get(`${baseUrl}${occupanciesPath}`)
    .then(allOccupancies => {
      return allOccupancies.data.map(occupancy => {
        return {
          Id: occupancy.Id,
          Number: occupancy.Number,
          Events: []
        }
      })
    })
    .then(justIdsAndNumbers => {
      axios.get(`${baseUrl}${eventsPath}`)
        .then(allEvents => {
          justIdsAndNumbers.forEach(idAndNumber => {
            return allEvents.data.forEach(event => {
              if ( idAndNumber.Id === event.OccupancyId ) {
                idAndNumber.Events.push(event.TypeId)
              }
            })
          })

          return justIdsAndNumbers.map(eventUnit => {
            delete eventUnit.Id
            return eventUnit
          })
        })
        .then(sortedEventsByUnits => {
          app.locals.events = sortedEventsByUnits

          res.send('Events ready to be consumed at /api/events')
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
  
}
