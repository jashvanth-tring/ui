export interface Holiday {
  id: number;
  date: string;
  day: string;
  occasion: string;
  year: number;
  month: number;
  isActive: boolean;
}

export interface CreateHoliday {
  date: string;
  day: string;
  occasion: string;
}

export interface UpdateHoliday {
  date?: string;
  day?: string;
  occasion?: string;
}

export interface UploadHolidayResult {
  inserted: number;
}

export interface HolidayState {
  holidays: Holiday[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  uploadError: string | null;
}