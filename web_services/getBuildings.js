const axios = require('axios')
const getEventsByUnit = require('./getEventsByUnit')

module.exports = (baseUrl, req, res, app) => {
   
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
        const unitsPath = `/Buildings/${bldg.Id}/PhysicalUnits?u=${username}&p=${password}&l=${bldg.loginId}&d=${deviceId}&format=json`
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
              return getEventsByUnit(baseUrl, eventsPath, occupanciesPath, eventTypesPath, res, app)
            })
            .catch(err => console.log('Device authorization failed: ', err))
        } else {
          getEventsByUnit(baseUrl, eventsPath, occupanciesPath, eventTypesPath, res, app)
        }
      })
      .catch(err => console.log(err))
}

