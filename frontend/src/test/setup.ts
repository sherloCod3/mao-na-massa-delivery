import '@testing-library/jest-dom'

// Mock scrollIntoView for jsdom (not implemented by default)
Element.prototype.scrollIntoView = vi.fn()
Element.prototype.scrollIntoViewIfNeeded = vi.fn()
