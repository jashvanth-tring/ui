import { User } from '../store/model';

export const getUserName = (user: User): string => {
  if (!user) return 'N/A';

  const firstName = user?.firstName?.trim();
  const lastName = user?.lastName?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName && !lastName) {
    return `${firstName}`;
  } else if (lastName && !firstName) {
    return `${lastName}`;
  } else {
    return 'Unknown user';
  }
};

export const getUserNameEmail = (user: User): string => {
  if (!user) return 'N/A';

  const firstName = user?.firstName?.trim();
  const lastName = user?.lastName?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName && !lastName) {
    return `${firstName}`;
  } else if (lastName && !firstName) {
    return `${lastName}`;
  } else {
    return user?.officialEmail;
  }
};
