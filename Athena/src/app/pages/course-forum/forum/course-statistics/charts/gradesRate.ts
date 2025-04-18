import Plotly, { Data } from 'plotly.js-dist-min';
export function createGR(response?: any) {
 if(!response || response.frequency.length === 0){
    const data: Data[] = [{
      values: [],
      labels: [],
      type: 'pie'
    }];
    const layout = {
      title: {
        text: "Nincsenek teljesítési adatok"
      },
      height: 400,
      width: 500
    };
    Plotly.newPlot('completionRate', data, layout);
  }else{
    const data: Data[] = [{
      values: [response.frequency['1'], response.frequency['2'], response.frequency['3'], response.frequency['4'], response.frequency['5']],
      labels: ['1','2','3','4','5'],
      type: 'pie'
    }];
    const layout = {
      title: {
        text: "Jegyek arány"
      },
      height: 400,
      width: 500
    };
    Plotly.newPlot('gradeRate', data, layout);
  }
}