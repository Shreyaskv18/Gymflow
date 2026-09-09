import { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { MemberLoginPage } from './components/auth/MemberLoginPage';
import { AppLayout } from './layouts/AppLayout';
import { MemberPortalLayout } from './layouts/MemberPortalLayout';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { Admin, Gym, Member } from './types';

export default function App() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [authMode, setAuthMode] = useState<'staff' | 'member'>('member');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize storage & check authentication session
    storageService.ensureInitialized();
    const currentGym = storageService.getGym();
    setGym(currentGym);

    // Check member session first
    const currentMember = authService.getCurrentMember();
    if (currentMember) {
      setMember(currentMember);
      setIsInitializing(false);
      return;
    }

    // Check staff/admin session
    const currentAdmin = authService.getCurrentAdmin();
    if (currentAdmin) {
      setAdmin(currentAdmin);
      setIsInitializing(false);
      return;
    }

    setIsInitializing(false);
  }, []);

  const handleStaffLoginSuccess = (loggedInAdmin: Admin) => {
    setAdmin(loggedInAdmin);
    setMember(null);
    setGym(storageService.getGym());
  };

  const handleMemberLoginSuccess = (loggedInMember: Member) => {
    setMember(loggedInMember);
    setAdmin(null);
    setGym(storageService.getGym());
  };

  const handleStaffLogout = () => {
    authService.logout();
    setAdmin(null);
  };

  const handleMemberLogout = () => {
    authService.memberLogout();
    setMember(null);
  };

  const handleGymUpdated = (updatedGym: Gym) => {
    setGym(updatedGym);
  };

  const handleAdminUpdated = (updatedAdmin: Admin) => {
    setAdmin(updatedAdmin);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider uppercase text-slate-300">
            Initializing GymFlow...
          </span>
        </div>
      </div>
    );
  }

  // If authenticated as a gym member: Member Portal
  if (member) {
    return (
      <MemberPortalLayout
        member={member}
        gym={gym || storageService.getGym()}
        onLogout={handleMemberLogout}
        onUpdateMember={(updated) => setMember(updated)}
      />
    );
  }

  // If authenticated as staff or owner: Staff Management Dashboard (NO AI Robot)
  if (admin) {
    return (
      <AppLayout
        admin={admin}
        gym={gym || storageService.getGym()}
        onLogout={handleStaffLogout}
        onGymUpdated={handleGymUpdated}
        onAdminUpdated={handleAdminUpdated}
      />
    );
  }

  // Unauthenticated: show selected login gateway (NO AI Robot)
  return authMode === 'member' ? (
    <MemberLoginPage
      onLoginSuccess={handleMemberLoginSuccess}
      onSwitchToStaffLogin={() => setAuthMode('staff')}
    />
  ) : (
    <LoginPage
      onLoginSuccess={handleStaffLoginSuccess}
      onSwitchToMemberLogin={() => setAuthMode('member')}
    />
  );
}
