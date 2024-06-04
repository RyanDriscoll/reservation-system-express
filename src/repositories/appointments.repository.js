import { randomUUID } from 'crypto'
import { isWithinInterval } from 'date-fns/isWithinInterval'
import { parseISO } from 'date-fns/parseISO'

export class AppointmentsRepository {
  appointments = []

  createAppointment({ providerId, startTime, endTime }) {
    return this.stringifyDates({
      id: randomUUID(),
      startTime,
      endTime,
      providerId,
      clientId: null,
      reservedAt: null,
      confirmedAt: null,
    })
  }

  addAppointments(appointments) {
    const newAppointments = appointments.map(this.createAppointment.bind(this))
    this.appointments = this.appointments.concat(newAppointments)
  }

  getAppointments({ providerId, clientId, startTime, endTime }) {
    const interval = {
      start: startTime,
      end: endTime,
    }
    const appointments = this.appointments.reduce((appts, appointment) => {
      const st = parseISO(appointment.startTime)
      const et = parseISO(appointment.endTime)
      if (
        (!providerId || providerId === appointment.providerId) &&
        (!clientId || clientId === appointment.clientId) &&
        isWithinInterval(st, interval) &&
        isWithinInterval(et, interval)
      ) {
        appts.push({
          ...appointment,
          startTime: st,
          endTime: et,
        })
      }
      return appts
    }, [])
    return appointments
  }

  getAppointment(id) {
    return this.appointments.find((appt) => appt.id === id)
  }

  updateAppointment(id, updates) {
    const appointment = this.appointments.find((appt) => appt.id === id)
    if (!appointment) {
      return
    }
    return Object.assign(appointment, this.stringifyDates(updates))
  }

  stringifyDates(partialAppointment) {
    const dateProperties = ['startTime', 'endTime', 'reservedAt', 'confirmedAt']
    dateProperties.forEach((dp) => {
      if (partialAppointment[dp] && partialAppointment[dp] instanceof Date) {
        partialAppointment[dp] = partialAppointment[dp].toISOString()
      }
    })
    return partialAppointment
  }
}
