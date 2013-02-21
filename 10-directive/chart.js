function transformSerie(serie) {
// close, high, low, open, volumne
var ohlc = []
for (var i=0; i<serie.length; i++) {
  var quote = serie[i];
  quote.Date = String(quote.Date)
  ohlc.push([
    quote.Date.substr(4,2) +"/"+ quote.Date.substr(6,2) +"/"+quote.Date.substr(0,4) + " 16:00:00",  // 20120221 -> 02/21/2012 16:00:00
    quote.open,
    quote.high,
    quote.low,
    quote.close
  ]);
}
return ohlc
}

function createChart(element, serie) {
return $(element).jqplot([serie],{
      seriesDefaults:{yaxis:'y2axis'},
      axes: {
        xaxis: {
          renderer:$.jqplot.DateAxisRenderer,
          tickOptions:{formatString:'%b %e'}, 
        },
        y2axis: {
          tickOptions:{formatString:'$%d'}
        }
      },
      series: [
        {
          renderer:$.jqplot.OHLCRenderer, 
          rendererOptions:{ candleStick:true }
        }
      ],
      highlighter: {
        show: true,
        showMarker:false,
        tooltipAxes: 'xy',
        yvalues: 4,
        formatString:'<table class="jqplot-highlighter"> \
        <tr><td>date:</td><td>%s</td></tr> \
        <tr><td>open:</td><td>%s</td></tr> \
        <tr><td>hi:</td><td>%s</td></tr> \
        <tr><td>low:</td><td>%s</td></tr> \
        <tr><td>close:</td><td>%s</td></tr></table>'
      }
    });  // jqplot
}