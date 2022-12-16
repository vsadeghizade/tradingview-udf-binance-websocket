# TradingView Charting Library UDF Data Source
![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)

This is a sample code to implement UDF-compatible data source from [Binance exchange](https://www.binance.com/) for [TradingView Charting Library](https://www.tradingview.com/) by using [node-binance-api](https://www.npmjs.com/package/node-binance-api-modified-futures) library and Redis data store to increase response speed.

### Built With

* Node.js
* Express.js
* Redis

### Packages Used
* node-binance-api-modified-futures - The project to interact with the [Binance API](https://github.com/binance-exchange/binance-official-api-docs)
* Express-validator - Validator and sanitizer functions
* Promise - Handle the result of an asynchronous task
* ioredis - A fast, open source, in-memory, key-value data store.
* Apidoc - API documantation

## Prerequisite
* Node & npm
* Redis

## Installation
```sh
npm install
```

## Setup Redis
```sh
You should set your Redis configration in (/config/config.json)
```

## Run
```sh
npm start

```
Default port is 3000.

## Test

In browser open:
[http://localhost:3000/symbols?symbol=BTCUSDT](http://localhost:3000/symbols?symbol=BTCUSDT)

## Test with Chart Library

Take library from TradingView repo.
Open index.html and find new TradingView.widget({}) and setup config:

Set `symbol` to `BTCUSDT`
Set `datafeed` to `new Datafeeds.UDFCompatibleDatafeed('http://localhost:3000')`

## Contributing

All contributions welcome.

## Credits

- [Vahid Sadeghizadeh](https://github.com/vsadeghizade)
- All Contributors

## License

The MIT License (MIT)

## Links

- [Binance REST API](https://github.com/binance-exchange/binance-official-api-docs)
- [TradingView Charting Library](https://www.tradingview.com/HTML5-stock-forex-bitcoin-charting-library/)
- [TradingView Charting Library Demo](https://charting-library.tradingview.com/)
- [TradingView GitHub](https://github.com/tradingview)
