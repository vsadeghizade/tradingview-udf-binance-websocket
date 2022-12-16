const {logError} = require('../utils/errorHandler')

/**
 * Set SymbolData in Redis database.
 * @param {string} symbol - Symbol name or ticker.
 * @param {string} interval .
 * @param {string} marketType Type of market between Futures or Spot.
 * @param {array} ohlc Data array that get from API or websocket.
 * @param {object} redis Redis object library.
 */
async function setSymbolData(symbol, interval, marketType, ohlc, redis) {

    try {
        const key = symbol.toString() + '_' + marketType.toString() + '_' + interval.toString()
        const result = await redis.set(key, JSON.stringify(ohlc))

    } catch (error) {
        logError(error)
    }
}

/**
 * Get SymbolData from Redis database.
 * @param {string} symbol - Symbol name or ticker.
 * @param {string} interval .
 * @param {string} marketType Type of market between Futures or Spot.
 * @param {object} redis Redis object library.
 * @returns {array} ohlc Data array that get from API or websocket
 */
async function getSymbolData(symbol, interval, marketType, redis) {

    try {
        const key = symbol.toString() + '_' + marketType.toString() + '_' + interval.toString()
        const ohlc = JSON.parse(await redis.get(key))
        return ohlc

    } catch (error) {
        logError(error)
    }
}


module.exports = {setSymbolData, getSymbolData}
