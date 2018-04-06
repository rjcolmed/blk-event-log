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
              delete newEvent.OccupancyId
            }
          })
        })

        return newEventsList.filter(event => event.Number ) //filter out events whose unot/apt number is undefined
      })
      .then(newUnitEventsList => {
        return newUnitEventsList.map(el => el.Number)
          .filter((num, idx, arr) => arr.indexOf(num) === idx)
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
          .map(aptNum => {
            return {
              'Apartment': aptNum,
              'Items': []
            }
          })
          .map(unit => {
            newUnitEventsList.map(el => {
              if ( unit.Apartment === el.Number ) {
                unit.Items.push(el.TypeId)
              }

                return el
              })

              return unit
          })
      })
      .then(eventsByUnit => {
        app.locals.events = eventsByUnit
  
        res.send('Events ready to be consumed at /api/events')
      })
      .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}
