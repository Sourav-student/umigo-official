import React, { useState, useEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { BsChatDots, BsClock, BsFilm } from 'react-icons/bs';
// import { IoLocation } from 'react-icons/io5';
import { NavLink } from 'react-router-dom';
import BannerData from "../../assets/keywordsforBanner.json";

function PlanDetailCard({ plan, onClose, onApproach, onChat, join, onJoin }) {
  if (!plan) return null;

  const handleApproach = (e) => {
    e.stopPropagation();
    if (onApproach) onApproach();
  };

  const handleChat = (e) => {
    e.stopPropagation();
    if (onChat) onChat();
  };

  const [bannerImg, setBannerImg] = useState("");

  // PROCESS TO FIND BANNER
  useEffect(() => {
    function findKeyword(subtitle) {
      if (!subtitle) return null;
      const query = plan.subtitle.toLowerCase();

      const exactMatch = BannerData.keywords.find(
        (k) => k.keyword.toLowerCase() === query
      );
      if (exactMatch) return exactMatch.image_url;

      const relatedMatch = BannerData.keywords.find((k) =>
        k.related_keywords.some((r) =>
          r.toLowerCase().includes(query)
        )
      );
      if (relatedMatch) return relatedMatch.image_url;

      const getSimilarity = (a, b) => {
        a = a.toLowerCase();
        b = b.toLowerCase();
        let matches = 0;
        const len = Math.min(a.length, b.length);
        for (let i = 0; i < len; i++) {
          if (a[i] === b[i]) matches++;
        }
        return matches / Math.max(a.length, b.length);
      };

      let bestMatch = null;
      let highestScore = 0;

      BannerData.keywords.forEach((k) => {
        const score = getSimilarity(query, k.keyword);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = k;
        }
      });

      return highestScore >= 0.5 ? bestMatch?.image_url : null;
    }

    const matchedImage = findKeyword(plan.subtitle);
    setBannerImg(matchedImage || plan.bannerImage || "");
  }, [plan.subtitle, plan.bannerImage]);


  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-[360px] bg-white rounded-2xl shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar - Only back button */}
        <div className="p-4 flex items-center justify-start">
          <button
            onClick={onClose}
            className="text-gray-700 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            aria-label="Back"
          >
            <IoArrowBack className="w-5 h-5" />
          </button>
        </div>

        {/* Header with Movie Reels */}
        <div className="relative h-40">
          {/* Decorative Movie Reels */}
          <div className="absolute inset-0 opacity-70">
            <img src={bannerImg} alt="" className="w-full h-full object-cover" />
            {/* <div className="absolute top-4 left-4 w-20 h-20 rounded-full border-4 border-white/30"></div>
            <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full border-4 border-white/30"></div> */}
          </div>

          {/* Profile Image */}
          <div className="absolute -bottom-16 left-6 w-28 h-28">
            <NavLink to={`/user/${plan.id}`}>
              <img
                src={plan.avatarUrl || 'https://randomuser.me/api/portraits/men/1.jpg'}
                alt={plan.host.name}
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
              />
            </NavLink>
            {/* Name */}
            <NavLink to={`/user/${plan.id}`}>
              <div className=" relative left-[120px] bottom-[60px] flex items-center text-stone-900 text-xl text-nowrap">
                <span>{plan.host.name || 'Annynomous'}</span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pt-20 pb-6">
          {/* Name
          <div className="flex items-center text-gray-700">
            <span>{plan.name || 'Selmon Bhai'}</span>
          </div> */}

          {/* Event Details */}
          <div className="space-y-2 mb-8">
            <h3 className="text-xl text-nowrap text-[#1c1c1c] mt-6 mb-2 flex justify-start items-center font-semibold"><BsFilm className="w-5 h-5 mr-3" />{plan.subtitle}</h3>
            <div className="flex items-center text-[#1c1c1c] opacity-60">
              <BsClock className="w-5 h-5 mr-3 " />
              <span>{plan.start_time}</span>
            </div>
            <div className=" text-[#1c1c1c] flex items-center gap-1">
              <span role="img" aria-label="place">📍</span>
              <span className="opacity-60 text-sm">
                {plan.location.length > 30 ? `${plan.location.slice(0, 30)}...` : plan.location}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onJoin) onJoin();
                onApproach(e);
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer ${join
                ? 'bg-[#909090] text-white hover:bg-[#575757]'
                : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
            >
              {join ? 'Requested' : 'Join'}
            </button>
            <button
              onClick={handleChat}
              className="flex-1 py-3 px-4 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
            >
              <BsChatDots className="w-5 h-5 mr-2" />
              Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanDetailCard;
