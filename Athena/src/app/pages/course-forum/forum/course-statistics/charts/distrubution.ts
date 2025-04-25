import Plotly, { PlotData, Layout, Data } from 'plotly.js-dist-min';
import { NOdatalayout,DistributionResponse } from './common';

/**
 * A kurzus adati alapján létrehoz egyoszlop diagramot ami a jegyek gyakorisgát mutja,
 * Erre rárajzolja a jegyek normál elsozlás görbéjét,
 * és rárajtolja a jegyek ideális normál eloszlásának görbéjét 1 szorásal, és 3-as mediánval/átlag/várhatóérték
 * 
 * @param targetElement A div HTML refenciája, amibe belerajtolja a diagramot
 * @param response any A szervertől kapot válasz.
 * @returns void
 */
export function creatD(targetElement: HTMLDivElement, response?: DistributionResponse) {
  let layout: Partial<Layout>;
  let data: Partial<PlotData>[] = [];
  if (!response || !response.frequency || Object.keys(response.frequency).length === 0 || response.totalCount <= 0) {
    layout = NOdatalayout as Partial<Layout>; 
    data = [];  
  }else{
    const gradeKeys = Object.keys(response.frequency); 
    const sortedGradeKeys = gradeKeys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)); 
    const grades: number[] = sortedGradeKeys.map(key => parseInt(key, 10)); 
    const counts: number[] = sortedGradeKeys.map(key => response.frequency[key]); 
    const mean = response.mean;
    const stdDev = response.std; 
    const totalCount = response.totalCount;
    const normalDistributionX: number[] = [];
    const normalDistributionData: number[] = [];
    const fixedMu = 3; 
    const fixedSigma = 1; 
    const idealNormalX: number[] = [];
    const idealNormalData: number[] = [];
    const step = 0.1;
    const minX = 0; 
    const maxX = 6; 
    for (let x = minX; x <= maxX; x += step) {
        normalDistributionX.push(x);
        idealNormalX.push(x);
        let y1 = 0;
        if (stdDev > 0) {
            y1 = (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
                 Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        }
        const scaledY1 = y1 * totalCount * 1; 
        normalDistributionData.push(scaledY1);
        const y2 = (1 / (fixedSigma * Math.sqrt(2 * Math.PI))) *
                   Math.exp(-0.5 * Math.pow((x - fixedMu) / fixedSigma, 2));
        const scaledY2 = y2 * totalCount * 1; 
        idealNormalData.push(scaledY2);
    }
    const trace1: Data = {
      x: grades, 
      y: counts, 
      type: 'bar',
      name: 'Valós eloszlás',
      marker: {
        color: 'blue', 
        line: {
          color: 'rgb(8,48,107)',
          width: 1.5,
        },
      },
    };
    const trace2: Data = {
      x: normalDistributionX,
      y: normalDistributionData,
      type: 'scatter',
      mode: 'lines',
      name: `Normál eloszlás (μ=${mean.toFixed(2)}, σ=${stdDev.toFixed(2)})`, 
      line: {
        color: 'red',
        width: 2,
      },
      hoverinfo: 'skip' 
    };
    const trace3: Data = {
      x: idealNormalX,
      y: idealNormalData,
      type: 'scatter',
      mode: 'lines',
      name: `Ideális normál eloszlás (μ=${fixedMu}, σ=${fixedSigma})`,
      line: {
        color: 'green',
        width: 2,
      },
      hoverinfo: 'skip' 
    };
    data = [trace1, trace2, trace3];
    layout = {
      autosize: true,
      margin: { l: 50, r: 100, b: 100, t: 50 }, 
      xaxis: {
        title: 'Jegy',
        range: [minX - 0.5, maxX + 0.5], 
        dtick: 1,
      },
      yaxis: {
        title: 'Darabszám',
        rangemode: 'tozero'
      },
      bargap: 0.1, 
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1
      }
    };
  }
  const config = { responsive: true };
  Plotly.newPlot(targetElement, data, layout, config);
}
