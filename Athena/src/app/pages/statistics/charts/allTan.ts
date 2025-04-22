import Plotly, { Data, Layout, PlotData } from 'plotly.js-dist-min';
import { formatSemesterAxisLabel, NOdatalayout, TANResponse } from './common';

/**
 * Létrehoz és megjelenít egy Plotly scatter diagramot, amely az összesített tanulmányi átlagok
 * alakulását mutatja félévenként.
 * Ha nincs elegendő adat egy "Nincs elég adat" üzenetet jelenít meg a diagram helyett az `NOdatalayout` alapján.
 *
 * @param targetElement - A HTMLDivElement, amelybe a diagramot rajzolni kell.
 * @param response - A `TANResponse` objektum, amely tartalmazza a diagram adatait
 *                   
 */
export function createAT(targetElement: HTMLDivElement, response?: TANResponse) {
    let data: Partial<PlotData>[] = [];
    let layout: Partial<Layout>;
    if (response && response.label && response.label.length > 0) {
      const semesterLabels: string[] = response.label.map(formatSemesterAxisLabel);
      const tans: Partial<PlotData> = {
        y: response.data, 
        type: 'scatter'   
      };
      layout = {
        autosize: true, 
        margin: { l: 50, r: 50, b: 100, t: 50 }, 
          xaxis: {
            title: 'Félév', 
            tickmode: 'array', 
            tickvals: Object.keys(response.label).map(Number),
            ticktext: semesterLabels,
            tickangle: -45 
          },
          yaxis: { title: 'Tanulmányi átlag' } 
        };
      data.push(tans);
    } else {
       const traceEmpty: Data = {
          y: [], 
          type: 'scatter', 
          mode: 'markers', 
          name: 'Nincsenek adatok', 
          hovertemplate: 'Nincs adat<extra></extra>' 
       };
       data = [traceEmpty];
       layout = NOdatalayout as Partial<Layout>;
    }
      const config = {
          responsive: true, 
          displayModeBar: (data.length > 0 && data[0].y && data[0].y.length > 0)
        };
      Plotly.newPlot(targetElement, data, layout, config);
}