import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useCommon } from '../../context/CommonContext';
import { useAuth } from '../../context/AuthContext';
import CreatePostModal from '../common/CreatePostModal';
import GlowModeModal from '../common/GlowModeModal';
import logo from '../../assets/images/logo.jpg';
// icons 
import { GoHome } from "react-icons/go";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { IoNotificationsOutline } from "react-icons/io5";
import { IoMdAddCircleOutline } from "react-icons/io";
import { FaLandMineOn, FaRegUser } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";




const navItems = [
  { to: '/', label: 'Home', icon: <GoHome /> },
  { to: '/notifications', label: 'Alerts', icon: <IoNotificationsOutline /> },
  { to: null, label: 'Add', icon: <IoMdAddCircleOutline />, action: 'create-post' },
  // { to: '/chat', label: 'Chat', icon: <IoChatboxEllipsesOutline /> },
  { to: '/profile', label: 'Me', icon: <FaRegUser /> },
];

export default function Header() {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isGlowModeModalOpen, setIsGlowModeModalOpen] = useState(false);
  const {
    showSearch,
    toggleSearch,
    closeSearch,
    toggleGlowMode,
    glowEnabled,
    setGlowEnabled,
    setGlowMode,
    setGlowButtonVisibility
  } = useCommon();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isGlowVisible, setIsGlowVisible] = useState(false);

  useEffect(() => {
    if (location.pathname === '/') {
      setIsGlowVisible(true);
    } else {
      setIsGlowVisible(false);
    }
  }, [location])

  const handleGlowModeToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return false;
    }
    console.log("gloww enable in header : ", glowEnabled)
    try {
      if (!glowEnabled) {
        // If enabling glow mode, open the modal
        setIsGlowModeModalOpen(true);

        return true;
      } else {
        // If disabling glow mode, just toggle it off
        return await toggleGlowMode(false);
      }
    } catch (error) {
      console.error('Error handling glow mode toggle:', error);
      return false;
    }
  };

  // Handle saving glow mode settings from the modal
  const handleGlowModeSave = async (formData) => {

    try {
      // First enable glow mode
      const success = await toggleGlowMode(true);
      // console.log("handle glow mode save data : ",formData);
      if (success) {
        // If you need to save additional form data, do it here
        // await userAPI.updateGlowSettings(formData);
        setIsGlowModeModalOpen(false);
      }
      return success;
    } catch (error) {
      console.error('Error saving glow mode settings:', error);
      return false;
    }
  };

  // Update document class when glow mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('glow-mode', glowEnabled);
  }, [glowEnabled]);

  // Make glow button always visible
  useEffect(() => {
    setGlowButtonVisibility(true);
  }, []);

  const handleNavItemClick = (item) => {
    if (item.action === 'create-post') {
      setIsCreatePostModalOpen(true);
    } else if (item.to) {
      navigate(item.to);
    }
  };


  const isActiveRoute = (itemTo) => {
    if (!itemTo) return false;
    if (itemTo === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(itemTo);
  };

  return (
    <>
      {/* Top header (visible on all sizes) */}
      <header className="sticky top-0 bg-[#f9f9f9]/95 backdrop-blur z-40 border-b border-[#ff5500]/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center">
            <img
              src={logo}
              alt="Logo"
              className="h-10 w-auto object-contain rounded-md"
            />
          </NavLink>

          {/* Center nav (desktop only) */}
          <nav className="hidden md:flex items-center gap-6 text-black">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => handleNavItemClick(item)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${isActiveRoute(item.to)
                  ? 'bg-[#FFE1CC] text-[#FF5500] shadow-md font-bold'
                  : 'hover:text-black hover:bg-[#ff5500]/10'
                  }`}
              >
                <div className='text-2xl'>{item.icon}</div>
                <span>{item.label}</span>

              </button>
            ))}
          </nav>

          {/* Right icons + auth + glow toggle */}
          {/* Glow switch for home screen */}
          <div className="flex items-center gap-4">
            {!isAuthenticated ?
              <NavLink
                to="/login"
                className="mr-5 px-6 py-3 rounded-full font-semibold bg-orange-500 text-white hover:bg-orange-600 transition duration-300 shadow-sm hover:shadow-md"
              >
                Login / Signup
              </NavLink>
              :
              (isGlowVisible && (
                <div className="flex items-center gap-5">
                  <button
                    className="text-2xl cursor-pointer text-gray-600 hover:text-[#FF5500] transition-colors"
                    onClick={toggleSearch}
                    aria-label="Search"
                  >
                    <IoSearch />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Glow Mode</span>
                    <div
                      onClick={handleGlowModeToggle}
                      className={[
                        'relative h-6 w-14 rounded-full transition-colors cursor-pointer shrink-0 flex items-center px-1',
                        glowEnabled ? 'bg-[#ff5500]' : 'bg-gray-200'
                      ].join(' ')}
                      role="switch"
                      aria-checked={glowEnabled}
                      aria-label="Toggle glow mode"
                      tabIndex={0}
                    >
                      <span
                        className={[
                          'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                          glowEnabled ? 'translate-x-8' : 'translate-x-0'
                        ].join(' ')}
                      />
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="w-[100vw] md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="w-full px-3 bg-white border border-[#ff5500]/20 shadow-sm flex items-center justify-between py-1">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={() => handleNavItemClick(item)}
              className={`flex flex-col items-center text-black justify-center gap-1 px-4 py-2 text-lg rounded-3xl transition-all duration-200 ${isActiveRoute(item.to)
                ? 'bg-[#FFE1CC] text-[#FF5500] shadow-md'
                : 'hover:text-black hover:bg-[#ff5500]/10'
                }`}
            >
              {item.icon}
              {/* <span className="text-xs">{item.label}</span> */}
            </button>
          ))}
        </div>
      </nav>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
      />

      {/* Glow Mode Modal */}

      <GlowModeModal
        isOpen={isGlowModeModalOpen}
        onClose={() => setIsGlowModeModalOpen(false)}
        onSave={handleGlowModeSave}
      />
    </>
  );
}
