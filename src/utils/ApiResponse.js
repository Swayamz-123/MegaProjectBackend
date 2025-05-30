// Custom response class for standardizing API responses
class ApiResponse {
    // Constructor to create standardized API response
    constructor(statusCode , data , message = "success"){
        // Set HTTP status code
        this.statusCode = statusCode
        // Set response data
        this.data= data
        // Set response message with default success message
        this.message= message
        // Set success flag based on status code (true if < 400)
        this.success = statusCode<400
    }
}