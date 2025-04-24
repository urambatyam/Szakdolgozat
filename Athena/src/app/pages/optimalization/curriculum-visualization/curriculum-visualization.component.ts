import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as htmlToImage from 'html-to-image';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { OptimizedPlan, Semester } from '../../../models/optimalization';

/**
 * @description
 * Komponens az optimalizált tanterv vizuális megjelenítésére SVG formátumban.
 * Megjeleníti a féléveket, a kurzusokat oszlopokba rendezve, és lehetővé teszi
 * a generált SVG képként való letöltését.
 */
@Component({
  selector: 'app-curriculum-visualization',
  standalone: true,
  imports: [CommonModule, MatButtonModule, TranslateModule],
  templateUrl: './curriculum-visualization.component.html',
  styleUrls: ['./curriculum-visualization.component.scss'] 
})
export class CurriculumVisualizationComponent  {
  @Input() optimizedPlan: OptimizedPlan | null = null; 
  @ViewChild('svgContainer') svgContainer!: ElementRef;
  private maxCoursesPerColumn = 4;
  private courseSpacing = 100;
  private columnSpacing = 170;

  /**
   * @description
   * Letölti a generált SVG diagramot PNG képként a felhasználó gépére.
   * @protected
   */
  protected downloadSvgAsPng(): void {
    if (!this.svgContainer?.nativeElement) {
      console.error('SVG container not found.');
      return;
    }
    const svg = this.svgContainer.nativeElement.querySelector('svg');
    if (svg) {
      htmlToImage.toPng(svg)
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'curriculum-plan.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error('Hiba az SVG PNG-vé alakítása során:', error);
        });
    } else {
      console.error('SVG element not found within the container.');
    }
  }

  /**
   * @description
   * Kiszámítja és visszaadja az SVG `viewBox` attribútumának értékét.
   * A viewBox meghatározza az SVG vászon koordinátarendszerét és méretét.
   * @returns string A viewBox attribútum értéke.
   * @protected
   */
  protected getViewBox(): string {
    if (!this.optimizedPlan) return "0 0 100 100";

    const width = this.getTotalSemestersWidth() + 200 + 16; 
    const height = this.getMaxHeight();
    return `-0.5 -0.5 ${width} ${height}`;
  }

  /**
   * @description
   * Kiszámítja egy adott félév vízszintes vonalának SVG `path` definícióját.
   * @param Semester semesterData A félév adatai.
   * @returns string Az SVG `path` 'd' attribútumának értéke.
   * @protected
   */
  protected getSemesterLinePath(semesterData: Semester): string {
    const width = Math.max(this.columnSpacing, this.getSemesterWidth(semesterData)); 
    return `M 0 30 L ${width} 30`; 
  }

  /**
   * @description
   * Visszaadja a félév vonal bal oldali függőleges jelölőjének SVG `path` definícióját.
   * @returns string Az SVG `path` 'd' attribútumának értéke.
   * @protected
   */
  protected getSemesterLeftTick(): string {
    return `M 0 22.5 L 0 37.5`; 
  }

  /**
   * @description
   * Kiszámítja és visszaadja a félév vonal jobb oldali függőleges jelölőjének SVG `path` definícióját.
   * @param Semester semesterData A félév adatai.
   * @returns string Az SVG `path` 'd' attribútumának értéke.
   * @protected
   */
  protected getSemesterRightTick(semesterData: Semester): string {
    const width = Math.max(this.columnSpacing, this.getSemesterWidth(semesterData)); 
    return `M ${width} 37.5 L ${width} 22.5`; 
  }

  /**
   * @description
   * Kiszámítja egy adott félévhez szükséges szélességet pixelben a benne lévő kurzusok száma alapján.
   * Figyelembe veszi a maximális kurzusszámot oszloponként és az oszlopok közötti térközt.
   * @param Semester semesterData A félév adatai.
   * @returns number A félévhez szükséges szélesség pixelben.
   * @protected
   */
  protected getSemesterWidth(semesterData: Semester): number {
    if (!semesterData?.courses || semesterData.courses.length === 0) {
      return this.columnSpacing; 
    }
    const numCourses = semesterData.courses.length;
    const columns = Math.ceil(numCourses / this.maxCoursesPerColumn);
    return columns * this.columnSpacing; 
  }

  /**
   * @description
   * Kiszámítja egy adott sorszámú félév kezdő X pozícióját pixelben.
   * Összegzi az előző félévek szélességét.
   * @param number semesterNumber A félév sorszáma (1-től indexelve).
   * @returns number A félév kezdő X pozíciója pixelben.
   * @protected
   */
  protected getSemesterXPosition(semesterNumber: number): number {
    if (!this.optimizedPlan?.semesters) return 16;
    let position = 16; 
    for (let i = 0; i < semesterNumber - 1; i++) {
      if (this.optimizedPlan.semesters[i]) {
        position += this.getSemesterWidth(this.optimizedPlan.semesters[i]);
      } else {
        position += this.columnSpacing;
      }
    }
    return position;
  }

  /**
   * @description
   * Kiszámítja egy kurzus `transform` attribútumának értékét
   * a féléven belüli indexe alapján, oszlopokba és sorokba rendezve.
   * @param number index A kurzus indexe a félév `courses` tömbjében (0-tól indexelve).
   * @returns string Az SVG `transform` attribútum értéke.
   * @protected
   */
  protected getCourseTransform(index: number): string {
    const column = Math.floor(index / this.maxCoursesPerColumn);
    const row = index % this.maxCoursesPerColumn;
    const x = column * this.columnSpacing + (this.columnSpacing / 2);
    const y = row * this.courseSpacing + 120;
    return `translate(${x}, ${y})`;
  }


  /**
   * @description
   * Kiszámítja az összes félév által elfoglalt teljes szélességet pixelben.
   * @returns A teljes szélesség pixelben.
   * @protected
   */
  protected getTotalSemestersWidth(): number {
    if (!this.optimizedPlan?.semesters) return 16;
    let totalWidth = 16; 
    this.optimizedPlan.semesters.forEach(semester => {
      totalWidth += this.getSemesterWidth(semester);
    });
    return totalWidth;
  }

  /**
   * @description
   * Kiszámítja a diagram maximális magasságát pixelben.
   * Figyelembe veszi a legtöbb kurzust tartalmazó oszlop magasságát és a félév fejléc magasságát.
   * @returns A diagram maximális magassága pixelben.
   * @protected
   */
  protected getMaxHeight(): number {
    if (!this.optimizedPlan?.semesters) return 100; 
    let maxCoursesInAnyColumn = 0;
    this.optimizedPlan.semesters.forEach(semester => {
      if (semester?.courses) {
        const rowsInSemester = Math.min(semester.courses.length, this.maxCoursesPerColumn);
        maxCoursesInAnyColumn = Math.max(maxCoursesInAnyColumn, rowsInSemester);
      }
    });
    if (maxCoursesInAnyColumn === 0) {
      return 120 + 50; 
    }
    return 120 + ((maxCoursesInAnyColumn - 1) * this.courseSpacing) + 70;
  }
}
