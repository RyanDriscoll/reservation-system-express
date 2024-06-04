import express from 'express'
import { ReservationsService } from './services/reservations.service.js'

const port = 3000
const service = new ReservationsService()
const app = express()
app.use(express.json())

app.post('/appointments', (req, res) => {
  try {
    const { providerId, startTime, endTime } = req.body
    const appointments = service.createAppointments({
      providerId,
      startTime,
      endTime,
    })
    res.status(201).send(appointments)
  } catch (error) {
    console.error(error)
    res.status(error.status ?? 500).send(error.message)
  }
})

app.get('/appointments', (req, res) => {
  try {
    const { providerId, startTime, endTime } = req.query
    const appointments = service.getAvailableAppointmentsForProvider({
      providerId,
      startTime,
      endTime,
    })
    res.status(200).send(appointments)
  } catch (error) {
    console.error(error)
    res.status(error.status ?? 500).send(error.message)
  }
})

app.patch('/appointments/:appointmentId/reserve', (req, res) => {
  try {
    const { appointmentId } = req.params
    const { clientId } = req.body
    const appointment = service.reserveAppointment(appointmentId, clientId)
    res.status(200).send(appointment)
  } catch (error) {
    console.error(error)
    res.status(error.status ?? 500).send(error.message)
  }
})

app.patch('/appointments/:appointmentId/confirm', (req, res) => {
  try {
    const { appointmentId } = req.params
    const { clientId } = req.body
    const appointment = service.confirmAppointment(appointmentId, clientId)
    res.status(200).send(appointment)
  } catch (error) {
    console.error(error)
    res.status(error.status ?? 500).send(error.message)
  }
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
