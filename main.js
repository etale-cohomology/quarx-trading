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

function date_parse(stellar_timestamp){
  let date = new Date(stellar_timestamp)
  return date_format(date)
}

// TODO. Currently this function is a quick & dirty hack. Should the date format change ever so slightly, this function would break! FIX THIS.
function datestr_to_secs(datestr){
  let time = datestr.slice(-8)
  let secs = new Date('1970-01-01T' + time + 'Z').getTime() / 1000
  return secs
}

function time_parse(stellar_timestamp){
  let date = new Date(stellar_timestamp)
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

function get_request(url){
  let xhr = new XMLHttpRequest()
  xhr.addEventListener('load', xhr_load)
  xhr.open('GET', url)
  xhr.send()
}

// Get the parameters from the URL!
function url_get(param_name){
  let url = new URL(window.location.href)
  let search_params = new URLSearchParams(url.search)
  return search_params.get(param_name)
}


// ---------------------------------------------------------------------------------------------------
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

// Filter an array and return the values!
function filter_binary_values(array, min, max){
  let up      = -1
  let down    = array.length
  let mid     = Math.floor(array.length / 2)
  let result  = []

  while(up++ < mid && down-- > mid){
    if(array[down] < min || array[up] > max)  break
    if(array[up] >= min)                      result.push(array[up])
    if(array[down] < max)                     result.push(array[down])
  }

  return result
}


// ---------------------------------------------------------------------------------------------------
let HORIZON = new StellarSdk.Server('https://horizon.stellar.org')


// ---------------------------------------------------------------------------------------------------
let N_BIDS = 20
let N_ASKS = 20
let N_TRADES = 60

function orderbook_get(asset0, asset1){
  HORIZON.orderbook(asset0, asset1).limit(N_BIDS).stream({onmessage: orderbook_stream})  // .limit() doesn't work!
  HORIZON.ledgers().order('desc').limit(1).call().then(ledgers_callback2).catch(error_show)
}

function orderbook_stream(response){
  let bids = response.bids.slice(0, N_BIDS)
  let asks = response.asks.slice(0, N_ASKS)
  let spread_absolute = asks[0].price - bids[0].price
  let spread_relative = 2 * spread_absolute / (parseFloat(asks[0].price) + parseFloat(bids[0].price))

  let date = new Date(Date.now())
  doc.querySelector('#spread_absolute').innerText = `${spread_absolute.toFixed(7)}`
  doc.querySelector('#spread_relative').innerText = `${spread_relative.toFixed(7)}`

  bids_make(bids)
  asks_make(asks)
}

function limit_order_get(limit_order){
  return [limit_order.price, limit_order.amount]
}

function bids_make(bids){
  let bids_table = doc.querySelector('#bids_table')
  let bids_html = ''
  for(let bid of bids.reverse())
    bids_html += `<tr><td>${bid.amount}</td><td class='mdl-color-text--green'>${bid.price}</td></tr>`

  bids_table.tBodies[0].innerHTML = bids_html
}

function asks_make(asks){
  let asks_table = doc.querySelector('#asks_table')
  let asks_html = ''
  for(let ask of asks)
    asks_html += `<tr><td>${ask.amount}</td><td class='mdl-color-text--red'>${ask.price}</td></tr>`

  asks_table.tBodies[0].innerHTML = asks_html
}

function ledgers_callback2(response){
  let last_cursor = response.records[0].paging_token
  HORIZON.ledgers().cursor(last_cursor).order('asc').limit(1).stream({onmessage: ledger_stream2})
  doc.querySelector('#ledger_sequence').innerText = `Ledger ${response.records[0].sequence}`
}

function ledger_stream2(response){
  doc.querySelector('#orderbook_date').innerText = `Orderbook updated ${time_parse(response.closed_at)}`
  doc.querySelector('#ledger_sequence').innerText = `Ledger ${response.sequence}`
}


// ---------------------------------------------------------------------------------------------------
function trades_get(asset0, asset1){
  HORIZON.orderbook(asset0, asset1).trades().order('desc').limit(1).call().then(trades_callback0)
}

function trades_callback0(response){
  let last_cursor = response.records[0].paging_token
  HORIZON.orderbook(asset0, asset1).trades().cursor(last_cursor).order('desc').limit(200).call().then(trades_callback1)
  // let trade_eventsource = HORIZON.orderbook(asset0, asset1).trades().stream({onmessage: trade_stream}) // Doesn't work!
}

function trades_callback1(response){
  let trades = response.records
  let trades_table = doc.querySelector('#trades_table')
  let trades_tbody_html = ''      

  for(let i=0; i < N_TRADES; ++i){
    let date = time_parse(trades[i].created_at)
    let price = (trades[i].bought_amount / trades[i].sold_amount).toFixed(7)
    let volume = trades[i].bought_amount

    let price_prev = (trades[i+1].bought_amount / trades[i+1].sold_amount).toFixed(7)
    let price_style = price >= price_prev ? 'mdl-color-text--green' : 'mdl-color-text--red'

    trades_tbody_html += `<tr><td>${volume}</td><td class='${price_style}'>${price}</td><td>${date}</td></tr>`
  }

  trades_table.tBodies[0].innerHTML = trades_tbody_html
  // created_at bought_amount bought_asset_code bought_asset_issuer bought_asset_type sold_amount sold_asset_code sold_asset_issuer sold_asset_type

  candlestick_integral(trades)  // Compute the candlestick-integral of a (long) sequence of trades!
}


// Compute the candlestick-integral of a (long) sequence of trades!
function candlestick_integral(trades){
  trades.reverse()  // Now trades are in ASCENDING order! =D

  // for(let trade of trades){
  //   trade = trade_get(trade)
  //   let date = trade.date
  //   let price = trade.price
  //   let volume = trade.volume
  //   // print(trade)
  //   // print(time_parse(trade.created_at), (trade.bought_amount / trade.sold_amount).toFixed(7), trade.bought_amount, trade.bought_asset_type, trade.bought_asset_code, trade.sold_amount, trade.sold_asset_type, trade.sold_asset_code)
  // }

  let dates = []
  for(let trade of trades)
    dates.push(date2secs(trade.created_at))
  // print(dates)

  let first_date = dates[0]
  let last_date = dates[dates.length - 1]
  let INTERVAL = 1 * 5 * 60  // In seconds!
  let n_intervals = Math.ceil((last_date - first_date) / INTERVAL)
  // print(n_intervals, dates)

  let indices_master = []  // A 2-array!
  for(let i=0; i < n_intervals; ++i){
    let indices = filter_binary_indices(dates, first_date + i * INTERVAL, first_date + (i+1) * INTERVAL)
    indices_master.push(indices)
    // print('endpoints', first_date + i * INTERVAL, first_date + (i+1) * INTERVAL)
    // print(indices)
  }

  let CANDLESTICKS = []  // date, open, high, low, close, volume

  // ------- First pass over `CANDLESTICKS`!
  for(let indices of indices_master){

    let candlestick = []
    for(let index of indices){
      let trade = trade_get(trades[index])
      candlestick.push(trade)
    }

    candlestick = trade_integral(candlestick)  // Compute a single candlestick from a bunch of trades!
    CANDLESTICKS.push(candlestick)
  }

  // ------- Second pass over `CANDLESTICKS`!
  for(let i=0; i < CANDLESTICKS.length; ++i){
    if(CANDLESTICKS[i].date == -1){
      CANDLESTICKS[i].date = new Date(1000 * (date2secs(CANDLESTICKS[i-1].date) + INTERVAL))
      CANDLESTICKS[i].open = CANDLESTICKS[i-1].close
      CANDLESTICKS[i].high = CANDLESTICKS[i-1].close
      CANDLESTICKS[i].low  = CANDLESTICKS[i-1].close
      CANDLESTICKS[i].close = CANDLESTICKS[i-1].close
      CANDLESTICKS[i].volume = 0
    }
  }

  // print(CANDLESTICKS)
  // for(let candlestick of CANDLESTICKS)
  //   print(`${candlestick.date.toISOString()}, ${candlestick.open}, ${candlestick.high}, ${candlestick.low}, ${candlestick.close}, ${candlestick.volume}`)

  // ---------------------
  charts_draw(CANDLESTICKS)
}

function trade_get(trade){
  let date = new Date(trade.created_at)
  let price = trade.bought_amount / trade.sold_amount
  let volume = parseFloat(trade.bought_amount)
  return {date:date, price:price, volume:volume}
}

// Compute a single candlestick from a (short) sequence of trades!
function trade_integral(trades){
  // print(trades)
  if(trades.length == 0)  return {date:-1, open:-1, high:-1, low:-1, close:-1, volume:-1}

  let date    = trades[trades.length-1].date
  let open    = trades[0].price
  let close   = trades[trades.length-1].price

  let high    = 0
  let low     = Infinity
  let volume  = 0
  for(let trade of trades){
    high = Math.max(trade.price, high)
    low = Math.min(trade.price, low)
    volume += trade.volume
  }

  return {date:date, open:open, high:high, low:low, close:close, volume:volume}
}


// ---------------------------------------------------------------------------------------------------
function exchange_title(asset0_code, asset1_code){
  doc.querySelector('#exchange').innerText = `Exchange ${asset0_code}/${asset1_code}`
}

function bidask_title(asset0_code, asset1_code){
  doc.querySelector('#bids_title').innerText = `Bids (${asset1_code})`
  doc.querySelector('#asks_title').innerText = `Asks (${asset1_code})`
}

function market_components(market){
  let table = doc.querySelector('#market_components_table')
  let tbody_html = ''
  for(let component of market)
    tbody_html += `<tr><td>${component}</td></tr>`
  table.tBodies[0].innerHTML = tbody_html
}




// ---------------------------------------------------------------------------------------------------
function charts_draw(candlesticks){
  let chart_width = doc.querySelector('#chart0').clientWidth
  candlestick_draw('chart0', candlesticks, 'Price', 'data1', chart_width, 480)
  rsi_draw('chart1', candlesticks, chart_width, 240)
  stochastic_draw('chart2', candlesticks, chart_width, 240)
  williams_draw('chart3', candlesticks, chart_width, 240)

}

// chart0
function candlestick_draw(div_id, candlesticks, name, ticker, width_box, height_box){
  let margin = {top: 16, right: 88, bottom: 24, left: 56}
  let width = width_box - margin.left - margin.right
  let height = height_box - margin.top - margin.bottom
  let volumeHeight = height_box * .25

  let parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')  // d3.isoFormat  // d3.timeParse('%d-%b-%y')
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

  function reset(){
    zoom.scale(1)
    zoom.translate([0, 0])
    draw()
  }

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

    // We know the data does not change, a simple refresh that does not perform data joins will suffice.
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

  d3.csv('data1.csv', function(error, data){
    var accessor = rsi.accessor()

    data = candlesticks

    svg.append('g').attr('class', 'rsi')
    svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')')
    svg.append('g').attr('class', 'y axis').append('text').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').text('RSI')

    draw(data)  // Data to display initially
    // d3.select('button').on('click', function(){ draw(data) }).style('display', 'inline')  // Only want this button to be active if the data has loaded
  })

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
  d3.select('button').on('click', function(){ draw(data) }).style('display', 'inline')  // Only want this button to be active if the data has loaded

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