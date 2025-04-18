import Plotly, { Data } from 'plotly.js-dist-min';
export function creatCR(response?: any) {
  if(!response){
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
      values: [response.failed,response.completed,response.absent],
      labels: ['Bukott','Teljesített','Nem teljesített'],
      type: 'pie'
    }];
    const layout = {
      title: {
        text: "Teljesítési arány"
      },
      height: 400,
      width: 500
    };
    Plotly.newPlot('completionRate', data, layout);
  }
}