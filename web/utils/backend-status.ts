export const getStatusConfig = (status: string) => {
  if (status.toLowerCase() === 'initializing') {
    return {
      text: 'Menghubungkan...',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    };
  }
  if (status.toLowerCase() === 'online') {
    return {
      text: 'Terhubung',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    };
  }
  return {
    text: 'Terputus',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
  };
};

export const statusStyle = (status: string) => ({
  backgroundColor: getStatusConfig(status).bgColor === 'bg-yellow-50' ? '#fefce8' :
    getStatusConfig(status).bgColor === 'bg-green-50' ? '#f0fdf4' :
      getStatusConfig(status).bgColor === 'bg-red-50' ? '#fef2f2' : undefined,
  color: getStatusConfig(status).textColor === 'text-yellow-600' ? '#ca8a04' :
    getStatusConfig(status).textColor === 'text-green-600' ? '#16a34a' :
      getStatusConfig(status).textColor === 'text-red-600' ? '#dc2626' : undefined,
});