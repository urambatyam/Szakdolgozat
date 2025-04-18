import Plotly, { Data, Layout } from 'plotly.js-dist-min';

export function createLkR(response?:any) {
    const semesterLabels: string[] = [
      '2022/1',
      '2022/2',
      '2023/1',
      '2023/2',
      '2024/1',
      '2024/2',
      '2025/1',
      '2025/2',
      '2026/1',
      '2026/2',
    ];
  
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
    
    // Calculate regression line
    const sum = (arr:any) => arr.reduce((a:number, b:number) => a + b, 0);
    
    const meanX = sum(x) / x.length;
    const meanY = sum(y) / y.length;
    
    const variance = (arr:any, mean:number) => sum(arr.map((value:number) => Math.pow(value - mean, 2))) / arr.length;
    const covariance = (x:number[], y:number[], meanX:number, meanY:number) => 
      sum(x.map((xVal, i) => (xVal - meanX) * (y[i] - meanY))) / x.length;
    
    const slope = covariance(x, y, meanX, meanY) / variance(x, meanX);
    const intercept = meanY - slope * meanX;
    
    const regressionLine = x.map(xVal => slope * xVal + intercept);
    
    // Create Plotly graph
    const layout = {
      title: 'Tanulmányi átlag lineáris regressziója',
      xaxis: { 
        title: 'Félév',
        tickmode: 'array',
        tickvals: x,
        ticktext: semesterLabels
      },
      yaxis: { title: 'Átlag' }
    };
    
    const data:Data[] = [
      {
        x: x,
        y: y,
        mode: 'markers',
        type: 'scatter',
        name: 'Adatok'
      },
      {
        x: x,
        y: regressionLine,
        mode: 'lines',
        type: 'scatter',
        name: 'Regressziós egyenes'
      }
    ];
    
    Plotly.newPlot('linearRegression', data, layout as Layout);
  }