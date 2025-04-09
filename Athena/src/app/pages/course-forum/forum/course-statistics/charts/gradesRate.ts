import Plotly, { Data } from 'plotly.js-dist-min';
export function createGR() {
    const data: Data[] = [{
      values: [7, 5, 9, 4, 3],
      labels: ['1','2','3','4','5'],
      type: 'pie'
    }];
    
    const layout = {
      height: 400,
      width: 500
    };
    Plotly.newPlot('gradeRate', data, layout);
}