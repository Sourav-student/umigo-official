import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useCommon } from "../context/CommonContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/common/SearchBar";
import TabSwitcher from "../components/common/TabSwitcher";
import SpotlightCard from "../components/common/SpotlightCard";
import PlanCard from "../components/common/PlanCard";
import PlanDetailCard from "../components/common/PlanDetailCard";
import SpotlightDetailCard from "../components/common/SpotlightDetailCard";
import { toast } from "react-toastify";
import Footer from "../components/layout/Footer";
import InfiniteScroll from "react-infinite-scroll-component";
import { useHangout } from "../context/HangoutContext";

function Landing() {
	const ITEMS_PER_PAGE = 9;
	const [query, setQuery] = useState("");
	const [activeTab, setActiveTab] = useState("Plans"); // Make sure it's capitalized to match TabSwitcher
	const { glowEnabled, setGlowEnabled, setGlowMode, showSearch, glowUsers } =
		useCommon();
	const { isAuthenticated } = useAuth();
	const location = useLocation();
	const [selectedPlan, setSelectedPlan] = useState(null);
	const [selectedUser, setSelectedUser] = useState(null);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [itemsToShow, setItemsToShow] = useState(ITEMS_PER_PAGE);
	const { getHangouts, createHangout, getHangoutDetails } = useHangout();
	const [samplePlans, setSamplePlans] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [joinedPlans, setJoinedPlans] = useState({});
	const [approachPeople, setApproachPeople] = useState({});
	const [sampleUsers, setSampleUsers] = useState([]);
	const [myLocation, setMyLocation] = useState(null);
	// console.log(myLocation);

	//Fetch my location from https://ipapi.co/json/
	// const fetchLocation = async () => {
	// 	try {
	// 		const res = await fetch("https://ipapi.co/json/");
	// 		const data = await res.json();

	// 		setMyLocation({
	// 			lat: data.latitude,
	// 			lon: data.longitude,
	// 			city: data.city,
	// 			region: data.region,
	// 			country: data.country_name,
	// 		});

	// 		// console.log("My location:", data);
	// 		// if (data) {
	// 		// 	setSamplePlans(
	// 		// 		samplePlans.filter((e) => e.location === myLocation.city)
	// 		// 	);
	// 		// }
	// 	} catch (err) {
	// 		console.error("Error fetching IP location:", err);
	// 	}
	// };

	// fetchLocation();

	// Handle joining a plan (backward compatibility)
	const handleJoin = useCallback((planId) => {
		setJoinedPlans((prev) => ({
			...prev,
			[planId]: true,
		}));
		toast.success("Join request sent!");
	}, []);

	// Set initial tab
	useEffect(() => {
		const fetchHangouts = async () => {
			// Only fetch hangouts if user is authenticated
			if (!isAuthenticated) {
				console.log("User not authenticated, skipping hangout fetch");
				setSamplePlans([]);
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const response = await getHangouts({ status: "active" });
				// If there was an error in the response but we still got a response object
				if (response.error) {
					console.error(
						"Error in hangouts response:",
						response.error
					);
					setError(response.error);
					toast.error(response.error);
					setSamplePlans([]);
					return;
				}

				console.log("Response for hangouts on landing.jsx:", response);

				// If we have hangouts data, format it
				if (response.hangouts && Array.isArray(response.hangouts)) {
					console.log(
						"Fetched hangouts:",
						response.hangouts.length,
						"hangouts"
					);
					const formattedPlans = response.hangouts.map((plan) => ({
						...plan,
						id: plan._id || plan.id, // Handle both _id and id
						name:
							plan.creator?.name ||
							plan.host?.name ||
							"Anonymous",
						subtitle: plan.title || "No title",
						time:
							plan.start_time || plan.time
								? new Date(
										plan.start_time || plan.time
								  ).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
								  })
								: "Time not set",
						location:
							plan.location ||
							plan.address ||
							"Location not specified",
						bannerImage: plan.banner_image_url || plan.bannerImage,
						avatarUrl:
							plan.creator?.profileImage ||
							plan.host?.profileImage ||
							plan.avatarUrl ||
							"/profile.jpg",
					}));

					console.log(
						"Formatted plans:",
						formattedPlans.length,
						"plans"
					);
					setSamplePlans(formattedPlans);
				} else {
					console.warn("No hangouts data in response:", response);
					setSamplePlans([]);
				}
			} catch (err) {
				console.error("Error in fetchHangouts:", err);
				const errorMessage = err.message || "Failed to load hangouts";
				setError(errorMessage);
				toast.error(errorMessage);
				setSamplePlans([]);
			} finally {
				setIsLoading(false);
			}
		};

		// Only fetch if we don't have data yet
		if (samplePlans.length === 0) {
			fetchHangouts();
		}
	}, [getHangouts, isAuthenticated]);

	// Handle glow mode changes and update user data accordingly
	useEffect(() => {
		const handleGlowModeChange = (e) => {
			const newGlowState = e.detail;
			setGlowMode(newGlowState);
			// Update sample users based on glow mode state
			if (newGlowState) {
				setSampleUsers(Array.isArray(glowUsers) ? glowUsers : []);
			} else {
				setSampleUsers([]);
				// Only switch back to Plans if we're currently on Spotlight
				if (activeTab === "Spotlight") {
					setActiveTab("Plans");
				}
			}
		};

		window.addEventListener("glowModeChange", handleGlowModeChange);
		return () => {
			window.removeEventListener("glowModeChange", handleGlowModeChange);
		};
	}, [setGlowMode, activeTab, glowUsers]);

	useEffect(() => {
		if (glowEnabled) {
			setSampleUsers(Array.isArray(glowUsers) ? glowUsers : []);
		} else {
			setSampleUsers([]);
		}
	}, [glowEnabled, glowUsers]);

	useEffect(() => {
		// Start transition when tab changes
		setIsTransitioning(true);

		// End transition after animation completes
		const timer = setTimeout(() => {
			setIsTransitioning(false);
		}, 300);

		return () => clearTimeout(timer);
	}, [activeTab]);

	// Filter spotlight users by name
	const filteredSpotlight = React.useMemo(
		() =>
			sampleUsers.filter((u) =>
				(u?.name || "").toLowerCase().includes(query.toLowerCase())
			),
		[query, sampleUsers]
	);

	// Filter plans by name
	const filteredPlans = React.useMemo(() => {
		// console.log('Sample plans:', samplePlans);
		const result =
			query.trim() === ""
				? samplePlans
				: samplePlans.filter((p) =>
						p.name.toLowerCase().includes(query.toLowerCase())
				  );

		return result;
	}, [query, samplePlans]);

	// Get current items
	const currentPlans = useMemo(() => {
		const result = filteredPlans.slice(0, itemsToShow);
		console.log(
			"Current plans to display:",
			result.length,
			"activeTab:",
			activeTab,
			"glowEnabled:",
			glowEnabled
		);
		return result;
	}, [filteredPlans, itemsToShow, activeTab, glowEnabled]);

	const currentSpotlight = useMemo(
		() => filteredSpotlight.slice(0, itemsToShow),
		[filteredSpotlight, itemsToShow]
	);

	// Load more items
	const loadMore = useCallback(() => {
		setItemsToShow((prev) => prev + ITEMS_PER_PAGE);
	}, [ITEMS_PER_PAGE]);

	// Reset items when tab or search changes
	useEffect(() => {
		setItemsToShow(ITEMS_PER_PAGE);
	}, [activeTab, query]);

	// Handle approach functionality
	const handleApproach = useCallback((userName) => {
		setApproachPeople((prev) => ({
			...prev,
			[userName]: !prev[userName],
		}));
	}, []);

	// Check if there are more items to load
	const hasMore = useMemo(() => {
		if (activeTab === "Plans") {
			return currentPlans.length < filteredPlans.length;
		} else {
			return currentSpotlight.length < filteredSpotlight.length;
		}
	}, [
		activeTab,
		currentPlans.length,
		filteredPlans.length,
		currentSpotlight.length,
		filteredSpotlight.length,
	]);

	//chat redirect - opens WhatsApp group chat
	const onChat = async (id) => {
		console.log("Opening chat for hangout:", id);
		try {
			// Get hangout details to access whatsapp_url
			const hangoutDetails = await getHangoutDetails(id);

			if (hangoutDetails && hangoutDetails.whatsapp_url) {
				console.log("Opening the url");
				// Open WhatsApp URL in new tab
				window.open(
					hangoutDetails.whatsapp_url,
					"_blank",
					"noopener,noreferrer"
				);
				toast.success("Opening WhatsApp group chat!");
			} else {
				toast.error("WhatsApp link not available for this hangout");
			}
		} catch (error) {
			console.error("Error opening chat:", error);
			toast.error("Unable to open chat at this time");
		}
		setSelectedPlan(null);
	};

	// console.log(currentSpotlight);

	return (
		<div className="min-h-screen bg-[#f9f9f9] text-[#ff5500] flex flex-col">
			{/* Main Content */}
			<main className="flex-1 px-4 py-6 pb-20 md:pb-6">
				<div className="max-w-7xl mx-auto space-y-6">
					{/* Search Bar - Fixed width container with smooth transition */}
					<div
						className={`w-full transition-all duration-300 ease-in-out overflow-hidden ${
							showSearch
								? "max-h-20 opacity-100"
								: "max-h-0 opacity-0"
						}`}
					>
						<div className="py-2">
							<SearchBar value={query} onChange={setQuery} />
						</div>
					</div>

					{/* Tab Switcher - Centered */}
					<div className="flex justify-center">
						<TabSwitcher
							active={activeTab}
							onChange={setActiveTab}
							showSpotlight={glowEnabled}
						/>
					</div>

					{/* Content Grid with Infinite Scroll */}
					<div className="w-full">
						<InfiniteScroll
							dataLength={
								activeTab === "Plans"
									? currentPlans.length
									: currentSpotlight.length
							}
							next={loadMore}
							hasMore={hasMore}
							loader={
								<div className="flex justify-center py-4">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff5500]"></div>
								</div>
							}
							endMessage={
								<p className="text-center text-gray-500 py-4">
									{activeTab === "Plans" &&
									currentPlans.length > 0
										? "You've seen all plans!"
										: activeTab === "Plans" &&
										  !isAuthenticated
										? "Please log in to view plans"
										: currentSpotlight.length > 0
										? "You've seen all spotlight users!"
										: activeTab === "Spotlight" &&
										  !glowEnabled
										? "Enable Glow Mode to see users nearby"
										: "No items to display"}
								</p>
							}
							className="w-full"
						>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
								{activeTab === "Spotlight" && !glowEnabled ? (
									<div className="col-span-3 text-center py-12">
										<p className="text-lg text-gray-600 mb-4">
											Enable Glow Mode to view Spotlight
										</p>
										<p className="text-sm text-gray-500">
											Click the Glow Mode button in the
											header to see who's nearby
										</p>
									</div>
								) : activeTab === "Plans" ? (
									currentPlans.map((p) => (
										<div
											key={p.id}
											className={`rounded-lg overflow-hidden transition-all duration-300 ease-out ${
												isTransitioning
													? "opacity-0 translate-y-4 scale-95"
													: "opacity-100 translate-y-0 scale-100"
											}`}
										>
											<PlanCard
												// key={p.id}
												hangoutId={p.id} // Add hangoutId for API integration
												glow={glowEnabled}
												bannerImage={p.bannerImage}
												avatarUrl={
													p.host.image_url ||
													p.avatarUrl ||
													"/profile.jpg"
												}
												name={p.host?.name || p.name}
												subtitle={p.subtitle}
												start_time={p.start_time}
												location={p.location}
												join={!!joinedPlans[p.id]} // Use p.id instead of p.name for consistency
												onJoin={() => onChat(p?.id)}
												onCardClick={() =>
													setSelectedPlan(p)
												}
											/>
										</div>
									))
								) : (
									currentSpotlight.map((user, idx) => (
										<div
											key={
												user.id ||
												user._id ||
												`${user.name || "user"}-${
													user.time ||
													user.location ||
													"na"
												}-${idx}`
											}
											className={`rounded-lg overflow-hidden transition-all duration-300 ease-out ${
												isTransitioning
													? "opacity-0 translate-y-4 scale-95"
													: "opacity-100 translate-y-0 scale-100"
											}`}
										>
											<SpotlightCard
												glow={glowEnabled}
												imageUrl={
													user.image_url ||
													"/profile.jpg"
												}
												name={user.name}
												time={user.time}
												location={user.location}
												note={user.note}
												approach={
													!!approachPeople[user.name]
												}
												onApproach={() =>
													handleApproach(user.name)
												}
												onCardClick={() =>
													setSelectedUser(user)
												}
											/>
										</div>
									))
								)}
							</div>
						</InfiniteScroll>
					</div>
				</div>
			</main>

			{/* Footer - Positioned at bottom */}
			{location.pathname === "/" && (
				<footer className="mt-auto border-t border-[#ff5500]/10">
					<Footer />
				</footer>
			)}

			{/* Plan Detail Modal */}
			{selectedPlan && (
				<PlanDetailCard
					plan={selectedPlan}
					hangoutId={selectedPlan?.id} // Add hangoutId for API integration
					onClose={() => setSelectedPlan(null)}
					onApproach={() => {
						// toast.success(`Approach request sent to ${selectedPlan?.name}!`);
						setSelectedPlan(null);
					}}
					onChat={() => onChat(selectedPlan?.id)}
					join={!!joinedPlans[selectedPlan?.id]} // Use ID instead of name
					onJoin={(e, success) => {
						if (success) {
							// Successfully joined via API
							setJoinedPlans((prev) => ({
								...prev,
								[selectedPlan.id]: true,
							}));
							toast.success("Join request sent!");
						} else {
							// Using old callback method
							handleJoin(selectedPlan.id);
						}
					}}
				/>
			)}

			{selectedUser && (
				<SpotlightDetailCard
					user={selectedUser}
					onClose={() => setSelectedUser(null)}
					approach={!!approachPeople[selectedUser.name]}
					onApproach={() => {
						handleApproach(selectedUser.name);
						setSelectedUser(null);
					}}
					onChat={() => {
						toast.info("Direct chat with users coming soon!");
						setSelectedUser(null);
					}}
				/>
			)}
		</div>
	);
}

export default Landing;
