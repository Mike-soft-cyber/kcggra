export const getDashboardRoute = (userRole) => {
  switch (userRole) {
    case 'admin':
      return '/admin/dashboard';
    case 'guard':
      return '/guard/dashboard';
    case 'resident':
    default:
      return '/dashboard';
  }
};

export const getDefaultRedirect = (userRole) => {
  return getDashboardRoute(userRole);
};

// Navigation items based on role
export const getNavigationItems = (userRole) => {
  const baseItems = [
    { name: 'Dashboard', path: getDashboardRoute(userRole), icon: 'Home' },
  ];

  if (userRole === 'admin') {
    return [
      ...baseItems,
      { name: 'Subscriptions', path: '/admin/subscriptions', icon: 'CreditCard' },
      { name: 'CapEx', path: '/admin/capex', icon: 'TrendingUp' },
      { name: 'Residents', path: '/admin/residents', icon: 'Users' },
      { name: 'Settings', path: '/admin/settings', icon: 'Settings' },
    ];
  }

  if (userRole === 'guard') {
    return [
      ...baseItems,
      { name: 'Incidents', path: '/dashboard/incidents', icon: 'AlertTriangle' },
      { name: 'Visitors', path: '/dashboard/visitors', icon: 'QrCode' },
      { name: 'Guard Map', path: '/dashboard/guard-map', icon: 'MapPin' },
      { name: 'Settings', path: '/dashboard/settings', icon: 'Settings' },
    ];
  }

  // Resident (default)
  return [
    ...baseItems,
    { name: 'Incidents', path: '/dashboard/incidents', icon: 'AlertTriangle' },
    { name: 'Payments', path: '/dashboard/payments', icon: 'Wallet' },
    { name: 'Community', path: '/dashboard/community', icon: 'Users' },
    { name: 'Settings', path: '/dashboard/settings', icon: 'Settings' },
  ];
};