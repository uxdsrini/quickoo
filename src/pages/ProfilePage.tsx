import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Phone, MapPin, LogOut, Loader2, AlertCircle } from 'lucide-react';

interface ProfilePageProps {
  onSignOut?: () => void;
  onProfileComplete?: () => void;
}

export function ProfilePage({ onSignOut, onProfileComplete }: ProfilePageProps = {}) {
  const { user, userProfile, profileLoading, loadUserProfile, signOut } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });
  const profileComplete = !!(profile.fullName && profile.phone && profile.address && profile.city && profile.pincode);

  useEffect(() => {
    if (userProfile) {
      setProfile({
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        pincode: userProfile.pincode || '',
      });
    }
  }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isComplete = !!(profile.fullName && profile.phone && profile.address && profile.city && profile.pincode);
      
      await setDoc(doc(db, 'users', user!.uid), {
        email: user?.email,
        ...profile,
        profileCompleted: isComplete,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      // Refresh the profile data in the context
      await loadUserProfile();
      
      if (isComplete) {
        // If profile is complete and callback is provided, navigate to home immediately
        if (onProfileComplete) {
          onProfileComplete();
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      if (onSignOut) {
        onSignOut();
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view profile</h2>
          <p className="text-gray-500">Create an account to manage your profile</p>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {!profileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Complete Your Profile</h3>
            <p className="text-sm text-amber-800">
              Please fill in all required information to place orders and enjoy a seamless shopping experience.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.fullName || 'User'}</h2>
            <p className="text-gray-500 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={e => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Address
            </label>
            <textarea
              value={profile.address}
              onChange={e => setProfile({ ...profile, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your address"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={e => setProfile({ ...profile, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                value={profile.pincode}
                onChange={e => setProfile({ ...profile, pincode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter pincode"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
}
