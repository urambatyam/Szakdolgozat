import Plotly, { Data, Layout } from 'plotly.js-dist-min';

export function creatD() {
    // Példa adatok a kapott jegyekről (ezeket a szerverről kellene lekérni)
    const receivedGrades = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5];
  
    // Jegyek gyakoriságának számítása
    const gradeCounts: { [key: number]: number } = {};
    receivedGrades.forEach(grade => {
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    });
  
    // Adatok előkészítése a diagramhoz
    const grades = Object.keys(gradeCounts).map(Number);
    const counts = Object.values(gradeCounts);
  
    // Valós átlag és szórás számítása
    const sum = receivedGrades.reduce((acc, val) => acc + val, 0);
    const mean = sum / receivedGrades.length;
    
    // Szórás számítása
    const squaredDiffs = receivedGrades.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / receivedGrades.length;
    const stdDev = Math.sqrt(variance);
  
    console.log(`Valós átlag: ${mean.toFixed(2)}, Szórás: ${stdDev.toFixed(2)}`);
  
    // 1. Görbe: Valós adatok alapján normál eloszlás
    const totalCount = receivedGrades.length;
    const normalDistributionX: number[] = [];
    const normalDistributionData: number[] = [];
  
    // 2. Görbe: Rögzített paraméterekkel (ideális normál eloszlás)
    const fixedMu = 3; // Rögzített átlag a skála közepén
    const fixedSigma = 0.7; // Kisebb rögzített szórás a keskenyebb görbéhez
    const idealNormalX: number[] = [];
    const idealNormalData: number[] = [];
  
    // X tengely kibővítése, hogy a görbék érintsék az x-tengelyt
    for (let x = 0; x <= 6; x += 0.1) {
      normalDistributionX.push(x);
      idealNormalX.push(x);
      
      // Valós adatokon alapuló normál eloszlás
      const y1 = (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      const scaledY1 = y1 * totalCount;
      normalDistributionData.push(scaledY1);
      
      // Ideális (rögzített) normál eloszlás
      const y2 = (1 / (fixedSigma * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((x - fixedMu) / fixedSigma, 2));
      const scaledY2 = y2 * totalCount;
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
          color: 'blue',
          width: 0.5,
        },
      },
    };
  
    const trace2: Data = {
      x: normalDistributionX,
      y: normalDistributionData,
      type: 'scatter',
      mode: 'lines',
      name: 'Normál eloszlás (valós adatokból)',
      line: {
        color: 'red',
        width: 2,
      },
    };
  
    const trace3: Data = {
      x: idealNormalX,
      y: idealNormalData, 
      type: 'scatter',
      mode: 'lines',
      name: 'Ideális normál eloszlás',
      line: {
        color: 'green',
        width: 2,
        // dash: 'dash', // Opcionális: szaggatott vonal
      },
    };
  
    const layout = {
      title: 'Jegyek Eloszlása és Normál Eloszlás',
      xaxis: {
        title: 'Jegy',
        range: [0, 6], // Kibővített tartomány, hogy a görbék elérjék az x-tengelyt
        dtick: 1, // 1-es lépésközök
      },
      yaxis: {
        title: 'Darabszám',
        rangemode: 'tozero' // Y tengely nullától induljon
      },
      bargap: 0, // Oszlopok közötti távolság
      barmode: 'overlay', // A görbe ráhelyezése az oszlopokra
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1
      }
    };
  
    const graph = {
      data: [trace1, trace2, trace3],
      layout: layout
    };
    Plotly.newPlot('distrubution', graph.data, graph.layout as Layout);
  }