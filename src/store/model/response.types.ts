export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface AxiosResponse<T> {
  data: ApiResponse<T>;
}
