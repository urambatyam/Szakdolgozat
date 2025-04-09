import Plotly, { Data } from 'plotly.js-dist-min';
export function creatCR() {
    const data: Data[] = [{
      values: [7, 5, 9],
      labels: ['Nem teljesített','Bukott','Teljesített',],
      type: 'pie'
    }];
    const layout = {
      height: 400,
      width: 500
    };
    Plotly.newPlot('completionRate', data, layout);
}