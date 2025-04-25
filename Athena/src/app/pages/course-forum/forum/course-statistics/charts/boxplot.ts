import Plotly, { Data, Layout, PlotData } from 'plotly.js-dist-min';
import { formatSemesterAxisLabel, NOdatalayout } from './common';

/**
 * A kurzus adati alapján létrehoz minden félévhez egy boxplot-ot
 * 
 * @param targetElement A div HTML refenciája, amibe belerajtolja a diagramot
 * @param response any A szervertől kapot válasz.
 * @returns void
 */
export function creatBP(targetElement: HTMLDivElement, response?: any):void {
  let data: Partial<PlotData>[] = []; 
  let layout: Partial<Layout>;
  if (response && response.semesters && Object.keys(response.semesters).length > 0) {
    const semesters = response.semesters;
    const semesterKeys = Object.keys(semesters);
    for (const key of semesterKeys) {
      const grades = semesters[key];
      const semesterName = formatSemesterAxisLabel(key); 
      if (grades && grades.length > 0) {
        const trace: Data = {
          y: grades, 
          type: 'box',
          name: semesterName, 
          boxpoints: 'all', 
          jitter: 0.3,     
          pointpos: -1.8,  
          hoverinfo: "y"
         
        };
        data.push(trace); 
      }
    }
    if (data.length === 0) {
         const traceEmpty: Data = { y: [], type: 'box', };
         data = [traceEmpty];
    }
    layout = {
      autosize: true,
      margin: { l: 50, r: 100, b: 100, t: 50 },
      yaxis: {
          title: 'Jegyek',
          autorange: true,
          showgrid: true,
          zeroline: false,
          dtick: 1, 
          gridcolor: 'rgb(220, 220, 220)',
          gridwidth: 1,
      },
      xaxis: {
          title: 'Félévek',
          showticklabels: true, 
      },
      boxmode: 'group', 
      showlegend: false                 
    };
  } else {
     const traceEmpty: Data = {
        y: [],
        type: 'box',
     };
     data = [traceEmpty];
     layout = NOdatalayout as Partial<Layout>;
  }
  const config = { responsive: true };
  Plotly.newPlot(targetElement, data, layout, config);
}