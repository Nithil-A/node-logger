const fs = require('fs'); // Require file system module.
const path = require('path') ; // Require path module.

// Function to remove circular references.
function removeCircularReferences(obj) {
    // const seen = new WeakSet();
    // return JSON.parse(JSON.stringify(obj, (key, value) => {
    //     if (typeof value === 'object' && value !== null) {
    //         if (seen.has(value)) {
    //             return;
    //         }
    //         seen.add(value);
    //     }
    //     return value;
    // }));
    try {
        if (typeof obj == 'object' && obj.body) {
            return JSON.stringify(obj.body);
        } else if(typeof obj == 'object' && obj.data){
            return JSON.stringify(obj.data);
        }
    } catch (error) {
        console.log("=======================================");
        console.log(error);
    }    
}

// Class contains api logs function.
class APILogger{
    constructor(apiName, subDir = ""){
        // Get the api name or file name. 
        this.apiName = apiName;
        // Set the base directory.
        this.baseDir = this.baseDir = path.join(path.dirname(module.parent.filename), "logs");;
        // Set up the sub directory, if available.
        this.logDir = subDir ? path.join(this.baseDir, subDir) : this.baseDir;
    }
    // Function to listen for the request and response and write logs to file.
    createLogs (request, response, next, logFileName) {
        // Get the request time.
        const requestTime = Date.now();
        let originalSend = response.send;
        let responseData;
        // Override response.send to capture response data.
        response.send = (data)=>{
            responseData = data;
            return originalSend.apply(response, arguments);
        }
        // Add a event Listen for the response.
        response.on('finish', ()=>{
            // Get the response time.
            const responseTime = Date.now();
            console.log(request.body);
            console.log("============= req");
            console.log(responseData);
            // Define the logs data.
            const logsData = {
                url : request.originalUrl,
                requestTime: new Date(requestTime).toISOString(),
                responseTime: new Date(responseTime).toISOString(),
                timeDifference: responseTime - requestTime,
                // requestData: removeCircularReferences(request.body),
                // responseData: removeCircularReferences(responseData),
                status: request.statusCode < 400 ? 'Success' : 'Error'
            };
            this.writeLog(logsData, logFileName, request.statusCode < 400 ? 'Success' : 'Error');
        }) 
        next();
    }
    // Create third party api logs.
    recordApiLogs(options, requestData, responseData, startTime, endTime, logFileName, isSuccess) {
        const logData = {
          url: options.url,
          requestTime: new Date(startTime).toISOString(),
          responseTime: new Date(endTime).toISOString(),
          timeDifference: endTime - startTime,
          requestData: removeCircularReferences(requestData),
            responseData: removeCircularReferences(responseData),
          status: isSuccess ? 'Success' : 'Error'
        };
        this.writeLog(logData, logFileName, isSuccess ? 'Success' : 'Error');
    }
    // Write logs file. 
    writeLog(logData, logFileName, status) {
        try {
            // Check if the folder is exist, if not crate new.
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
            console.log("============= data writing ==========");
            console.log(logData)
            // File path and file name(fileName-Success-Date)
            const logFilePath = path.join(this.logDir, `${logFileName}-${status}-${new Date().toISOString().replace(/:/g, '-')}.txt`);
            // Write the file.
            fs.appendFileSync(logFilePath, logData, 'utf8');
        } catch (error) {
            console.log("***************************************");
            console.log(error);
        }        
    }
}

module.exports = APILogger;