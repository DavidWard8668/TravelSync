import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock APIs that are not available in Node.js environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Web APIs for crisis support features
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    ...window.navigator,
    geolocation: {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 100
          }
        })
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    },
    serviceWorker: {
      register: vi.fn().mockResolvedValue({}),
      ready: Promise.resolve({})
    }
  }
})

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted'),
    close: vi.fn()
  }))
})

// Mock IndexedDB for offline functionality
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  readyState: 'done'
}

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: {
    open: vi.fn().mockReturnValue(mockIDBRequest),
    deleteDatabase: vi.fn().mockReturnValue(mockIDBRequest)
  }
})

// Mock crypto for secure operations
Object.defineProperty(window, 'crypto', {
  writable: true,
  value: {
    randomUUID: vi.fn().mockReturnValue('mock-uuid-1234-5678-90ab-cdef'),
    getRandomValues: vi.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  }
})

// Mock crisis hotline APIs
global.fetch = vi.fn()

// Setup for crisis support testing
beforeEach(() => {
  vi.clearAllMocks()
  
  // Reset fetch mock
  ;(global.fetch as any).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200
  })
})