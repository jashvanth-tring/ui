import { axiosInstance } from '../axiosSetup';
import { ApiVersions, HolidayRoutes } from '../endpoints';  // ← add HolidayRoutes
import { CreateHoliday, UpdateHoliday } from '../model/holiday.types';

export const fetchHolidaysService = (params?: { year?: string; month?: string }) => {
  const search = new URLSearchParams();
  if (params?.year)  search.set('year',  params.year);
  if (params?.month) search.set('month', params.month);
  const q = search.toString();
  return axiosInstance.get(`${ApiVersions.V1}${HolidayRoutes.HOLIDAYS}${q ? `?${q}` : ''}`);
};

export const createHolidayService = (payload: CreateHoliday) => {
  return axiosInstance.post(`${ApiVersions.V1}${HolidayRoutes.HOLIDAY}`, payload);
};

export const updateHolidayService = (id: number, payload: UpdateHoliday) => {
  return axiosInstance.put(`${ApiVersions.V1}${HolidayRoutes.HOLIDAY}/${id}`, payload);
};

export const deleteHolidayService = (id: number) => {
  return axiosInstance.delete(`${ApiVersions.V1}${HolidayRoutes.HOLIDAY}/${id}`);
};

export const deleteHolidaysByYearService = (year: number) => {
  return axiosInstance.delete(`${ApiVersions.V1}${HolidayRoutes.BY_YEAR}/${year}`);
};

export const uploadHolidayDocService = (file: File, year: number) => {
  const form = new FormData();
  form.append('file', file);
  return axiosInstance.post(`${ApiVersions.V1}${HolidayRoutes.UPLOAD}?year=${year}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};