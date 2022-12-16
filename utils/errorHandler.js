// errorHandler.js

function logError(err) {
    console.error(err)
}

function logErrorMiddleware(err, req, res, next) {
    logError(err)
    next(err)
}

function returnError(err, req, res, next) {
    res.status(err.statusCode || 500).send(err.message)
}


module.exports = {
    logError,
    logErrorMiddleware,
    returnError,
}
