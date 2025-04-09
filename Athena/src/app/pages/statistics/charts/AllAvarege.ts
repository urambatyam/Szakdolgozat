import Plotly, { Data, Layout } from 'plotly.js-dist-min';

export function createAA(){
  const semesterLabels: string[] = [
    '2022/1',
    '2022/2',
    '2023/1',
    '2023/2',
    '2024/1',
    '2024/2',
    '2025/1',
  ];
  const trace1 = {
    x: [1, 2, 3, 4,5,6,7],
    y: [10, 15, 13, 17,30,14,23],
    type: 'scatter'
  };
    const layout = {
      title: 'Tanulmányi átlag lineáris regressziója',
      xaxis: { 
        title: 'Félév',
        tickmode: 'array',
        tickvals: trace1.x,
        ticktext: semesterLabels
      },
      yaxis: { title: 'Átlag' }
    };
  const data = [trace1];
    
  Plotly.newPlot('allAvarage', data as Data[],layout as Layout);
}

