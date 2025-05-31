// Custom error class that extends the built-in Error class
class ApiError extends Error {
    // Constructor to initialize error with custom properties
    constructor (
        statusCode , // HTTP status code for the error
        message = "something went wrong", // Error message with default value
        errors = [], // Array to store multiple error details
        stack = null // Stack trace information (set to null by default to allow capturing actual trace)
    ){
        // Call parent Error constructor with message
        super(message)

        // Set HTTP status code for the error
        this.statusCode = statusCode

        // Set data property to null (no data in error response)
        this.data = null

        // Set error message
        this.message = message

        // Set success flag to false for error responses
        this.success = false

        // Set array of error details
        this.errors = errors

        // Handle stack trace - use provided stack or capture current stack
        if (stack) {
            // Use provided stack trace
            this.stack = stack
        } else {
            // Capture current stack trace if none provided
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

// Export the ApiError class
export { ApiError }
