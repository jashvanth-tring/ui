import { axiosInstance } from "../axiosSetup";

const BASE_URL = "/v1/remarks";

/**
 * CREATE COMMENT
 */
export const createRemark = (payload: {
  task_id: string;
  comment: string;
  parent_id?: number | null;
}) => {
  return axiosInstance.post(`${BASE_URL}`, payload);
};

/**
 * GET COMMENTS BY TASK
 */
export const getRemarksByTask = (taskId: string) => {
  return axiosInstance.get(`${BASE_URL}?task_id=${taskId}`);
};

/**
 * UPDATE COMMENT
 */
export const updateRemark = (
  id: number,
  payload: {
    task_id: string;
    comment: string;
  }
) => {
  return axiosInstance.patch(`${BASE_URL}/${id}`, payload);
};

/**
 * DELETE COMMENT
 */
export const deleteRemark = (id: number, task_id: string) => {
  return axiosInstance.delete(`${BASE_URL}/${id}?task_id=${task_id}`); // ✅ query param
};

/**
 * REPLY TO COMMENT
 */
export const replyToRemark = (payload: {
  task_id: string;
  parent_id: number;
  comment: string;
}) => {
  return axiosInstance.post(`${BASE_URL}/reply`, payload);
};