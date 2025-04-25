/**
 * Formáz egy félév azonosító stringet emberileg olvasható formátumra.
 * A 0 kód a tavaszi, az 1 kód az őszi félévet jelöli.
 *
 * @param key - A formázandó félév azonosító string.
 * @returns A formázott félév string, vagy az eredeti `key`, ha a formátum ismeretlen.
 */
export function formatSemesterAxisLabel(key: string): string {
    const parts = key.split(' ');
    if (parts.length !== 2) return key;
    const year = parseInt(parts[0], 10);
    const seasonCode = parseInt(parts[1], 10);
    if (isNaN(year) || isNaN(seasonCode)) return key;
    if (seasonCode === 1) {
      return `${year}/${year + 1} Ősz`;
    } else if (seasonCode === 0) {
      return `${year}/${year+1} Tavasz`;
    } else {
      return key;
    }
  }
  
  /**
   * Interfész a lineáris regressziós adatok válaszának típusához.
   */
  export interface LinearRegressionResponse {
      m: number;
      b: number;
      pairs: [number, number][];
      label: string[];
  }
  /**
   * Interfész a normál eloszlási adatok válaszának típusához.
   */
  export interface DistributionResponse {
    frequency: { [key: string]: number }; 
    mean: number;                         
    std: number;                          
    totalCount: number;                   
  }
  /**
   * Előre definiált Plotly layout konfiguráció arra az esetre,
   * ha nincs elegendő adat a diagram megjelenítéséhez.
   * Egy középre igazított "Nincs elég adat" üzenetet jelenít meg.
   */
  export const NOdatalayout = {
          autosize: true,
          xaxis: {
            visible: false,
            fixedrange: true
          },
          yaxis: {
            visible: false,
            fixedrange: true
          },
          annotations: [
            {
              text: 'Nincs elég adat',
              xref: 'paper',
              yref: 'paper',
              x: 0.5,
              y: 0.5,
              showarrow: false,
              font: {
                size: 16
              }
            }
          ],
          margin: { l: 10, r: 10, b: 10, t: 10 }
  };
  /**
   * A kurzusokhoz tartozó diagramok léptetésére felhasznált enum
   */
  export enum CourseStatisticType {
    Distribution = 'd',
    GradeRate = 'gr',
    CompletionRate = 'cr',
    LinearRegression = 'lr',
    BoxPlot = 'bp'
  }
  