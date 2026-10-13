import img1  from '../assets/Profile-avatar/Female-5.png';
import img2  from '../assets/Profile-avatar/Male-3.png';
import img3  from '../assets/Profile-avatar/Female-2.png';
import img4  from '../assets/Profile-avatar/Male-2.png';
import img5  from '../assets/Profile-avatar/Female-6.png';
import img11 from '../assets/Profile-avatar/Male-1.png';
import img12 from '../assets/Profile-avatar/Female-4.png';
import img13 from '../assets/Profile-avatar/Male-5.png';
import img14 from '../assets/Profile-avatar/Female-1.png';
import img15 from '../assets/Profile-avatar/Male-6.png';
export type ProfileIllustrationGroup = 'professional' | 'casual';

export interface ProfileIllustration {
  id: string;
  label: string;
  group: ProfileIllustrationGroup;
  src: string;
}

export const PROFILE_ILLUSTRATIONS: ProfileIllustration[] = [
  { id: 'pro-1',    label: 'Executive',    group: 'professional', src: img1  },
  { id: 'pro-2',    label: 'HR Director',  group: 'professional', src: img2  },
  { id: 'pro-3',    label: 'Recruiter',    group: 'professional', src: img3  },
  { id: 'pro-4',    label: 'Partner',      group: 'professional', src: img4  },
  { id: 'pro-5',    label: 'Manager',      group: 'professional', src: img5  },


  { id: 'casual-1',  label: 'Weekend',    group: 'casual', src: img11 },
  { id: 'casual-2',  label: 'Sunny',      group: 'casual', src: img12 },
  { id: 'casual-3',  label: 'Creative',   group: 'casual', src: img13 },
  { id: 'casual-4',  label: 'Breeze',     group: 'casual', src: img14 },
  { id: 'casual-5',  label: 'Explorer',   group: 'casual', src: img15 },

];