export const getAvatarSvg = (firstName: string, lastName: string) => {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  // Generate consistent color from name
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const color = `hsl(${hash % 360}, 70%, 50%)`;
    return color;
  };

  const bgColor = stringToColor(firstName + lastName);

  return `
    <svg viewBox="0 0 40 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="${bgColor}" />
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-size="14" 
        fill="white" 
        font-family="Arial, sans-serif"
      >
        ${initials}
      </text>
    </svg>
  `;
};