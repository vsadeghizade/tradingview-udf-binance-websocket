const env = process.env.NODE_ENV || 'production'
const config = require(__dirname + '/../config/config.json')[env]
const marketType = process.env.MARKET_TYPE || 'futures'

const Redis = require('ioredis')

const {setSymbolData, getSymbolData} = require('../model/redisSymbols')

const {logError} = require('../utils/errorHandler')


class UdfController {

    constructor() {
        this.redis = new Redis(config.redis.port, config.redis.host)
        this.resolutions = ['1', '3', '5', '15', '30', '60', '120', '240', '360', '480', '720', '1D', '3D', '1W', '1M']

        this.loadSymbols()
    }

    loadSymbols() {
        function pricescale(symbol) {
            for (let filter of symbol.filters) {
                if (filter.filterType == 'PRICE_FILTER') {
                    return Math.round(1 / parseFloat(filter.tickSize))
                }
            }
            return 1
        }

        const axios = require('axios')
        const response = axios('https://api.binance.com/api/v1/exchangeInfo').catch(err => {
            logError(err)

            setTimeout(() => {
                this.loadSymbols()
            }, 1000)
        })

        this.symbols = response.then(info => {
            return info.data.symbols.map(symbol => {
                return {
                    symbol: symbol.symbol,
                    ticker: symbol.symbol,
                    name: symbol.symbol,
                    full_name: symbol.symbol,
                    description: `${symbol.baseAsset} / ${symbol.quoteAsset}`,
                    exchange: 'BINANCE',
                    listed_exchange: 'BINANCE',
                    type: 'crypto',
                    currency_code: symbol.quoteAsset,
                    session: '24x7',
                    timezone: 'UTC',
                    minmovement: 1,
                    minmov: 1,
                    minmovement2: 0,
                    minmov2: 0,
                    pricescale: pricescale(symbol),
                    supported_resolutions: this.resolutions,
                    has_intraday: true,
                    has_daily: true,
                    has_weekly_and_monthly: true,
                    data_status: 'streaming'
                }
            })
        })

        this.allSymbols = response.then(info => {
            let set = new Set()
            for (const symbol of info.data.symbols) {
                set.add(symbol.symbol)
            }
            return set
        })
    }

    async checkSymbol(symbol) {
        const symbols = await this.allSymbols
        return symbols.has(symbol)
    }

    /**
     * get symbols data from spot market through websocket connection.
     * @param {object} binance object of node-binance-api-modified-futures library.
     * @param {array} symbols array of name or ticker.
     * @param {array} resolutions array of resolutions.
     */
    async getWebSocketSymbolSpotData(binance, symbols, resolutions) {

        resolutions.forEach(resolution => {

            binance.websockets.chart(symbols, this.resolutionIntervalMap(resolution), (symbol, interval, chart) => {
                let totalKlines = Object.entries(chart)
                if (totalKlines.length > 0) {
                    let ohlc = {
                        s: 'ok',
                        t: totalKlines.map(b => Math.floor(b[0] / 1000)),
                        c: totalKlines.map(b => parseFloat(b[1]['close'])),
                        o: totalKlines.map(b => parseFloat(b[1]['open'])),
                        h: totalKlines.map(b => parseFloat(b[1]['high'])),
                        l: totalKlines.map(b => parseFloat(b[1]['low'])),
                        v: totalKlines.map(b => parseFloat(b[1]['volume']))
                    }

                    setSymbolData(symbol, interval, marketType, ohlc, this.redis)

                }
            }, 1000)
        })

    }

    /**
     * Get symbols data from future market through websocket connection.
     * @param {object} binance object of node-binance-api-modified-futures library.
     * @param {array} symbols array of name or ticker.
     * @param {array} resolutions array of resolutions.
     */
    async getWebSocketSymbolFuturesData(binance, symbols, resolutions) {

        resolutions.forEach(resolution => {

            binance.futuresChart(symbols, this.resolutionIntervalMap(resolution), (symbol, interval, chart) => {
                let totalKlines = Object.entries(chart)
                if (totalKlines.length > 0) {
                    let ohlc = {
                        s: 'ok',
                        t: totalKlines.map(b => Math.floor(b[0] / 1000)),
                        c: totalKlines.map(b => parseFloat(b[1]['close'])),
                        o: totalKlines.map(b => parseFloat(b[1]['open'])),
                        h: totalKlines.map(b => parseFloat(b[1]['high'])),
                        l: totalKlines.map(b => parseFloat(b[1]['low'])),
                        v: totalKlines.map(b => parseFloat(b[1]['volume']))
                    }

                    setSymbolData(symbol, interval, marketType, ohlc, this.redis)
                }
            }, 1000)

        })

    }

    /**
     * Map resolution to interval.
     * @param {string} interval
     * @returns {string} Response an Interval.
     */
    resolutionIntervalMap(interval) {
        let resolutionsToIntervals = {
            '1': '1m',
            '3': '3m',
            '5': '5m',
            '15': '15m',
            '30': '30m',
            '60': '1h',
            '120': '2h',
            '240': '4h',
            '360': '6h',
            '480': '8h',
            '720': '12h',
            '1D': '1d',
            '3D': '3d',
            '1W': '1w',
            '1M': '1M'
        }

        return resolutionsToIntervals[interval]
    }


    /**
     * Data feed configuration data.
     */
    async config() {
        return {
            exchanges: [
                {
                    value: 'BINANCE',
                    name: 'Binance',
                    desc: 'Binance Exchange'
                }
            ],
            symbols_types: [
                {
                    value: 'crypto',
                    name: 'Cryptocurrency'
                }
            ],
            supported_resolutions: this.resolutions,
            supports_search: true,
            supports_group_request: false,
            supports_marks: false,
            supports_timescale_marks: false,
            supports_time: true
        }
    }

    /**
     * Symbols.
     * @returns {object} Response-as-a-table formatted symbols.
     */
    async symbolInfo() {
        const symbols = await this.symbols
        let result = {}
        var keys = Object.keys(symbols[0])
        keys.forEach(key => {
            result[key] = (symbols.map(item => item[key]))
        })

        return  result
    }

    /**
     * Symbol resolve.
     * @param {string} symbol Symbol name or ticker.
     * @returns {object} Symbol.
     */
    async symbol(symbol) {
        const symbols = await this.symbols

        const comps = symbol.split(':')
        const s = (comps.length > 1 ? comps[1] : symbol).toUpperCase()

        let symbolFound= symbols.find(symbol => symbol.symbol === s)

        if (symbolFound) {
            return symbolFound
        }

        throw {statusCode: 404, message: 'Symbol Not Found'}
    }

    /**
     * Symbol search.
     * @param {string} query Text typed by the user in the Symbol Search edit box.
     * @param {string} type One of the symbol types supported by back-end.
     * @param {string} exchange One of the exchanges supported by back-end.
     * @param {number} limit The maximum number of symbols in a response.
     * @returns {array} Array of symbols.
     */
    async search(query, type, exchange, limit) {
        let symbols = await this.symbols
        if (type) {
            symbols = symbols.filter(s => s.type === type)
        }
        if (exchange) {
            symbols = symbols.filter(s => s.exchange === exchange)
        }

        query = query.toUpperCase()
        symbols = symbols.filter(s => s.symbol.indexOf(query) >= 0)

        if (limit) {
            symbols = symbols.slice(0, limit)
        }
        return symbols.map(s => ({
            symbol: s.symbol,
            full_name: s.full_name,
            description: s.description,
            exchange: s.exchange,
            ticker: s.ticker,
            type: s.type
        }))
    }


    /**
     * get history data.
     * @todo this method currently return just 1000 last Klines but in near future we can set (to) and (from) to get certain Klines
     * @param {string} symbol - Symbol name or ticker.
     * @param {string} resolution
     */
    async history(symbol, resolution) {
        const hasSymbol = await this.checkSymbol(symbol)
        if (!hasSymbol) {
            throw {statusCode: 404, message: 'Symbol Not Found'}
        }

        const interval = this.resolutionIntervalMap(resolution)
        if (!interval) {
            throw {statusCode: 404, message: 'Invalid Resolution'}
        }

        return getSymbolData(
            symbol,
            interval,
            marketType,
            this.redis
        )
    }

}

module.exports = UdfController
