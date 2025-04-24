/**
 * Egy alfeladatot vagy oszlopdefiníciót reprezentál a felhasználói felületen,
 * például egy táblázatban. Tartalmaz egy egyedi kulcsot, egy megjelenítendő nevet
 * és egy állapotot.
 */
export interface Subtask {
  key: string;
  name: string;
  completed: boolean;
}

/**
 * Egy fő feladatot vagy egy csoportosító elemet reprezentál, amely alfeladatokat tartalmazhat.
 * A CurriculumComponent kontextusában ez az oszlopok beállításait fogja össze.
 */
export interface Task {
  name: string;
  completed: boolean;
  subtasks: Subtask[];
}

/**
* Egy opciót reprezentál az oszlopválasztó komponensben.
* Lehetővé teszi a felhasználó számára, hogy kiválassza, mely oszlopok legyenek láthatóak.
*/
export interface ColumnOption {
 name: string;
 completed: boolean;
 key: string;
}
