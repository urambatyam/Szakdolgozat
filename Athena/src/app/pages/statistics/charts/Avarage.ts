import Plotly, { Data, Layout } from 'plotly.js-dist-min';

export function createA(){
    const trace1 = {
        x: [1, 2, 3, 4],
        y: [10, 15, 13, 17],
        type: 'scatter'
      };
      
      const data = [trace1];

      Plotly.newPlot('avarage', data as Data[]);
      
}