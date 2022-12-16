const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

const logger = require('morgan')
app.use(logger('dev'))

const apiRouter = require('./routes/api')

const UDFController = require('./utils/udfController')
const udf = new UDFController()
app.udf = udf

const {logErrorMiddleware, returnError} = require('./utils/errorHandler')

app.use(function (req, res, next) {
    res.udf = app.udf
    next()
})

// routes
app.use('/', apiRouter)

// error handlers
app.use(logErrorMiddleware)
app.use(returnError)

module.exports = app
