import * as Winston from 'winston'
import * as WinstonForLog from '..'

const winstonFor = jest.requireActual<typeof WinstonForLog>('..')

jest.mock('Winston', () => ({
  format: {
    colorize: jest.fn(),
    combine: jest.fn(),
    label: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn()
  },
  transports: [{ Console: jest.fn() }, { File: jest.fn() }]
}))

describe('winston-for-logging middleware testing', () => {
  test('testing winston for logging function called...', () => {
    const mockWinstonForLoggingSpy = jest.spyOn(winstonFor, 'winstonForLogging')

    winstonFor.winstonForLogging()
    expect(mockWinstonForLoggingSpy).toHaveBeenCalled()
    expect(mockWinstonForLoggingSpy).toHaveBeenCalledTimes(1)
  })
})
