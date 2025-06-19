// Simple guest user system without authentication
export interface GuestUser {
  id: string;
  name: string;
  avatar: string;
  joinedAt: Date;
}

class GuestAuthManager {
  private currentUser: GuestUser | null = null;
  private listeners: ((user: GuestUser | null) => void)[] = [];

  getCurrentUser(): GuestUser | null {
    if (!this.currentUser) {
      const saved = localStorage.getItem('guestUser');
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    }
    return this.currentUser;
  }

  setUser(name: string): GuestUser {
    const user: GuestUser = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      avatar: this.generateAvatar(name),
      joinedAt: new Date(),
    };

    this.currentUser = user;
    localStorage.setItem('guestUser', JSON.stringify(user));
    this.notifyListeners(user);
    return user;
  }

  clearUser(): void {
    this.currentUser = null;
    localStorage.removeItem('guestUser');
    this.notifyListeners(null);
  }

  onUserChange(callback: (user: GuestUser | null) => void): () => void {
    this.listeners.push(callback);
    // Call immediately with current state
    callback(this.getCurrentUser());
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private generateAvatar(name: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    const colorIndex = name.length % colors.length;
    const color = colors[colorIndex];
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="${color}"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial" font-size="14" fill="white" font-weight="bold">
          ${initials}
        </text>
      </svg>
    `)}`;
  }

  private notifyListeners(user: GuestUser | null): void {
    this.listeners.forEach(listener => listener(user));
  }
}

export const guestAuth = new GuestAuthManager();