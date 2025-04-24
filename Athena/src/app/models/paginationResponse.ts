/**
 * A táblázatok paginációjához tartózó model(hogy éppen hányádik oldal és hány rekord)
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    current_page: number;
    per_page: number;
  }