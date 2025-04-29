import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { format, isSameDay, parseISO, isBefore, isAfter } from 'date-fns';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Filter, 
  Tag, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Search,
  X,
  ChevronsUp,
  Sparkles,
  Star,
  TrendingUp,
  Menu,
  Heart,
  ChevronDown,
  Bookmark,
  Share2,
  Plus,
  Music,
  Film,
  Briefcase,
  Code,
  BookOpen,
  Zap,
  PenTool,
  Palette,
  Camera,
  Coffee,
  Moon,
  Sun,
  MessageCircle,
  LogIn,
  Utensils,
  Globe,
  Award,
  Gift,
  Layers,
  Mic,
  Monitor,
  Theatre
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext'; // Import the theme context

// API base URL
const API_URL = 'http://localhost:8080/api';

// Event type definition based on your API response
export interface Event {
  id: number;
  companyId: number;
  formatId: number;
  title: string;
  description: string;
  venue: string;
  locationCoordinates: string;
  startedAt: string;
  endedAt: string;
  publishedAt?: string;
  ticketsAvailableFrom?: string;
  posterName?: string;
  attendeeVisibility: 'EVERYONE' | 'ATTENDEES_ONLY' | 'NOBODY';
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'SALES_STARTED' | 'ONGOING' | 'FINISHED';
  format?: {
    id: number;
    title: string;
  };
  themes?: any; // Can be object or array
  company?: {
    id: number;
    title: string;
    logoName?: string;
  };
  tickets?: Array<{
    id: number;
    eventId: number;
    title: string;
    price: number;
    status: string;
  }>;
  attendeeCount?: number;
}

// Get image URL with correct domain
const getImageUrl = (path) => {
  if (!path) return null;
  
  // Check if path is already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it's a relative path, prepend the backend URL
  const baseUrl = 'http://localhost:8080';
  return `${baseUrl}/uploads/event-posters/${path}`;
};

// Get company logo URL
const getLogoUrl = (path?: string) => {
  if (!path) return null;
  
  // Check if path is already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = 'http://localhost:8080';
  // If it's a relative path, prepend the backend URL
  return `${baseUrl}/uploads/company-logos/${path}`;
};

export default function HomePage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme(); // Use theme context instead of local state
  
  // User authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // State variables
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6); // Default limit
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [venue, setVenue] = useState('');
  // Changed from formatId to formatIds array for multiple format selection
  const [formatIds, setFormatIds] = useState<string[]>([]);
  const [themeIds, setThemeIds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [statuses, setStatuses] = useState<string[]>(['PUBLISHED', 'SALES_STARTED', 'ONGOING']);
  const [activeFilters, setActiveFilters] = useState(0);
  const [activeFormat, setActiveFormat] = useState('all');
  
  // Date range filtering - new state variables
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Sorting state
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid');
  
  // Data for filters
  const [formats, setFormats] = useState<{id: number, title: string}[]>([]);
  const [themes, setThemes] = useState<{id: number, title: string}[]>([]);
  
  // Available format buttons for horizontal scrolling menu
  // We'll populate with dynamic data from API, but have this as fallback
  const [formatButtons, setFormatButtons] = useState([
    { id: 'all', label: 'All Events', icon: <Tag className="w-4 h-4" />, formatId: null },
    { id: 'workshop', label: 'Art workshop', icon: <Palette className="w-4 h-4" />, formatId: 1 },
    { id: 'field-trip', label: 'Field trip', icon: <Globe className="w-4 h-4" />, formatId: 2 },
    { id: 'charity', label: 'Charity event', icon: <Gift className="w-4 h-4" />, formatId: 3 },
    { id: 'craft-fair', label: 'Craft fair', icon: <Briefcase className="w-4 h-4" />, formatId: 4 },
    { id: 'interactive', label: 'Interactive session', icon: <Layers className="w-4 h-4" />, formatId: 5 },
    { id: 'magic', label: 'Magic show', icon: <Sparkles className="w-4 h-4" />, formatId: 6 },
    { id: 'dance', label: 'Dance class', icon: <Music className="w-4 h-4" />, formatId: 7 },
    { id: 'virtual', label: 'Virtual tour', icon: <Monitor className="w-4 h-4" />, formatId: 8 },
    { id: 'cooking', label: 'Cooking class', icon: <Utensils className="w-4 h-4" />, formatId: 9 },
    { id: 'game', label: 'Game night', icon: <Award className="w-4 h-4" />, formatId: 10 },
    { id: 'opera', label: 'Opera', icon: <Mic className="w-4 h-4" />, formatId: 11 },
    { id: 'screening', label: 'Screening', icon: <Film className="w-4 h-4" />, formatId: 12 }
  ]);
  
  // Available statuses and their display names
  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'SALES_STARTED', label: 'Sales Started' },
    { value: 'ONGOING', label: 'Ongoing' },
    { value: 'FINISHED', label: 'Finished' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date: Newest First' },
    { value: 'date-asc', label: 'Date: Oldest First' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'popularity', label: 'Popularity' }
  ];
  
  // Check if user is authenticated
  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  };
  
  // Helper function to apply date filters directly to events
  const applyDateFilter = (events: Event[]) => {
    if (!startDate && !endDate) return events;
    
    return events.filter(event => {
      const eventStart = parseISO(event.startedAt);
      const eventEnd = parseISO(event.endedAt);
      
      if (startDate && endDate) {
        const filterStart = parseISO(startDate);
        const filterEnd = parseISO(endDate);
        // Check if the event overlaps with the date range
        return (
          (isAfter(eventStart, filterStart) || isSameDay(eventStart, filterStart)) &&
          (isBefore(eventEnd, filterEnd) || isSameDay(eventEnd, filterEnd))
        );
      } else if (startDate) {
        const filterStart = parseISO(startDate);
        return isAfter(eventStart, filterStart) || isSameDay(eventStart, filterStart);
      } else if (endDate) {
        const filterEnd = parseISO(endDate);
        return isBefore(eventEnd, filterEnd) || isSameDay(eventEnd, filterEnd);
      }
      
      return true;
    });
  };
  
  // Fetch events with filters and pagination
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Construct query parameters
      const params: any = {
        take: limit,
        skip: (page - 1) * limit
      };
      
      // Add filters if they exist
      if (searchQuery) {
        // Search by title or description
        params.title = searchQuery;
        params.description = searchQuery;
      }
      
      if (venue) params.venue = venue;
      
      // Only add formats param if we have selected format IDs
      if (formatIds.length > 0) {
        params.formats = formatIds.join(',');
      }
      // Don't include an empty formats parameter!
      
      // Theme filtering
      if (themeIds.length > 0) {
        params.themes = themeIds.join(',');
      }
      
      if (minPrice !== '') params.minPrice = minPrice;
      if (maxPrice !== '') params.maxPrice = maxPrice;
      if (statuses.length > 0) params.status = statuses.join(',');
      
      // Date range filtering
      if (startDate) {
        params.startedAt = format(parseISO(startDate), "yyyy-MM-dd'T'00:00:00.000'Z'");
      }
      if (endDate) {
        params.endedAt = format(parseISO(endDate), "yyyy-MM-dd'T'23:59:59.999'Z'");
      }
      
      // Add sorting
      if (sortBy === 'date') {
        params.sortBy = 'startedAt';
        params.sortOrder = 'desc';
      } else if (sortBy === 'date-asc') {
        params.sortBy = 'startedAt';
        params.sortOrder = 'asc';
      } else if (sortBy === 'price-asc') {
        params.sortBy = 'minPrice';
        params.sortOrder = 'asc';
      } else if (sortBy === 'price-desc') {
        params.sortBy = 'minPrice';
        params.sortOrder = 'desc';
      } else if (sortBy === 'popularity') {
        params.sortBy = 'popularity';
        params.sortOrder = 'desc';
      }
      
      // Get auth headers
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Fetching events with params:', params);
      
      // Make API request
      const response = await axios.get(`${API_URL}/events`, {
        params,
        headers
      });
      
      // Update state with response data
      let eventData: Event[] = [];
      if (response.data.items) {
        eventData = response.data.items;
        setTotalEvents(response.data.total);
      } else if (Array.isArray(response.data)) {
        eventData = response.data;
        setTotalEvents(response.data.length);
      } else {
        eventData = [];
        setTotalEvents(0);
      }
      
      setEvents(eventData);
      
      // Set featured event if we have events and no featured event is set yet
      if (eventData.length > 0 && !featuredEvent) {
        // Find an event with SALES_STARTED or PUBLISHED status for featuring
        const featureCandidate = eventData.find(event => 
          event.status === 'SALES_STARTED' || event.status === 'PUBLISHED'
        ) || eventData[0]; // Fallback to the first event if no suitable event is found
        
        setFeaturedEvent(featureCandidate);
      }
      
      console.log('Events fetched successfully:', eventData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events. Please try again later.');
      setEvents([]);
      setTotalEvents(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch formats and themes for filters
  const fetchFiltersData = async () => {
    try {
      // Get auth headers
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch formats
      const formatsResponse = await axios.get(`${API_URL}/formats`, { headers });
      setFormats(formatsResponse.data);
      
      // Update format buttons with real data if available
      if (formatsResponse.data && formatsResponse.data.length > 0) {
        // Map format data to format buttons with appropriate icons
        const getIconForFormat = (title: string) => {
          // Map format titles to appropriate icons
          const formatIconMap = {
            'Workshop': <Palette className="w-4 h-4" />,
            'Art workshop': <Palette className="w-4 h-4" />,
            'Field trip': <Globe className="w-4 h-4" />,
            'Charity event': <Gift className="w-4 h-4" />,
            'Craft fair': <Briefcase className="w-4 h-4" />,
            'Interactive session': <Layers className="w-4 h-4" />,
            'Magic show': <Sparkles className="w-4 h-4" />,
            'Dance class': <Music className="w-4 h-4" />,
            'Virtual tour': <Monitor className="w-4 h-4" />,
            'Cooking class': <Utensils className="w-4 h-4" />,
            'Game night': <Award className="w-4 h-4" />,
            'Opera': <Mic className="w-4 h-4" />,
            'Screening': <Film className="w-4 h-4" />,
            'Conference': <Briefcase className="w-4 h-4" />,
            'Webinar': <Monitor className="w-4 h-4" />,
            'Meetup': <Users className="w-4 h-4" />,
            'Training': <BookOpen className="w-4 h-4" />
          };
          
          return formatIconMap[title] || <Tag className="w-4 h-4" />;
        };
        
        const newFormatButtons = [
          { id: 'all', label: 'All Events', icon: <Tag className="w-4 h-4" />, formatId: null },
          ...formatsResponse.data.map(format => ({
            id: `format-${format.id}`,
            label: format.title,
            icon: getIconForFormat(format.title),
            formatId: format.id
          }))
        ];
        
        setFormatButtons(newFormatButtons);
      }
      
      // Fetch themes
      const themesResponse = await axios.get(`${API_URL}/themes`, { headers });
      setThemes(themesResponse.data);
    } catch (error) {
      console.error('Error fetching filter data:', error);
      // Use fallback data in case of error
      setFormats([
        { id: 1, title: 'Art workshop' },
        { id: 2, title: 'Field trip' },
        { id: 3, title: 'Charity event' },
        { id: 4, title: 'Craft fair' },
        { id: 5, title: 'Interactive session' },
        { id: 6, title: 'Magic show' },
        { id: 7, title: 'Dance class' },
        { id: 8, title: 'Virtual tour' },
        { id: 9, title: 'Cooking class' },
        { id: 10, title: 'Game night' },
        { id: 11, title: 'Opera' },
        { id: 12, title: 'Screening' }
      ]);
      
      setThemes([
        { id: 1, title: 'Technology' },
        { id: 2, title: 'Business' },
        { id: 3, title: 'Web Development' },
        { id: 4, title: 'Marketing' },
        { id: 5, title: 'Health' },
        { id: 6, title: 'Education' },
        { id: 7, title: 'Music' },
        { id: 8, title: 'Art & Culture' },
        { id: 9, title: 'Film & Media' },
        { id: 10, title: 'Photography' },
        { id: 11, title: 'Food & Drinks' }
      ]);
    }
  };
  
 // New effect to handle format changes
useEffect(() => {
  // Don't run on initial render, only when formatIds changes
  if (formatIds !== undefined) {
    setPage(1); // Reset to first page
    fetchEvents();
  }
}, [formatIds]);

// 3. Updated handleFormatChange function
const handleFormatChange = (formatId: string) => {
  // If All Events is selected, clear format selection
  if (formatId === 'all') {
    setFormatIds([]);
    setActiveFormat('all');
  } else {
    // Get the numeric format ID from the button
    const formatButton = formatButtons.find(f => f.id === formatId);
    if (formatButton && formatButton.formatId) {
      // Toggle format selection
      const formatIdStr = formatButton.formatId.toString();
      if (formatIds.includes(formatIdStr)) {
        // If already selected, deselect it
        setFormatIds(formatIds.filter(id => id !== formatIdStr));
        setActiveFormat('all'); // Reset active format since we're deselecting
      } else {
        // Otherwise, add it to selected formats
        setFormatIds([...formatIds, formatIdStr]);
        setActiveFormat(formatId); // Set this format as active
      }
    }
  }
};
  
  // Toggle format selection in dropdown
  const toggleFormat = (formatId: string) => {
    if (formatIds.includes(formatId)) {
      setFormatIds(formatIds.filter(id => id !== formatId));
    } else {
      setFormatIds([...formatIds, formatId]);
    }
    
    // Reset the active format button if formats are selected from the dropdown
    setActiveFormat('all');
  };
  
  // Apply filters and reset pagination
  const applyFilters = () => {
    setPage(1);
    
    // Count active filters
    let count = 0;
    if (venue) count++;
    if (formatIds.length > 0) count++;
    if (themeIds.length > 0) count++;
    if (minPrice !== '' || maxPrice !== '') count++;
    if (statuses.length !== 3) count++; // Default is 3 statuses
    if (startDate || endDate) count++;
    
    setActiveFilters(count);
    
    // Fetch events with filters
    fetchEvents();
    setFilterOpen(false);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setVenue('');
    setFormatIds([]);
    setThemeIds([]);
    setMinPrice('');
    setMaxPrice('');
    setStatuses(['PUBLISHED', 'SALES_STARTED', 'ONGOING']);
    setStartDate('');
    setEndDate('');
    setPage(1);
    setActiveFilters(0);
    setActiveFormat('all');
    // Fetch events with reset filters
    setTimeout(fetchEvents, 0);
  };
  
  // Toggle theme filter selection
  const toggleThemeFilter = (themeId: string) => {
    if (themeIds.includes(themeId)) {
      setThemeIds(themeIds.filter(id => id !== themeId));
    } else {
      setThemeIds([...themeIds, themeId]);
    }
  };
  
  // Toggle status selection
  const toggleStatus = (status: string) => {
    if (statuses.includes(status)) {
      setStatuses(statuses.filter(s => s !== status));
    } else {
      setStatuses([...statuses, status]);
    }
  };
  
  // Handle date filter presets
  const handleDatePreset = (preset: string) => {
    const today = new Date();
    
    switch (preset) {
      case 'today':
        const todayStr = format(today, 'yyyy-MM-dd');
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
        setStartDate(tomorrowStr);
        setEndDate(tomorrowStr);
        break;
      case 'weekend':
        // Find the next Saturday and Sunday
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + (6 - today.getDay()));
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        setStartDate(format(saturday, 'yyyy-MM-dd'));
        setEndDate(format(sunday, 'yyyy-MM-dd'));
        break;
      case 'thisWeek':
        // This week is from today to next 7 days
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(nextWeek, 'yyyy-MM-dd'));
        break;
      case 'nextWeek':
        // Next week is from 7 days from now to 14 days from now
        const startNextWeek = new Date(today);
        startNextWeek.setDate(today.getDate() + 7);
        const endNextWeek = new Date(today);
        endNextWeek.setDate(today.getDate() + 14);
        setStartDate(format(startNextWeek, 'yyyy-MM-dd'));
        setEndDate(format(endNextWeek, 'yyyy-MM-dd'));
        break;
    }
  };
  
  // Calculate the lowest available ticket price
  const getLowestPrice = (event: Event) => {
    if (!event.tickets || event.tickets.length === 0) {
      return 'Price not available';
    }
    
    const availableTickets = event.tickets;
    // .filter(ticket => 
    //   ticket.status === 'AVAILABLE'
    // );
    console.log('vot tyt',availableTickets);
    if (availableTickets.length === 0) {
      return 'Sold out';
    }
    
    const lowestPrice = Math.min(...availableTickets.map(ticket => ticket.price));
    
    if (lowestPrice === 0) {
      return 'Free';
    }
    
    return `$${lowestPrice.toFixed(2)}`;
  };
  
  // Handle pagination
  const goToPage = (newPage: number) => {
    setPage(newPage);
  };
  
  // Format date for display
  const formatEventDate = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (isSameDay(start, end)) {
      return format(start, 'MMM d, yyyy');
    } else {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
  };
  
  // Format date with day of week
  const formatEventDateWithDay = (startDate: string) => {
    const date = parseISO(startDate);
    return format(date, 'E, MMM d');
  };
  
  // Format time
  const formatEventTime = (startDate: string) => {
    const date = parseISO(startDate);
    return format(date, 'h:mm a');
  };

  // Get event badge color based on status
  const getStatusBadgeStyle = (status: string) => {
    switch(status) {
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30';
      case 'CANCELLED':
        return 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30';
      case 'ONGOING':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30';
      case 'SALES_STARTED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30';
      case 'FINISHED':
        return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      default:
        return 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30';
    }
  };

  // Handle search input and Enter key
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1); // Reset to first page when sorting changes
    
    // Fetch events with new sort
    setTimeout(() => {
      fetchEvents();
    }, 0);
  };
  
  // Effect to fetch events on component mount and when pagination changes
  useEffect(() => {
    fetchEvents();
  }, [page, limit]); // Only depend on pagination changes
  
  // Effect to fetch filter data and check authentication on component mount
  useEffect(() => {
    fetchFiltersData();
    checkAuthentication();
  }, []);
  
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Head>
        <title>uevent - Discover Events & Connect</title>
        <meta name="description" content="Find exciting events, connect with like-minded people, and make the most of your time" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Main Content */}
      <div className="pl-16 md:pl-20">
        {/* Filter Drawer Overlay */}
        <div 
          className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
            filterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setFilterOpen(false)}
        ></div>
        
        {/* Filter Drawer */}
        <div 
          className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-black shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
            filterOpen ? 'translate-x-0' : 'translate-x-full'
          } p-6 overflow-y-auto border-l border-gray-100 dark:border-gray-800`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Reset all
              </button>
              <button 
                onClick={() => setFilterOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Date Range */}
            <div>
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Date Range</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">From</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">To</label>
                  <input 
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => handleDatePreset('today')}
                >
                  Today
                </button>
                <button 
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => handleDatePreset('tomorrow')}
                >
                  Tomorrow
                </button>
                <button 
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => handleDatePreset('weekend')}
                >
                  This weekend
                </button>
                <button 
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => handleDatePreset('thisWeek')}
                >
                  This week
                </button>
                <button 
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => handleDatePreset('nextWeek')}
                >
                  Next week
                </button>
              </div>
            </div>
            
            {/* Location filter */}
            <div>
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Location</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter venue name or city"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
                <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">
                  Near me
                </button>
                <button className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">
                  Online events
                </button>
              </div>
            </div>
            
            {/* Format filter - updated to use checkboxes like themes */}
            <div>
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Formats</h3>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {formats.map(format => (
                  <label key={format.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formatIds.includes(format.id.toString())}
                      onChange={() => toggleFormat(format.id.toString())}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-700 rounded"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-200">{format.title}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Price range filter */}
            <div>
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Price Range</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    className="pl-7 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? parseFloat(e.target.value) : '')}
                    min={0}
                  />
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="pl-7 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : '')}
                    min={0}
                  />
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    setMinPrice(0);
                    setMaxPrice(0);
                  }}
                >
                  Free
                </button>
                <button 
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    setMinPrice(0);
                    setMaxPrice(25);
                  }}
                >
                  Under $25
                </button>
                <button 
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    setMinPrice(25);
                    setMaxPrice(50);
                  }}
                >
                  $25 - $50
                </button>
                <button 
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    setMinPrice(50);
                    setMaxPrice('');
                  }}
                >
                  $50+
                </button>
              </div>
            </div>
            
            {/* Theme filter */}
            <div>
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Themes</h3>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {themes.map(theme => (
                  <label key={theme.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={themeIds.includes(theme.id.toString())}
                      onChange={() => toggleThemeFilter(theme.id.toString())}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-700 rounded"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-200">{theme.title}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Status filter */}
            <div>
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Status</h3>
              <div className="space-y-2">
                {statusOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={statuses.includes(option.value)}
                      onChange={() => toggleStatus(option.value)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-700 rounded"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Apply filters button */}
            <button
              onClick={applyFilters}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">
          {/* Hero Section with Featured Event */}
          {featuredEvent && (
            <section className="mb-12">
              <div className="rounded-2xl overflow-hidden relative bg-white dark:bg-black border border-gray-100 dark:border-gray-800">
                <div className="md:flex">
                  <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center mb-4">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        Featured Event
                      </span>
                      {featuredEvent.format && (
                        <span className="ml-2 px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                          {featuredEvent.format.title}
                        </span>
                      )}
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 max-w-lg text-gray-900 dark:text-white">
                      {featuredEvent.title}
                    </h1>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg">
                      {featuredEvent.description}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-200">{formatEventDate(featuredEvent.startedAt, featuredEvent.endedAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-200">{featuredEvent.venue}</span>
                      </div>
                      {featuredEvent.attendeeCount && (
                        <div className="flex items-center">
                          <Users className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-200">{featuredEvent.attendeeCount} attending</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link 
                        href={`/events/${featuredEvent.id}`}
                        className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-colors text-center"
                      >
                        View Event
                      </Link>
                      <button className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="md:w-1/2 h-64 md:h-auto">
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-emerald-700 dark:from-emerald-700 dark:to-emerald-900 relative">
                      {featuredEvent.posterName ? (
                        <img 
                          src={getImageUrl(featuredEvent.posterName)} 
                          alt={featuredEvent.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 overflow-hidden opacity-20">
                            <svg viewBox="0 0 800 800" className="absolute h-full w-full">
                              <defs>
                                <pattern id="dots-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                                  <circle id="dot-pattern" cx="10" cy="10" r="2" fill="white"></circle>
                                </pattern>
                              </defs>
                              <rect width="800" height="800" fill="url(#dots-pattern)"></rect>
                            </svg>
                          </div>
                          
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <span className="text-6xl font-bold text-white opacity-40">{featuredEvent.title.charAt(0)}</span>
                          </div>
                        </>
                      )}
                      
                      <div className="absolute bottom-6 right-6 bg-white dark:bg-black rounded-lg p-3 shadow-lg">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{getLowestPrice(featuredEvent)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
          
          {/* Format Filter Buttons */}
          <section className="mb-8 overflow-x-auto scrollbar-hidden">
            <div className="flex space-x-2 pb-2">
            {formatButtons.map(formatBtn => {
  // Determine if this button is currently active
  const isActive = 
    formatBtn.id === 'all' 
      ? formatIds.length === 0 
      : formatBtn.formatId && formatIds.includes(formatBtn.formatId.toString());
  
  return (
    <button
      key={formatBtn.id}
      className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-full transition-colors ${
        isActive
          ? 'bg-emerald-600 text-white'
          : 'bg-white dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}
      onClick={() => handleFormatChange(formatBtn.id)}
    >
      {formatBtn.icon}
      <span>{formatBtn.label}</span>
    </button>
  );
})}
            </div>
          </section>
          
          {/* Event List Header */}
          <section className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatIds.length === 0 
                    ? 'Upcoming Events' 
                    : `${formatIds.length === 1 ? formats.find(f => f.id.toString() === formatIds[0])?.title || 'Events' : `${formatIds.length} formats selected`}`}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Showing {events.length} of {totalEvents} events
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select 
                      className="appearance-none bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {/* Filter button */}
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="p-2.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                  >
                    <Filter className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    {activeFilters > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center">
                        {activeFilters}
                      </span>
                    )}
                  </button>
                </div>
                
                <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button 
                    className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-black text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                    </svg>
                  </button>
                  <button 
                    className={`p-2 ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-black text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setViewMode('list')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-gray-700 dark:text-gray-300">Loading events...</p>
            </div>
          )}
          
          {/* Error state */}
          {error && !isLoading && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-red-700 dark:text-red-300 mb-6 border border-red-100 dark:border-red-800/30">
              <p className="font-medium">{error}</p>
              <button 
                onClick={fetchEvents}
                className="mt-2 text-sm font-medium text-red-800 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          )}
          
          {/* No results state */}
          {!isLoading && !error && events.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="inline-block p-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">No events found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Try adjusting your filters or search terms to find what you're looking for
              </p>
              <button
                onClick={resetFilters}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium"
              >
                Reset all filters
              </button>
            </div>
          )}
          
          {/* Events Grid View */}
          {!isLoading && !error && events.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <Link 
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group block rounded-xl overflow-hidden bg-white dark:bg-black border border-gray-100 dark:border-gray-800 transition-all hover:shadow-lg"
                >
                  {/* Event image */}
                  <div className="h-48 relative overflow-hidden">
                    {event.posterName ? (
                      <img 
                        src={getImageUrl(event.posterName)} 
                        alt={event.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-700 dark:to-emerald-900 transform group-hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-bold text-white opacity-40">{event.title.charAt(0)}</span>
                        </div>
                        
                        <div className="absolute inset-0 overflow-hidden opacity-20">
                          <svg viewBox="0 0 800 800" className="absolute h-full w-full">
                            <defs>
                              <pattern id="dots-pattern-card" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                                <circle id="dot-pattern-card" cx="10" cy="10" r="2" fill="white"></circle>
                              </pattern>
                            </defs>
                            <rect width="800" height="800" fill="url(#dots-pattern-card)"></rect>
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeStyle(event.status)}`}>
                        {event.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Save button */}
                    <button className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm hover:bg-white dark:hover:bg-black text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Event details */}
                  <div className="p-5">
                    {/* Date */}
                    <div className="flex items-center mb-3 text-sm text-emerald-600 dark:text-emerald-400">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      <span>{formatEventDate(event.startedAt, event.endedAt)}</span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {event.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      {/* Venue */}
                      <div className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                      
                      {/* Format tag */}
                      {event.format && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                          {event.format.title}
                        </span>
                      )}
                    </div>
                    
                    {/* Price and attendance */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getLowestPrice(event)}
                      </div>
                      
                      {event.attendeeCount && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Users className="w-4 h-4 mr-1.5" />
                          <span>{event.attendeeCount} attending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* Events List View */}
          {!isLoading && !error && events.length > 0 && viewMode === 'list' && (
            <div className="space-y-4">
              {events.map(event => (
                <Link 
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex flex-col sm:flex-row rounded-xl overflow-hidden bg-white dark:bg-black border border-gray-100 dark:border-gray-800 transition-all hover:shadow-lg"
                >
                  {/* Event Date */}
                  <div className="sm:w-24 md:w-32 flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/30 p-4 flex flex-col items-center justify-center text-emerald-800 dark:text-emerald-200">
                    <span className="text-lg md:text-xl font-bold">
                      {format(parseISO(event.startedAt), 'd')}
                    </span>
                    <span className="text-sm md:text-base">
                      {format(parseISO(event.startedAt), 'MMM')}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      {format(parseISO(event.startedAt), 'E')}
                    </span>
                  </div>
                  
                  {/* Event Content */}
                  <div className="flex-grow p-4 md:p-5 flex flex-col sm:flex-row gap-4">
                    {/* Event details */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(event.status)}`}>
                          {event.status.replace('_', ' ')}
                        </span>
                        {event.format && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                            {event.format.title}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {event.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1.5" />
                          <span>{formatEventTime(event.startedAt)}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mr-1.5" />
                          <span className="line-clamp-1">{event.venue}</span>
                        </div>
                        
                        {event.attendeeCount && (
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <Users className="w-4 h-4 mr-1.5" />
                            <span>{event.attendeeCount} attending</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Price and actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <div className="font-medium text-lg text-gray-900 dark:text-white">
                        {getLowestPrice(event)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                          <Bookmark className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {!isLoading && totalEvents > limit && (
            <div className="mt-10 flex justify-center">
              <nav className="flex items-center" aria-label="Pagination">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="mr-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, Math.ceil(totalEvents / limit)) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => goToPage(pageNumber)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          pageNumber === page 
                            ? 'bg-emerald-600 text-white font-medium' 
                            : 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  {Math.ceil(totalEvents / limit) > 5 && (
                    <>
                      <span className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400">...</span>
                      <button
                        onClick={() => goToPage(Math.ceil(totalEvents / limit))}
                        className="w-10 h-10 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {Math.ceil(totalEvents / limit)}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= Math.ceil(totalEvents / limit)}
                  className="ml-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}