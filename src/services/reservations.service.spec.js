import { jest } from '@jest/globals'
import { addHours } from 'date-fns/addHours'
import { subMinutes } from 'date-fns/subMinutes'
import { APPOINTMENT_LENGTH, HOURS_IN_DAY, MINUTES_IN_HOUR } from '../constants'
import { ReservationsService } from './reservations.service'

describe('ReservationsService', () => {
  let service

  beforeEach(() => {
    service = new ReservationsService()
  })

  describe('createAppointments', () => {
    let start
    let end

    beforeEach(() => {
      start = new Date()
    })

    const testCases = []
    let pointer = 0
    while (pointer < HOURS_IN_DAY * MINUTES_IN_HOUR) {
      pointer += APPOINTMENT_LENGTH
      testCases.push([pointer / 60, pointer / APPOINTMENT_LENGTH])
    }

    it.each(testCases)('%d hours contains %d appointments)', (hoursBetween, expected) => {
      service.appointmentsRepository.appointments = []
      start.setHours(0, 0, 0, 0)
      end = addHours(start, hoursBetween)

      service.createAppointments({
        providerId: '1',
        startTime: start,
        endTime: end,
      })

      expect(service.appointmentsRepository.appointments).toHaveLength(expected)
    })
  })

  describe('Validating appointment creation', () => {
    let start
    let end
    let invalidDate

    beforeEach(() => {
      start = new Date()
      start.setMinutes(0, 0, 0)
      end = addHours(start, 1.5)
      invalidDate = new Date('Bad date')
    })

    describe('validateProvider', () => {
      it('should throw an error if the provider does not exist', () => {
        expect(() => service.validateProvider('99')).toThrow('Provider does not exist')
      })
      it('should not throw an error if the provider exists', () => {
        expect(() => service.validateProvider('1')).not.toThrow()
      })
    })

    describe('validateTimeStrings', () => {
      it('should throw an error if the startTime or endTime are invalid', () => {
        expect(() => service.validateAndSanitizeDates([invalidDate, end])).toThrow(
          'Invalid date string detected'
        )

        expect(() => service.validateAndSanitizeDates([start, invalidDate])).toThrow(
          'Invalid date string detected'
        )
      })

      it('should throw an error if the startTime or endTime do not fall on the appointment interval', () => {
        start.setMinutes(start.getMinutes() + 1)
        expect(() => service.validateAndSanitizeDates([start, end])).toThrow(
          `Start and end time values must be in ${APPOINTMENT_LENGTH} minute increments`
        )
      })

      it('should not throw an error if all date strings are valid', () => {
        expect(() => service.validateAndSanitizeDates([start, end])).not.toThrow()
      })
    })

    describe('validateNoAppointmentsExist', () => {
      it('should throw an error if duplicate appointments already exist', () => {
        jest
          .spyOn(service, 'getAvailableAppointmentsForProvider')
          .mockReturnValueOnce(new Array(1))
        expect(() =>
          service.validateNoAppointmentsExist({
            providerId: 1,
            startTime: start,
            endTime: end,
          })
        ).toThrow(
          'Appointments have already been created for this provider and time span'
        )
      })

      it('should not throw an error if no duplicate appointments exist', () => {
        jest.spyOn(service, 'getAvailableAppointmentsForProvider').mockReturnValueOnce([])
        expect(() =>
          service.validateNoAppointmentsExist({
            providerId: 1,
            startTime: start,
            endTime: end,
          })
        ).not.toThrow()
      })
    })
  })

  describe('isAppointmentAvailable', () => {
    it('should return false if appointment is undefined', () => {
      expect(service.isAppointmentAvailable()).toBe(false)
    })

    it('should return false if appointment is already confirmed', () => {
      expect(service.isAppointmentAvailable({ confirmed: true })).toBe(false)
    })

    it('should return false if appointment is reserved', () => {
      expect(service.isAppointmentAvailable({ reservedAt: new Date() })).toBe(false)

      expect(
        service.isAppointmentAvailable({
          reservedAt: subMinutes(new Date(), 30),
        })
      ).toBe(false)
    })

    it('should return false if appointment is within 24 hours', () => {
      expect(service.isAppointmentAvailable({ startTime: new Date() })).toBe(false)

      expect(
        service.isAppointmentAvailable({
          startTime: addHours(new Date(), 23),
        })
      ).toBe(false)
    })

    it('should return true if appointment is at least 24 hours away', () => {
      const now = new Date()
      expect(
        service.isAppointmentAvailable({
          startTime: addHours(now, 24),
        })
      ).toBe(true)
    })

    it('should return true if appointment was reserved over 30 minutes ago without confirming', () => {
      const now = new Date()
      expect(
        service.isAppointmentAvailable({
          reservedAt: subMinutes(now, 31),
          startTime: addHours(now, 25),
        })
      ).toBe(true)
    })
  })
})
