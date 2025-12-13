import { describe, it, expect } from 'vitest'
import { sanitizeStack, generateReportBody, SanitizedError } from './errorSanitizer'

describe('errorSanitizer', () => {
  describe('sanitizeStack', () => {
    it('should sanitize Unix-style paths with username', () => {
      const error = new Error('Test error')
      error.stack = `Error: Test error
    at Object.<anonymous> (/Users/johnsmith/projects/hyle/src/App.tsx:10:5)
    at Module._compile (/Users/johnsmith/projects/hyle/node_modules/ts-node/src/index.ts:1056:36)`

      const result = sanitizeStack(error, 'johnsmith')

      expect(result.stack).toContain('/Users/<USER>/projects/hyle/src/App.tsx')
      expect(result.stack).toContain('/Users/<USER>/projects/hyle/node_modules')
      expect(result.stack).not.toContain('johnsmith')
    })

    it('should sanitize Linux home directory paths', () => {
      const error = new Error('Test error')
      error.stack = `Error: Test error
    at Object.<anonymous> (/home/developer/code/hyle/src/main.ts:5:10)`

      const result = sanitizeStack(error, 'developer')

      expect(result.stack).toContain('/home/<USER>/code/hyle/src/main.ts')
      expect(result.stack).not.toContain('developer')
    })

    it('should sanitize Windows-style paths with username', () => {
      const error = new Error('Test error')
      error.stack = `Error: Test error
    at Object.<anonymous> (C:\\Users\\jdoe\\Documents\\hyle\\src\\App.tsx:10:5)
    at Module._compile (C:/Users/jdoe/projects/hyle/index.ts:20:10)`

      const result = sanitizeStack(error, 'jdoe')

      expect(result.stack).toContain('C:\\Users\\<USER>\\Documents')
      expect(result.stack).toContain('C:/Users/<USER>/projects')
      expect(result.stack).not.toContain('jdoe')
    })

    it('should sanitize username in error message', () => {
      const error = new Error('File not found: /Users/secretuser/data/file.txt')
      error.stack = 'Error: File not found: /Users/secretuser/data/file.txt\n    at test.ts:1:1'

      const result = sanitizeStack(error, 'secretuser')

      expect(result.message).toContain('/Users/<USER>/data/file.txt')
      expect(result.message).not.toContain('secretuser')
    })

    it('should handle empty username gracefully', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at /Users/someone/file.ts:1:1'

      const result = sanitizeStack(error, '')

      expect(result.name).toBe('Error')
      expect(result.message).toBe('Test error')
      expect(result.stack).toContain('/Users/someone/file.ts')
    })

    it('should handle errors without stack traces', () => {
      const error = new Error('No stack')
      error.stack = undefined

      const result = sanitizeStack(error, 'testuser')

      expect(result.name).toBe('Error')
      expect(result.message).toBe('No stack')
      expect(result.stack).toBe('')
    })

    it('should handle errors without messages', () => {
      const error = new Error()
      error.stack = 'Error\n    at /home/user/test.ts:1:1'

      const result = sanitizeStack(error, 'user')

      expect(result.message).toBe('')
      expect(result.stack).toContain('/home/<USER>/test.ts')
    })

    it('should handle special regex characters in username', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at /home/user.name+test/file.ts:1:1'

      const result = sanitizeStack(error, 'user.name+test')

      expect(result.stack).toContain('/home/<USER>/file.ts')
      expect(result.stack).not.toContain('user.name+test')
    })

    it('should handle multiple occurrences of username', () => {
      const error = new Error('Test error')
      error.stack = `Error: Test error
    at /Users/dev/project/src/a.ts:1:1
    at /Users/dev/project/src/b.ts:2:2
    at /Users/dev/project/src/c.ts:3:3`

      const result = sanitizeStack(error, 'dev')

      const userCount = (result.stack.match(/<USER>/g) || []).length
      expect(userCount).toBe(3)
      expect(result.stack).not.toContain('/Users/dev/')
    })

    it('should preserve error name', () => {
      const error = new TypeError('Invalid type')
      error.stack = 'TypeError: Invalid type\n    at test.ts:1:1'

      const result = sanitizeStack(error, 'testuser')

      expect(result.name).toBe('TypeError')
    })
  })

  describe('generateReportBody', () => {
    it('should include app version', () => {
      const sanitizedError: SanitizedError = {
        name: 'Error',
        message: 'Test error',
        stack: 'Error: Test error\n    at test.ts:1:1',
      }

      const report = generateReportBody(sanitizedError)

      expect(report).toContain('App Version:')
    })

    it('should include platform information', () => {
      const sanitizedError: SanitizedError = {
        name: 'Error',
        message: 'Test error',
        stack: 'Error: Test error\n    at test.ts:1:1',
      }

      const report = generateReportBody(sanitizedError)

      expect(report).toContain('Platform:')
    })

    it('should include timestamp', () => {
      const sanitizedError: SanitizedError = {
        name: 'Error',
        message: 'Test error',
        stack: 'Error: Test error\n    at test.ts:1:1',
      }

      const report = generateReportBody(sanitizedError)

      expect(report).toContain('Timestamp:')
      // ISO timestamp format check
      expect(report).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should include error details section', () => {
      const sanitizedError: SanitizedError = {
        name: 'TypeError',
        message: 'Cannot read property',
        stack: 'TypeError: Cannot read property\n    at file.ts:10:5',
      }

      const report = generateReportBody(sanitizedError)

      expect(report).toContain('ERROR DETAILS')
      expect(report).toContain('Error Type: TypeError')
      expect(report).toContain('Message: Cannot read property')
    })

    it('should include stack trace section', () => {
      const sanitizedError: SanitizedError = {
        name: 'Error',
        message: 'Test',
        stack: 'Error: Test\n    at /home/<USER>/project/file.ts:1:1',
      }

      const report = generateReportBody(sanitizedError)

      expect(report).toContain('STACK TRACE')
      expect(report).toContain('/home/<USER>/project/file.ts')
    })

    it('should have proper header and footer', () => {
      const sanitizedError: SanitizedError = {
        name: 'Error',
        message: 'Test',
        stack: 'Error: Test',
      }

      const report = generateReportBody(sanitizedError)

      expect(report).toContain('HYLE ERROR REPORT')
      expect(report).toContain('END OF REPORT')
    })
  })
})
