// ------------------------------------------------------------------------------------------------
let doc = document
let print = console.log

function type(x){
  return typeof(x)
}

function error_show(error){
  print('ERROR!', error)
  return null
}

function undefined2na(object){
  return typeof(object) === 'undefined' ? 'NA' : object
}

function undefined_to_NA(object){
  return typeof(object) === 'undefined' ? 'NA' : object
}

// ----------------------------------------------------------------------
const average = (array) => array.reduce((a, b) => a + b) / array.length;


// ---------------------
Array.prototype.contains = function(v){
  for(var i = 0; i < this.length; i++)
    if(this[i] === v) return true
  return false
}

Array.prototype.unique = function(){
  var arr = []
  for(var i = 0; i < this.length; i++)
    if(!arr.contains(this[i]))  arr.push(this[i])
  return arr
}

function round(number, precision){    
  return +(Math.round(number + 'e+' + precision)  + 'e-' + precision)
}

// ----------------------------------------------------------------------
function rand(min=0, max=1){
  return Math.random() * (max - min) + min;
}

function rand_int(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function rand_str(nchars){
  let str = ''
  let ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  for(let i = 0; i < nchars; ++i)
    str += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length))
  return str
}

// ----------------------------------------------------------------------
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad_zero2(number){
  return number.toLocaleString('en', {minimumIntegerDigits:2})
}

function date_format(date){
  return `${date.getFullYear()} ${MONTHS[date.getMonth()]} ${pad_zero2(date.getDate())} ${pad_zero2(date.getHours())}:${pad_zero2(date.getMinutes())}:${pad_zero2(date.getSeconds())}`
}

function date_format2(date){
  return `${MONTHS[date.getMonth()]} ${pad_zero2(date.getDate())} ${pad_zero2(date.getHours())}:${pad_zero2(date.getMinutes())}:${pad_zero2(date.getSeconds())}`
}

function date_parse(timestamp_iso8601){
  let date = new Date(timestamp_iso8601)
  return date_format(date)
}

function date_parse2(timestamp_iso8601){
  let date = new Date(timestamp_iso8601)
  return date_format2(date)
}

// TODO. Currently this function is a quick & dirty hack. Should the date format change ever so slightly, this function would break! FIX THIS.
function datestr_to_secs(datestr){
  let time = datestr.slice(-8)
  let secs = new Date('1970-01-01T' + time + 'Z').getTime() / 1000
  return secs
}

function time_parse(timestamp_iso8601){
  let date = new Date(timestamp_iso8601)
  return `${pad_zero2(date.getHours())}:${pad_zero2(date.getMinutes())}:${pad_zero2(date.getSeconds())}`
}

function date2secs(date){
  return new Date(date).getTime() / 1000
}


// ----------------------------------------------------------------------
function date_show(){
  doc.querySelector('#clock0').innerText = date_format2(new Date())
  setTimeout(date_show, 1000)  // Recursion!
}



// ----------------------------------------------------------------------
function xhr_load(event){
  let response = JSON.parse(this.response)
  print(response._embedded.records)
}

function get_request(url, callback){
  let xhr = new XMLHttpRequest()
  xhr.addEventListener('load', callback ? callback : xhr_load)
  xhr.open('GET', url)
  xhr.send()
}

// Get the parameters from the URL!
function url_param_get(param_name){
  let url = new URL(window.location.href)
  let search_params = new URLSearchParams(url.search)
  return search_params.get(param_name)
}


// ----------------------------------------------------------------------
// Filter an array and return the indices!
function filter_binary_indices(array, min, max){
  let up      = -1
  let down    = array.length
  let mid     = Math.floor(array.length / 2)
  let result  = []

  while(up++ < mid && down-- > mid){
    if(array[down] < min || array[up] > max)  break
    if(array[up] >= min)                      result.push(up)
    if(array[down] < max)                     result.push(down)
  }

  return result
}

// ----------------------------------------------------------------------
function array_find(element){
  return !(element === undefined)
}


// ------------------------------------------------------------------------------------------------
// Return a value that goes into `asset_code`!
function native2xlm(asset_code, asset_type){
  return undefined2na(asset_type == 'native' ? 'XLM' : asset_code)
}

// Return a value that goes into `asset_type`!
function xlm2native(asset_type, asset_code){
  return undefined2na(asset_code == 'XLM' ? 'native' : asset_type)
}



function asset_code_stellar_parse(asset_code, asset_type){
  if(asset_code == 'XLM' || asset_type == 'native')
    return undefined
  else
    return asset_code
}

function asset_type_stellar_parse(asset_type, asset_code){
  if(asset_type == 'native' || asset_code == 'XLM')
    return 'native'
  else
    return 'credit_alphanum4'
}

function asset_issuer_stellar_parse(asset_issuer, asset_code, asset_type){
  if(asset_code == 'XLM' || asset_type == 'native')
    return undefined
  else
    return asset_issuer
}



// A straightforward switcheroo!
function native2xlm_direct(string){
  return string == 'native' ? 'XLM' : string
}

// A straightforward switcheroo!
function xlm2native_direct(string){
  return string == 'XLM' ? 'native' : string
}




// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
let HORIZON_URL = 'https://horizon.stellar.org'
let HORIZON = new StellarSdk.Server(HORIZON_URL)


// ---------------------------------------------------------------------------------------------------
let N_BIDS = 24
let N_ASKS = 24
let N_TRADES = 64
let CANDLESTICK_RESOLUTION = 1 * 1 * 60 * 1000  // hours * minutes * seconds * milliseconds

let TRADES


// ---------------------------------------------------------------------------------------------------
function orderbook_get(counter_asset, base_asset){
  // print(arguments.callee.name, counter_asset, base_asset)
  HORIZON.orderbook(base_asset, counter_asset).limit(N_BIDS).stream({onmessage: orderbook_stream})  // .limit() doesn't work!
  HORIZON.ledgers().order('desc').limit(1).call().then(ledgers_callback).catch(error_show)
}

function orderbook_stream(response){
  // print('bids', response.bids)
  // print('asks', response.asks)
  let bids = response.bids.slice(0, N_BIDS)
  let asks = response.asks.slice(0, N_ASKS)
  bids_table_make(bids)
  asks_table_make(asks)

  if(response.bids.length == 0 || response.asks.length == 0)  return
  let spread_absolute = asks[0].price - bids[bids.length-1].price
  let spread_relative = 2 * spread_absolute / (parseFloat(asks[0].price) + parseFloat(bids[0].price))

  let date = new Date(Date.now())
  doc.querySelector('#bid_card_title').innerText = `Bid (${native2xlm_direct(url_param_get('counter_asset_code'))})`
  doc.querySelector('#bid_card_value').innerText = `${bids[0].price}`

  doc.querySelector('#ask_card_title').innerText = `Ask (${native2xlm_direct(url_param_get('counter_asset_code'))})`
  doc.querySelector('#ask_card_value').innerText = `${asks[asks.length-1].price}`

  doc.querySelector('#last_card_title').innerText = `Last (${native2xlm_direct(url_param_get('counter_asset_code'))})`
  // doc.querySelector('#last_card_value').innerText = `${price}`

  doc.querySelector('#spread_absolute_card_title').innerText = `Spread (${native2xlm_direct(url_param_get('counter_asset_code'))})`
  doc.querySelector('#spread_absolute_card_value').innerText = `${spread_absolute.toFixed(7)}`
}

function bids_table_make(bids){
  if(bids.length == 0)  return
  let bids_table = doc.querySelector('#bids_table')
  let bids_html = ''

  bids[0].amount_integral = parseFloat(bids[0].amount)  // Market size integral: base step!
  for(let i=1; i<bids.length; ++i)  // Market size integral: inductive step!
    bids[i].amount_integral = bids[i-1].amount_integral + parseFloat(bids[i].amount)

  for(let bid of bids){
    bid.market_depth = 1 - bid.amount_integral / bids[bids.length-1].amount_integral
    let style = `style='background:linear-gradient(to left, #222 ${100 * bid.market_depth}%, #93cf96 ${100 * bid.market_depth}%);'`
    bids_html += `<tr ${style}><td>${bid.amount_integral.toFixed(7)}</td><td>${bid.amount}</td><td class='mdl-color-text--green-800'>${bid.price}</td></tr>`
  }

  bids_table.tBodies[0].innerHTML = bids_html
}

function asks_table_make(asks){
  if(asks.length == 0)  return
  let asks_table = doc.querySelector('#asks_table')
  let asks_html = ''

  asks[0].amount_integral = parseFloat(asks[0].amount)  // Market size integral: base step
  for(let i=1; i<asks.length; ++i)  // Market size integral: recursive step!
    asks[i].amount_integral = asks[i-1].amount_integral + parseFloat(asks[i].amount)

  for(let ask of asks.reverse()){
    ask.market_depth = 1 - ask.amount_integral / asks[0].amount_integral
    let style = `style='background:linear-gradient(to left, #222 ${100 * ask.market_depth}%, #f88e86 ${100 * ask.market_depth}%);'`
    asks_html += `<tr ${style}><td>${ask.amount_integral.toFixed(7)}</td><td>${ask.amount}</td><td class='mdl-color-text--red-800'>${ask.price}</td></tr>`
  }

  asks_table.tBodies[0].innerHTML = asks_html
}

function ledgers_callback(response){
  HORIZON.ledgers().cursor('now').stream({onmessage: ledgers_stream})
  doc.querySelector('#ledger_sequence').innerText = `Ledger ${response.records[0].sequence}`
}

function ledgers_stream(response){
  doc.querySelector('#orderbook_date').innerText = `Orderbook updated ${time_parse(response.closed_at)}`
  doc.querySelector('#ledger_sequence').innerText = `Ledger ${response.sequence}`
}


// ---------------------------------------------------------------------------------------------------
function trades_get(counter_asset, base_asset){
  spinner_enable('spinner_charts')
  // let trade_eventsource = HORIZON.orderbook(counter_asset, base_asset).trades().stream({onmessage: function(){ print('stream!') }}) // Doesn't work!

  TRADES = []  // Reset global TRADES!

  // https://horizon.stellar.org/trade_aggregations?base_asset_type=native&counter_asset_code=CNY&counter_asset_type=credit_alphanum4&counter_asset_issuer=GAREELUB43IRHWEASCFBLKHURCGMHE5IF6XSE7EXDLACYHGRHM43RFOX&resolution=300000&limit=200&order=desc
  get_request(`${HORIZON_URL}/trade_aggregations?base_asset_type=${asset_type_stellar_parse(base_asset.type, base_asset.code)}&base_asset_code=${asset_code_stellar_parse(base_asset.code, base_asset.type)}&base_asset_issuer=${asset_issuer_stellar_parse(base_asset.issuer, base_asset.code, base_asset.type)}&counter_asset_code=${asset_code_stellar_parse(counter_asset.code, counter_asset.type)}&counter_asset_type=${asset_type_stellar_parse(counter_asset.type, counter_asset.code)}&counter_asset_issuer=${asset_issuer_stellar_parse(counter_asset.issuer, counter_asset.code, counter_asset.type)}&resolution=${CANDLESTICK_RESOLUTION}&limit=200&order=desc`, candlesticks_build)  // &start_timestamp=1512742740000&end_timestamp=1510743700000

  // https://horizon.stellar.org/trades?base_asset_type=native&counter_asset_type=credit_alphanum4&counter_asset_code=CNY&counter_asset_issuer=GAREELUB43IRHWEASCFBLKHURCGMHE5IF6XSE7EXDLACYHGRHM43RFOX
  print(`${HORIZON_URL}/trades?counter_asset_code=${asset_code_stellar_parse(counter_asset.code, counter_asset.type)}&counter_asset_type=${asset_type_stellar_parse(counter_asset.type, counter_asset.code)}&counter_asset_issuer=${asset_issuer_stellar_parse(counter_asset.issuer, counter_asset.code, counter_asset.type)}&base_asset_code=${asset_code_stellar_parse(base_asset.code, base_asset.type)}&base_asset_type=${asset_type_stellar_parse(base_asset.type, base_asset.code)}&base_asset_issuer=${asset_issuer_stellar_parse(base_asset.issuer, base_asset.code, base_asset.type)}&order=desc&limit=${N_TRADES}`)
  get_request(`${HORIZON_URL}/trades?counter_asset_code=${asset_code_stellar_parse(counter_asset.code, counter_asset.type)}&counter_asset_type=${asset_type_stellar_parse(counter_asset.type, counter_asset.code)}&counter_asset_issuer=${asset_issuer_stellar_parse(counter_asset.issuer, counter_asset.code, counter_asset.type)}&base_asset_code=${asset_code_stellar_parse(base_asset.code, base_asset.type)}&base_asset_type=${asset_type_stellar_parse(base_asset.type, base_asset.code)}&base_asset_issuer=${asset_issuer_stellar_parse(base_asset.issuer, base_asset.code, base_asset.type)}&order=desc&limit=${N_TRADES}`, trades_table_build)

  // HORIZON.orderbook(base_asset, counter_asset).trades().order('desc').limit(200).call()
    // .then(trades_collect)  // It works!
    // .then(trades_collect)  // It works!
    // .then(trades_table_build)  // It works!
}

function trades_collect(response){
  Array.prototype.push.apply(TRADES, response.records)

  let last_cursor = response.records[response.records.length - 1].paging_token
  return HORIZON.orderbook(base_asset, counter_asset).trades().cursor(last_cursor).order('desc').limit(200).call()
}

function trades_table_build(response){
  response = JSON.parse(this.response)
  let TRADES = response._embedded ? response._embedded.records : []
  print('TRADES', TRADES.length, TRADES)

  // for(let trade of TRADES)  print(date_parse2(trade.ledger_close_time), trade.counter_amount / trade.base_amount, trade.counter_asset_code, trade.counter_asset_type, trade.counter_asset_issuer, trade.counter_amount, trade.base_asset_code, trade.base_asset_type, trade.base_asset_issuer, trade.base_amount)
  // ledger_close_time counter_amount base_asset_code base_asset_type base_asset_issuer base_amount counter_asset_code counter_asset_type counter_asset_issuer

  let trades_table = doc.querySelector('#trades_table')
  let trades_tbody_html = ''

  for(let i=0; i < Math.min(N_TRADES, TRADES.length - 1); i++){
    let volume = TRADES[i].counter_amount
    let price = (TRADES[i].counter_amount / TRADES[i].base_amount).toFixed(7)
    let date = date_parse2(TRADES[i].ledger_close_time)
    // print(i, volume, price, date)

    let price_prev = (TRADES[i+1].counter_amount / TRADES[i+1].base_amount).toFixed(7)
    let price_style = price >= price_prev ? 'mdl-color-text--green' : 'mdl-color-text--red'

    let href = `${HORIZON_URL}/order_book/trades?base_asset_type=${TRADES[i+1].sold_asset_type}&base_asset_code=${TRADES[i+1].sold_asset_code}&base_asset_issuer=${TRADES[i+1].sold_asset_issuer}&counter_asset_type=${TRADES[i+1].base_asset_type}&counter_asset_code=${TRADES[i+1].base_asset_code}&counter_asset_issuer=${TRADES[i+1].base_asset_issuer}&cursor=${TRADES[i+1].id}&limit=1`
    trades_tbody_html += `<tr><td><a href='${href}' class='monospace'>${volume}</a></td><td class='${price_style}'><a href='${href}' class='monospace'>${price}</a></td><td><a href='${href}' class='monospace'>${date}</a></td></tr>`
  }

  doc.querySelector('#last_card_value').innerText = `${(TRADES[0].counter_amount / TRADES[0].base_amount).toFixed(7)}`

  trades_table.tBodies[0].innerHTML = trades_tbody_html

  spinner_disable('spinner_charts')
}

function candlesticks_build(response){
  response = JSON.parse(this.response)
  let CANDLESTICKS = response._embedded ? response._embedded.records : []

  let candlesticks = []
  for(let i=0; i<CANDLESTICKS.length; ++i){
    let candle = CANDLESTICKS[i]
    candlesticks[i] = {date:new Date(candle.timestamp), open:parseFloat(candle.open), high:parseFloat(candle.high), low:parseFloat(candle.low), close:parseFloat(candle.close), volume:parseFloat(candle.counter_volume)}
  }

  // for(let candle of candlesticks)  print(`${candle.date}, ${candle.open}, ${candle.high}, ${candle.low}, ${candle.close}, ${candle.volume}`)
  // print('CANDLESTICKS', CANDLESTICKS.length, CANDLESTICKS)

  // ---------------------
  charts_draw(candlesticks)
}




// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
function charts_draw(candlesticks){
  let chart_width = doc.querySelector('#chart0').clientWidth
  candlestick_draw('chart0', candlesticks, 'Price', chart_width, 480)
  rsi_draw('chart1', candlesticks, chart_width * .95, 240)
  stochastic_draw('chart2', candlesticks, chart_width * .95, 240)
  williams_draw('chart3', candlesticks, chart_width * .95, 240)
}

// chart0
function candlestick_draw(div_id, candlesticks, name, width_box, height_box){
  let margin = {top: 16, right: 88, bottom: 24, left: 56}
  let width = width_box - margin.left - margin.right
  let height = height_box - margin.top - margin.bottom
  let volumeHeight = height_box * .25

  // let parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')  // d3.isoFormat  // d3.timeParse('%d-%b-%y')  // d3.timeFormat('%Q')
  let zoom = d3.zoom().on('zoom', zoomed)

  let x = techan.scale.financetime().range([0, width])
  let y = d3.scaleLinear().range([height, 0])

  let yPercent = y.copy()   // Same as y at this stage, will get a different domain later
  let yVolume = d3.scaleLinear().range([height, height - volumeHeight])

  let yInit, yPercentInit, zoomableInit

  let candlestick = techan.plot.candlestick().xScale(x).yScale(y)
  let sma0 = techan.plot.sma().xScale(x).yScale(y)
  let sma1 = techan.plot.sma().xScale(x).yScale(y)
  let ema2 = techan.plot.ema().xScale(x).yScale(y)
  let volume = techan.plot.volume().accessor(candlestick.accessor()).xScale(x).yScale(yVolume)

  let xAxis = d3.axisBottom(x).ticks(12)
  let yAxis = d3.axisRight(y).ticks(8).tickFormat(d3.format('.7f'))
  let percentAxis = d3.axisLeft(yPercent).ticks(8).tickFormat(d3.format('+.1%'))
  let volumeAxis = d3.axisRight(yVolume).ticks(2).tickFormat(d3.format(',.3s'))

  let svg = d3.select(`#${div_id}`)
              .append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)
              .append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  svg.append('clipPath').attr('id', 'clip').append('rect').attr('x', 0).attr('y', y(1)).attr('width', width).attr('height', y(0) - y(1))
  svg.append('text').attr('class', 'ticker').attr('x', 32).text(name)
  svg.append('g').attr('class', 'volume').attr('clip-path', 'url(#clip)')
  svg.append('g').attr('class', 'candlestick').attr('clip-path', 'url(#clip)')
  svg.append('g').attr('class', 'indicator sma ma-0').attr('clip-path', 'url(#clip)')
  svg.append('g').attr('class', 'indicator sma ma-1').attr('clip-path', 'url(#clip)')
  svg.append('g').attr('class', 'indicator ema ma-2').attr('clip-path', 'url(#clip)')
  svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')')
  svg.append('g').attr('class', 'y axis').attr('transform', 'translate(' + width + ',0)')
  svg.append('g').attr('class', 'percent axis')
  svg.append('g').attr('class', 'volume axis')
  svg.append('rect').attr('class', 'pane').attr('width', width).attr('height', height).call(zoom)

  let accessor = candlestick.accessor()

  data = candlesticks

  x.domain(techan.scale.plot.time(data, accessor).domain())
  y.domain(techan.scale.plot.ohlc(data, accessor).domain())
  yPercent.domain(techan.scale.plot.percent(y, accessor(data[0])).domain())
  yVolume.domain(techan.scale.plot.volume(data, accessor.v).domain())

  svg.select('g.candlestick').datum(data).call(candlestick)
  svg.select('g.volume').datum(data).call(volume)
  svg.select('g.sma.ma-0').datum(techan.indicator.sma().period(10)(data)).call(sma0)
  svg.select('g.sma.ma-1').datum(techan.indicator.sma().period(20)(data)).call(sma1)
  svg.select('g.ema.ma-2').datum(techan.indicator.ema().period(50)(data)).call(ema2)

  zoomableInit = x.zoomable().domain([0, data.length]).copy()  // Zoom-in in a little!
  yInit = y.copy()
  yPercentInit = yPercent.copy()
  draw()

  // ---------------------
  function zoomed(){
    x.zoomable().domain(d3.event.transform.rescaleX(zoomableInit).domain())
    y.domain(d3.event.transform.rescaleY(yInit).domain())
    yPercent.domain(d3.event.transform.rescaleY(yPercentInit).domain())
    draw()
  }

  function draw(){
    svg.select('g.x.axis').call(xAxis)
    svg.select('g.y.axis').call(yAxis)
    svg.select('g.volume.axis').call(volumeAxis)
    svg.select('g.percent.axis').call(percentAxis)

    // We know the data does not change, so a simple refresh that does not perform data joins will suffice
    svg.select('g.candlestick').call(candlestick.refresh)
    svg.select('g.volume').call(volume.refresh)
    svg.select('g.sma.ma-0').call(sma0.refresh)
    svg.select('g.sma.ma-1').call(sma1.refresh)
    svg.select('g.ema.ma-2').call(ema2.refresh)
  }
}


// ---------------------------------------------------------------------------------------------------
//chart1
function rsi_draw(div_id, candlesticks, width_box, height_box){
  let margin = {top: 20, right: 20, bottom: 30, left: 50}
  let width = width_box - margin.left - margin.right
  let height = height_box - margin.top - margin.bottom
  let parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')  // d3.isoFormat  // d3.timeParse('%d-%b-%y')

  let x = techan.scale.financetime().range([0, width])
  let y = d3.scaleLinear().range([height, 0])
  let rsi = techan.plot.rsi().xScale(x).yScale(y)

  let xAxis = d3.axisBottom(x)
  let yAxis = d3.axisLeft(y).tickFormat(d3.format(',.3s'))

  let svg = d3.select(`#${div_id}`)
              .append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)
              .append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  var accessor = rsi.accessor()

  data = candlesticks

  svg.append('g').attr('class', 'rsi')
  svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')')
  svg.append('g').attr('class', 'y axis').append('text').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').text('RSI')

  draw(data)  // Data to display initially
  // d3.select('button').on('click', functiuuon(){ draw(data) }).style('display', 'inline')  // Only want this button to be active if the data has loaded

  function draw(data){
    var rsiData = techan.indicator.rsi()(data)
    x.domain(rsiData.map(rsi.accessor().d))
    y.domain(techan.scale.plot.rsi(rsiData).domain())

    svg.selectAll('g.rsi').datum(rsiData).call(rsi)
    svg.selectAll('g.x.axis').call(xAxis)
    svg.selectAll('g.y.axis').call(yAxis)
  }
}

// ---------------------------------------------------------------------------------------------------
// chart2
function stochastic_draw(div_id, candlesticks, width_box, height_box){
  let margin = {top: 20, right: 20, bottom: 30, left: 50}
  let width = width_box - margin.left - margin.right
  let height = height_box - margin.top - margin.bottom
  let parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')  // d3.isoFormat  // d3.timeParse('%d-%b-%y')

  var x = techan.scale.financetime().range([0, width])
  var y = d3.scaleLinear().range([height, 0])
  var stochastic = techan.plot.stochastic().xScale(x).yScale(y)
  var xAxis = d3.axisBottom(x)
  var yAxis = d3.axisLeft(y).tickFormat(d3.format(',.3s'))

  var svg = d3.select(`#${div_id}`)
              .append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)
              .append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  var accessor = stochastic.accessor()

  data = candlesticks

  svg.append('g').attr('class', 'stochastic')
  svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')')
  svg.append('g').attr('class', 'y axis')
     .append('text').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').text('Stochastic Oscillator')

  draw(data)  // Data to display initially
  // d3.select('button').on('click', function(){ draw(data) }).style('display', 'inline')  // Only want this button to be active if the data has loaded

  function draw(data){
      var stochasticData = techan.indicator.stochastic()(data)
      x.domain(stochasticData.map(stochastic.accessor().d))
      y.domain(techan.scale.plot.stochastic().domain())

      svg.selectAll('g.stochastic').datum(stochasticData).call(stochastic)
      svg.selectAll('g.x.axis').call(xAxis)
      svg.selectAll('g.y.axis').call(yAxis)
  }
}


// ---------------------------------------------------------------------------------------------------
// chart3
function williams_draw(div_id, candlesticks, width_box, height_box){
  let margin = {top: 20, right: 20, bottom: 30, left: 50}
  let width = width_box - margin.left - margin.right
  let height = height_box - margin.top - margin.bottom
  let parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')  // d3.isoFormat  // d3.timeParse('%d-%b-%y')

  var x = techan.scale.financetime().range([0, width])
  var y = d3.scaleLinear().range([height, 0])
  var williams = techan.plot.williams().xScale(x).yScale(y)
  var xAxis = d3.axisBottom(x)
  var yAxis = d3.axisLeft(y).tickFormat(d3.format(',.3s'))

  var svg = d3.select(`#${div_id}`).append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  var accessor = williams.accessor()

  data = candlesticks

  svg.append('g').attr('class', 'williams')
  svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')')
  svg.append('g').attr('class', 'y axis')
     .append('text').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').text('William %R')

  draw(data)  // Data to display initially
  // d3.select('button').on('click', function(){ draw(data) }).style('display', 'inline')  // Only want this button to be active if the data has loaded

  function draw(data){
      var williamsData = techan.indicator.williams()(data)
      x.domain(williamsData.map(williams.accessor().d))
      y.domain(techan.scale.plot.williams().domain())

      svg.selectAll('g.williams').datum(williamsData).call(williams)
      svg.selectAll('g.x.axis').call(xAxis)
      svg.selectAll('g.y.axis').call(yAxis)
  }
}




// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
function btn_disable(btn_id){
  let btn = doc.querySelector(`#${btn_id}`)
  btn.disabled = true
  btn.classList.add('mdl-button--disabled')
}

function btn_enable(btn_id){
  let btn = doc.querySelector(`#${btn_id}`)
  btn.disabled = false
  btn.classList.remove('mdl-button--disabled')
}

function spinner_disable(spinner_id){
  doc.querySelector(`#${spinner_id}`).classList.remove('is-active')
}

function spinner_enable(spinner_id){
  doc.querySelector(`#${spinner_id}`).classList.add('is-active')
}

function generic_error_snackbar_show(error){
  let snackbar_div = doc.querySelector('#snackbar_error')
  let snackbar_data = {message: error}
  snackbar_div.MaterialSnackbar.showSnackbar(snackbar_data)
  print(error)
}

// Get error message for the snackbar data field!
function snackbar_get_data(error, msg, default_msg){
  let message = default_msg
  if(msg){
    message = msg
  }else if(error.message){
    if(error.message.detail){
      message = error.message.detail
    }
  }
  return {message: message}
}


/*
GAECJVZ55YDSVO7KYNWSTFFTGF4AJ7DJH6O6WTTR33KCA2UBT4KOKBLY SAUI2E4EM7UW6PZ6FWXNRZC7GOTTHQHECXMQFWYVY43XCN7CLGRGEXWG
GDRTRNSP7T33KH3UYXX4I6I42ZVCKVYJ5P2W3KIJCYFK7IPLHOU7HZYJ SCHNDPDUBW44G4BJCGORKR7LJCN77EMZZOFYLRGZUHTABNFP7XOZ5J5M
GAPFRGD6WLIS3INGOFCFQFYZF3ESLXFGYZONZIKVCVBYXIYUEKZZD4CG SB6K6MC6LD3FCZ4VSXGYB2IT7MJACQ4SHVUQ74VWQLMJEAGACI5JOCQU
*/
