import { axiosInstance } from '../axiosSetup';
import { ApiVersions, RoleRoutes } from '../endpoints';

export const getRoles = () => axiosInstance.get(`${ApiVersions.V1}${RoleRoutes.ROLES}`);
