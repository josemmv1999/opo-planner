export const scoreBarClass = (percentage: number): string => {
  if (percentage < 50) return 'bg-danger';
  if (percentage < 60) return 'bg-secondary';
  if (percentage < 75) return 'bg-warning';
  return 'bg-success';
};
