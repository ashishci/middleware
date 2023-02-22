import config from '../config'

const { host, port, password, timeout, ttl } =
  jest.requireActual<typeof config>('../config')

describe('testing config structure', () => {
  test('host is not null', () => {
    expect(host).not.toBeNull()
  })

  test('port is not null', () => {
    expect(port).not.toBeNull()
  })

  test('port is not null', () => {
    expect(password).not.toBeNull()
  })

  test('timeout is not null', () => {
    expect(timeout).not.toBeNull()
  })

  test('ttl is not null', () => {
    expect(ttl).not.toBeNull()
  })
})

export {}
