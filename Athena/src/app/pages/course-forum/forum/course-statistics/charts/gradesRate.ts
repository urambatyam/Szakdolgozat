import Plotly, { Layout,PlotData } from 'plotly.js-dist-min';
import { NOdatalayout } from './common';
/**
 * A kurzus adati alapján létrehoz egy kördiagramot, ami a jegyek megoszlását mutja.
 * 
 * @param targetElement A div HTML refenciája, amibe belerajtolja a diagramot
 * @param response any A szervertől kapot válasz.
 * @returns void
 */
export function createGR(targetElement: HTMLDivElement, response?: any) {
  let layout: Partial<Layout>;
  let data: Partial<PlotData>[] = [];
 if(!response || response.frequency.length === 0){
    data = [{
      values: [],
      labels: [],
      type: 'pie'
    }];
    layout = NOdatalayout as Partial<Layout>; 
  }else{
    data = [{
      values: [response.frequency['1'], response.frequency['2'], response.frequency['3'], response.frequency['4'], response.frequency['5']],
      labels: ['1','2','3','4','5'],
      type: 'pie'
    }];
    layout = {
      autosize: true,
      margin: { l: 50, r: 100, b: 100, t: 50 },
    };
  }
  const config = { responsive: true };
  Plotly.newPlot(targetElement, data, layout, config);
}