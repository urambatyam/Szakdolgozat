import Plotly, { Layout,PlotData } from 'plotly.js-dist-min';
import { NOdatalayout } from './common';
/**
 * A kurzus adati alapján létrehoz egy kördiagramot, ami a tejesités megoszlását mutja.
 * 
 * @param targetElement A div HTML refenciája, amibe belerajtolja a diagramot
 * @param response any A szervertől kapot válasz.
 * @returns void
 */
export function creatCR(targetElement: HTMLDivElement, response?: any) {
  let layout: Partial<Layout>;
  let data: Partial<PlotData>[] = [];
  if(!response){
    data = [{
      values: [],
      labels: [],
      type: 'pie'
    }];
    layout = NOdatalayout as Partial<Layout>; 
  }else{
    data = [{
      values: [response.failed,response.completed,response.absent],
      labels: ['Bukott','Teljesített','Nem teljesített'],
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