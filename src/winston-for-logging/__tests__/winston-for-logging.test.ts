import * as WinstonForLog from '..'

const winstonFor = jest.requireActual<typeof WinstonForLog>('..')

jest.mock('Winston', () => ({
  format: {
    colorize: jest.fn(),
    combine: jest.fn(),
    label: jest.fn(),
    timestamp: jest.fn(),
    simple: jest.fn(),
    json: jest.fn(),
    printf: jest.fn()
  },
  transports: [{ Console: jest.fn() }, { File: jest.fn() }]
}))

describe('winston-for middleware testing', () => {
  test('testing caching service called...', () => {
    const mockLoggingServiceSpy = jest.spyOn(winstonFor, 'loggingService')

    winstonFor.loggingService()
    expect(mockLoggingServiceSpy).toHaveBeenCalled()
    expect(mockLoggingServiceSpy).toHaveBeenCalledTimes(1)
  })
})
