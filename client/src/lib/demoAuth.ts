// Demo authentication system for when Firebase isn't configured
export const demoAuth = {
  currentUser: null as any,
  listeners: [] as ((user: any) => void)[],

  signInWithGoogle: async () => {
    const demoUser = {
      uid: 'demo-google-user',
      email: 'demo@google.com',
      displayName: 'Demo Google User',
      photoURL: 'https://via.placeholder.com/40',
    };
    
    demoAuth.currentUser = demoUser;
    demoAuth.listeners.forEach(listener => listener(demoUser));
    
    return { user: demoUser };
  },

  signInWithFacebook: async () => {
    const demoUser = {
      uid: 'demo-facebook-user',
      email: 'demo@facebook.com',
      displayName: 'Demo Facebook User',
      photoURL: 'https://via.placeholder.com/40',
    };
    
    demoAuth.currentUser = demoUser;
    demoAuth.listeners.forEach(listener => listener(demoUser));
    
    return { user: demoUser };
  },

  signOut: async () => {
    demoAuth.currentUser = null;
    demoAuth.listeners.forEach(listener => listener(null));
  },

  onAuthStateChanged: (callback: (user: any) => void) => {
    demoAuth.listeners.push(callback);
    // Call immediately with current state
    callback(demoAuth.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = demoAuth.listeners.indexOf(callback);
      if (index > -1) {
        demoAuth.listeners.splice(index, 1);
      }
    };
  }
};