import addMinutes from 'date-fns/addMinutes'
import { differenceInHours } from 'date-fns/differenceInHours'
import { differenceInMinutes } from 'date-fns/differenceInMinutes'
import { isBefore } from 'date-fns/isBefore'
import { isValid } from 'date-fns/isValid'
import {
  APPOINTMENT_LENGTH,
  HOURS_IN_DAY,
  MINUTES_IN_HOUR,
  PROVIDER_USER_TYPE,
  RESERVATION_TIMEOUT,
} from '../constants/index.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { ForbiddenError } from '../errors/ForbiddenError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { AppointmentsRepository } from '../repositories/appointments.repository.js'
import { UsersRepository } from '../repositories/users.repository.js'

export class ReservationsService {
  constructor() {
    this.usersRepository = new UsersRepository()
    this.appointmentsRepository = new AppointmentsRepository()
  }

  _validAppointmentTimeMinutes = []

  get validAppointmentTimeMinutes() {
    if (!this._validAppointmentTimeMinutes.length) {
      let value = 0
      while (value < MINUTES_IN_HOUR) {
        this._validAppointmentTimeMinutes.push(value)
        value += APPOINTMENT_LENGTH
      }
    }

    return this._validAppointmentTimeMinutes
  }

  createAppointments({ providerId, ...availability }) {
    this.validateProvider(providerId)
    const [startAvailability, endAvailability] = this.validateAndSanitizeDates([
      availability.startTime,
      availability.endTime,
    ])
    this.validateNoAppointmentsExist({
      providerId,
      startTime: startAvailability,
      endTime: endAvailability,
    })
    const appointments = []
    let startTime = new Date(startAvailability)
    while (isBefore(startTime, endAvailability)) {
      const endTime = addMinutes(startTime, APPOINTMENT_LENGTH)
      appointments.push({
        startTime,
        endTime,
        providerId,
      })
      startTime = endTime
    }
    return this.appointmentsRepository.addAppointments(appointments)
  }

  reserveAppointment(appointmentId, clientId) {
    const appointment = this.appointmentsRepository.getAppointment(appointmentId)
    if (!this.isAppointmentAvailable(appointment)) {
      throw new BadRequestError(`Appointment is no longer available`)
    }
    return this.appointmentsRepository.updateAppointment(appointmentId, {
      clientId,
      reservedAt: new Date(),
    })
  }

  confirmAppointment(appointmentId, clientId) {
    const appointment = this.appointmentsRepository.getAppointment(appointmentId)
    if (!appointment) {
      throw new NotFoundError(`Appointment not found`)
    }
    if (appointment.clientId !== clientId) {
      throw new ForbiddenError(`Appointment cannot be confirmed`)
    }
    return this.appointmentsRepository.updateAppointment(appointmentId, {
      confirmedAt: new Date(),
    })
  }

  getAvailableAppointmentsForProvider({ providerId, ...availability }) {
    const [startTime, endTime] = this.validateAndSanitizeDates([
      availability.startTime,
      availability.endTime,
    ])
    return this.appointmentsRepository
      .getAppointments({ providerId, startTime, endTime })
      .filter((appointment) => this.isAppointmentAvailable(appointment))
      .map((appointment) => ({ ...appointment, clientId: null, reservedAt: null }))
  }

  isAppointmentAvailable(appointment) {
    const now = new Date()
    return Boolean(
      appointment &&
        // not confirmed yet
        !appointment.confirmedAt &&
        // not reserved or reservation has expired
        (!appointment.reservedAt ||
          differenceInMinutes(now, appointment.reservedAt) > RESERVATION_TIMEOUT) &&
        // not within 24 hours of appointment start
        differenceInHours(appointment.startTime, now) >= HOURS_IN_DAY
    )
  }

  validateProvider(providerId) {
    const user = this.usersRepository.findUserById(providerId)
    if (!user || user.userType !== PROVIDER_USER_TYPE) {
      throw new NotFoundError(`Provider does not exist`)
    }
  }

  validateAndSanitizeDates(dates) {
    return dates.map((date) => {
      date = new Date(date)
      if (!isValid(date)) {
        throw new BadRequestError(`Invalid date string detected`)
      }
      if (!this.validAppointmentTimeMinutes.includes(date.getMinutes())) {
        throw new BadRequestError(
          `Start and end time values must be in ${APPOINTMENT_LENGTH} minute increments`
        )
      }
      date.setMinutes(date.getMinutes(), 0, 0)
      return date
    })
  }

  validateNoAppointmentsExist({ providerId, startTime, endTime }) {
    const existingAppointments = this.getAvailableAppointmentsForProvider({
      providerId,
      startTime,
      endTime,
    })

    if (existingAppointments.length !== 0) {
      throw new ForbiddenError(
        `Appointments have already been created for this provider and time span`
      )
    }
  }
}
