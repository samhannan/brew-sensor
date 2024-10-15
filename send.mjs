/**
 * @module write
 * Writes a data point to InfluxDB using the Javascript client library with Node.js.
 **/

import 'dotenv/config'
import { InfluxDB, Point } from '@influxdata/influxdb-client'
import request from 'request'
import cron from 'node-cron'

/** Environment variables **/
const url = process.env.INFLUX_URL
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET
const apiUrl = process.env.API_URL


/**
 * Instantiate the InfluxDB client
 * with a configuration object.
 **/
const influxDB = new InfluxDB({ url, token })

/**
 * Create a write client from the getWriteApi method.
 * Provide your `org` and `bucket`.
 **/
const writeApi = influxDB.getWriteApi(org, bucket)

cron.schedule('* * * * *', () => {
    request(apiUrl, (error, response, body) => {
        if (error) {
            console.error(error)
            return
        }

        let {temp_external, temp_sensor} = JSON.parse(body)

        temp_external = parseFloat(temp_external) - 3 // calibration offset to ensure the temp matches the inkbird reading

        /**
         * Create a point and write it to the buffer.
         **/
        const point = new Point('temperature')
            .tag('vessel', 'fv_1')
            .floatField('internal', temp_external)
            .floatField('ambient', temp_sensor)

        writeApi.writePoint(point)

        /**
         * Flush pending writes and close writeApi.
         **/
        writeApi.close().then(() => {
            console.log('Write successful', {
                internal: temp_external,
                ambient: temp_sensor
            })
        })
    })
})
