import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/authService";
import { FaUser, FaCalendar, FaMapMarkerAlt, FaClock, FaEllipsisV, FaCheck, FaTimes, FaComment, FaHourglass, FaWalking, FaShoppingBag } from 'react-icons/fa';
import hangoutService from '../services/hangoutService';
import { toast } from 'react-toastify';
import { userAPI } from "../services/authService";

import LocationSelector from "./components/LocationSelector";
import MyEditProfile from "../components/profile/MyEditProfile";
import PlanSection from "../components/profile/PlansSection";
import CreatePostModal from "../components/common/CreatePostModal";

// const interests = ["Movies", "Coffee", "Gym", "Walk"];

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const [planRequests, setPlanRequests] = useState([]);

  const [location, setLocation] = useState("Current Location");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  // Fixed fetchUser function to match the authAPI response structure
  const fetchUser = useCallback(async () => {
    let isMounted = true;

    try {
      setIsLoadingProfile(true);
      setProfileError(null);

      const userInfo = await userAPI.getCurrentUser();

      if (isMounted) {

        // The authAPI.getProfile() now returns response.user directly
        setCurrentUser(userInfo || null);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      if (isMounted) {
        const errorMessage = error.message || 'Failed to load profile';
        setProfileError(errorMessage);
        toast.error("Failed to load user profile");
      }
    } finally {
      if (isMounted) {
        setIsLoadingProfile(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleApproveRequest = async (requestId) => {
    try {
      setPlanRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'approved' } : req
        )
      );

      // Here you would typically make an API call to update the request status
      // await hangoutService.updateJoinRequest(hangoutId, requestId, 'approved');

      toast.success('Plan request approved!');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
      // Revert on error
      setPlanRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'pending' } : req
        )
      );
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      // Remove the rejected plan from the list
      setPlanRequests(prev => prev.filter(req => req.id !== requestId));

      // Here you would typically make an API call to update the request status
      // await hangoutService.updateJoinRequest(hangoutId, requestId, 'rejected');

      toast.info('Plan request rejected and removed');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const navigateToChat = (request) => {
    // Here you would navigate to the chat with the requester
    // navigate(`/chat/${request.requester.id}`);
    toast.info(`Chat with ${request.requester.name} would open here`);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLocationUpdate = (newLocation) => {
    setLocation(newLocation);
    // Here you can add API call to save the location to the user's profile
    // Example API call:
    // await updateUserProfile({ location: newLocation });
  };

  const handleProfileUpdate = () => {
    setCurrentUser(currentUser);
    updateUser(currentUser);
    // Optionally refresh the profile data
    fetchUser();
  };

  const nameFirstLetter = currentUser?.name?.charAt(0)?.toUpperCase() || '?';

  // Loading state for profile
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state for profile
  if (profileError && !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">Failed to load profile</p>
          <p className="text-gray-500 text-sm mb-4">{profileError}</p>
          <button
            onClick={() => fetchUser()}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showEditProfile && (
        <MyEditProfile
          onClose={() => setShowEditProfile(false)}
          onUpdate={handleProfileUpdate}
          currentUser={currentUser}
        />
      )}

      <div className="min-h-screen bg-white pb-6">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <div className="flex items-center">
                    <LocationSelector
                      initialLocation={location}
                      onLocationUpdate={handleLocationUpdate}
                    />
                  </div>
                </div>
              </div>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-red-600 transition-colors duration-300 ease-in-out disabled:opacity-50"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>

        {/* Profile section */}
        <div className="flex flex-col md:flex-row gap-7 lg:gap-20 xl:gap-32 p-8 lg:px-20 xl:px-30">
          <div className="flex flex-col justify-center items-center">
            <div className="rounded-full border overflow-hidden">
              {currentUser?.image_url ? (
                <img
                  src={currentUser.image_url}
                  alt={currentUser?.name || "User"}
                  className="w-[150px] h-[150px] md:h-[300px] md:w-[300px] rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-[150px] h-[150px] md:h-[300px] md:w-[300px] flex items-center justify-center bg-gray-200 text-6xl font-bold rounded-full"
                style={{ display: currentUser?.image_url ? 'none' : 'flex' }}
              >
                {nameFirstLetter}
              </div>
            </div>
            <h1 className="text-black text-3xl pt-4">{currentUser?.name || 'Loading...'}</h1>
            {currentUser?.bio && (
              <p className="text-gray-600 text-center mt-2 max-w-sm">{currentUser.bio}</p>
            )}

            {/* hobby section */}
            {/* <div className="flex gap-4 mt-4 p-1">
              {interests.map((hobby, index) => (
                <button
                  key={index}
                  className="bg-gray-300 text-gray-600 p-1.5 rounded-lg cursor-pointer hover:bg-gray-400 transition-colors"
                >
                  {hobby}
                </button>
              ))}
            </div> */}

            <div className="flex gap-3 p-1 mt-4 font-medium">
              <button
                className="border border-orange-500 py-2 px-9 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors font-medium"
                onClick={() => setShowEditProfile(true)}
              >
                Edit Profile
              </button>
              <button
                className="border border-orange-500 py-2 px-9 rounded-lg cursor-pointer font-medium hover:bg-orange-50 transition-colors flex items-center gap-2"
                 onClick={() => setIsCreatePostModalOpen(true)}
              >
                <span className="relative bg-orange-500 group-hover:bg-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-white group-hover:text-orange-500 transition-all duration-300 group-hover:rotate-90 font-bold text-lg sm:text-xl shadow-sm">
                  +
                </span> Plan
              </button>
              <CreatePostModal
                isOpen={isCreatePostModalOpen}
                onClose={() => setIsCreatePostModalOpen(false)}
              />
            </div>
          </div>

          <div className="flex-1 max-w-2xl">
            <PlanSection User={currentUser} />
          </div>
        </div>

        {/* Plan Requests Section */}
        <div className="mt-10 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="w-full mb-6">
            <div className="inline-flex items-center gap-3 pb-2 border-b-2 border-stone-800">
              <FaCalendar className="text-2xl sm:text-3xl text-stone-800" />
              <h1 className="text-2xl sm:text-3xl font-medium text-stone-800">Plan Requests</h1>
            </div>
          </div>

          <div className="space-y-4">
            {planRequests.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-lg">
                <FaHourglass className="mx-auto text-4xl sm:text-5xl mb-3 text-stone-400" />
                <p className="text-stone-500 text-lg">No pending plan requests</p>
              </div>
            ) : (
              planRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 border border-stone-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl sm:text-4xl bg-stone-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                    {request.requester.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-stone-800 mb-1">{request.title}</h3>
                    <p className="text-sm text-stone-600 mb-2">From: {request.requester.name}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-stone-600">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-stone-400" />
                        <span className="truncate">{request.location}</span>
                      </div>
                      <div className="flex items-center">
                        <FaClock className="mr-2 text-stone-400" />
                        <span>{new Date(request.time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-col-reverse gap-2 sm:gap-3 mt-2 sm:mt-0">
                    {request.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="flex items-center justify-center px-4 py-2 text-sm sm:text-base font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <FaCheck className="mr-2" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="flex items-center justify-center px-4 py-2 text-sm sm:text-base font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <FaTimes className="mr-2" /> Reject
                        </button>
                      </>
                    ) : request.status === 'approved' ? (
                      <div className="flex flex-col gap-3">
                        <span className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full text-center">
                          Approved
                        </span>
                        <button
                          onClick={() => navigateToChat(request)}
                          className="flex items-center justify-center px-4 py-2 text-sm sm:text-base font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <FaComment className="mr-2" /> Chat Now
                        </button>
                      </div>
                    ) : (
                      <span className="px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full text-center cursor-pointer">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;