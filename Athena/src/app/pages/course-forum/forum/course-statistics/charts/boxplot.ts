import Plotly, { Data } from 'plotly.js-dist-min';
export function creatBP(){
    var y0 = [];
    var y1 = [];
    for (var i = 0; i < 50; i ++) {
      y0[i] = Math.random();
      y1[i] = Math.random() + 1;
    }

    var trace1:Data = {
      y: y0,
      type: 'box'
    };

    var trace2:Data = {
      y: y1,
      type: 'box'
    };

    var data = [trace1, trace2];

    Plotly.newPlot('boxplot', data);
  }