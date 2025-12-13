/**
 * Error Sanitization Utility
 *
 * Provides functions to sanitize error stack traces by removing PII
 * (Personal Identifiable Information) such as usernames and file paths.
 */

export interface SanitizedError {
  name: string;
  message: string;
  stack: string;
}

/**
 * Sanitizes an error stack trace by replacing the system username with <USER>.
 * This prevents PII from being exposed in error reports.
 *
 * @param error - The error object to sanitize
 * @param username - The system username to scrub from the stack trace
 * @returns A sanitized error object safe for public viewing
 */
export function sanitizeStack(error: Error, username: string): SanitizedError {
  const errorName = error.name || 'Error';
  const errorMessage = error.message || 'Unknown error';
  let errorStack = error.stack || '';

  // Create regex patterns to match the username in various path formats
  // Handles: /Users/username/, /home/username/, C:\Users\username\, etc.
  if (username && username.length > 0) {
    // Escape special regex characters in the username
    const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Pattern for Unix-style paths: /Users/username/ or /home/username/
    const unixPathPattern = new RegExp(
      `(/(?:Users|home)/)${escapedUsername}(/|$)`,
      'gi'
    );

    // Pattern for Windows-style paths: C:\Users\username\ or C:/Users/username/
    const windowsPathPattern = new RegExp(
      `([A-Za-z]:[/\\\\](?:Users|Documents and Settings)[/\\\\])${escapedUsername}([/\\\\]|$)`,
      'gi'
    );

    // Generic pattern: catch any remaining instances of the username in paths
    const genericPattern = new RegExp(
      `([\\\\/])${escapedUsername}([\\\\/])`,
      'gi'
    );

    // Apply sanitization patterns
    errorStack = errorStack
      .replace(unixPathPattern, '$1<USER>$2')
      .replace(windowsPathPattern, '$1<USER>$2')
      .replace(genericPattern, '$1<USER>$2');

    // Also sanitize the error message in case it contains paths
    const sanitizedMessage = errorMessage
      .replace(unixPathPattern, '$1<USER>$2')
      .replace(windowsPathPattern, '$1<USER>$2')
      .replace(genericPattern, '$1<USER>$2');

    return {
      name: errorName,
      message: sanitizedMessage,
      stack: errorStack,
    };
  }

  return {
    name: errorName,
    message: errorMessage,
    stack: errorStack,
  };
}

/**
 * Generates a formatted error report body with system information.
 *
 * @param sanitizedError - The sanitized error object
 * @returns A formatted string suitable for error reporting
 */
export function generateReportBody(sanitizedError: SanitizedError): string {
  // Get app version from package.json (exposed via Vite's define)
  const appVersion = typeof __APP_VERSION__ !== 'undefined'
    ? __APP_VERSION__
    : 'Unknown';

  // Get OS platform from navigator
  const platform = typeof navigator !== 'undefined'
    ? navigator.platform
    : 'Unknown';

  // Get user agent for additional context
  const userAgent = typeof navigator !== 'undefined'
    ? navigator.userAgent
    : 'Unknown';

  const timestamp = new Date().toISOString();

  const report = `
================================================================================
                           HYLE ERROR REPORT
================================================================================

Timestamp: ${timestamp}
App Version: ${appVersion}
Platform: ${platform}
User Agent: ${userAgent}

--------------------------------------------------------------------------------
                              ERROR DETAILS
--------------------------------------------------------------------------------

Error Type: ${sanitizedError.name}
Message: ${sanitizedError.message}

--------------------------------------------------------------------------------
                              STACK TRACE
--------------------------------------------------------------------------------

${sanitizedError.stack}

================================================================================
                            END OF REPORT
================================================================================
`.trim();

  return report;
}

// Declare the global __APP_VERSION__ variable for TypeScript
declare const __APP_VERSION__: string;
