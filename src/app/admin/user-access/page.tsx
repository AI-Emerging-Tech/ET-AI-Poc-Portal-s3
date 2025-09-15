"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Select from "react-select";
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from "../../../services/apiRequestService";
interface PocOption {
  value: string;
  label: string;
}

interface User {
  user_id: string; 
  name?: string;
  email: string;
  company?: string;
  user_roles: string[];
  status: string;
  accessLevel: string;
  accessStartTime?: string;
  accessEndTime?: string;
  pageAccess?: Record<string, string>;
}

const ROLES = ["ADMINISTRATOR", "DEVELOPER", "VIEWER"];
const ACCESS_LEVELS = ["full", "partial", "view-only"];
const TIMEZONES = [
  { value: "America/New_York", label: "ET" },
  { value: "America/Chicago", label: "CT" },
  { value: "America/Los_Angeles", label: "PT" },
  { value: "Asia/Kolkata", label: "IST" },
];

// Utility to convert a local time in a specific timezone to UTC time
function convertLocalToUTC(timeString: string, timezone: string): string {
  if (!timeString) return "";
  
  try {
    // Create a date object for today
    const now = new Date();
    const [hours, minutes] = timeString.includes('T') ? timeString.split('T')[1].split(':').map(Number) : timeString.split(':').map(Number);

    // Create a date object representing the time in the specified timezone
    // This uses a different approach that's more reliable
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Get current date in target timezone
    const parts = formatter.formatToParts(now);
    const tzDate: Record<string, string> = {};
    
    parts.forEach(part => {
      if (part.type !== 'literal') {
        tzDate[part.type] = part.value;
      }
    });
    
    // Set the time components while keeping the date in the target timezone
    const localDate = new Date(
      `${tzDate.year}-${tzDate.month}-${tzDate.day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
    );
    
    // Convert to UTC
    const utcHours = localDate.getUTCHours();
    const utcMinutes = localDate.getUTCMinutes();
    
    return `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
  } catch (error) {
    console.error("Error converting time to UTC:", error);
    return "";
  }
}

// Utility to convert a UTC time to local time in a specific timezone
function convertUTCToLocal(utcTimeString: string, timezone: string): string {
  // 1970-01-01T15:53:00.000Z
  console.log("utcTimeString", utcTimeString);
  if (!utcTimeString) return "";
  
  try {
    // Parse UTC time
    const [hours, minutes] = utcTimeString.includes('T') ? utcTimeString.split('T')[1].split(':').map(Number) : [null, null];
    console.log("hours", hours);
    console.log("minutes", minutes);
    if (hours === null || minutes === null) return utcTimeString;
    // Create a date object representing the time in UTC
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    console.log("date", date);
    // Format in the target timezone
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone || "America/New_York"
    });
  } catch (error) {
    console.error("Error converting UTC time to local:", error);
    return "";
  }
}

// Validate access time range
function validateTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return true;
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  // Compare hours first
  if (endHours > startHours) return true;
  // If hours are equal, compare minutes
  if (endHours === startHours && endMinutes > startMinutes) return true;
  
  return false;
}

export default function UserAccessAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState<string | number | null>(null); // Track which user is being saved
  const [deleteLoading, setDeleteLoading] = useState<string | number | null>(null); // Track which user is being deleted
  const [confirmDelete, setConfirmDelete] = useState<string | number | null>(null); // Track which user is pending confirmation
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pocOptions, setPocOptions] = useState<PocOption[]>([]);
  const [tzMap, setTzMap] = useState<Record<string | number, string>>({}); // userId -> tz
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    role: "",
    accessLevel: "",
  });

  useEffect(() => {
    if (!session || session.user.role !== "ADMINISTRATOR") {
      setLoading(false);
      router.push('/')
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch users with authentication
        const userData = await makeAuthenticatedRequest("/api/admin/getAllUsers");
        setUsers(userData);
        console.log("userData", userData);
        
        // Default all users to ET for display if not set
        const map: Record<string | number, string> = {};
        userData.forEach((u: User) => {
          const userId = u.user_id;
          if (userId) {
            map[userId] = "America/New_York";
          }
        });
        setTzMap(map);

        // Fetch PoCs for dropdown (this might not need auth)
        try {
          const pocResponse = await fetch("/api/getPocs");
          if (pocResponse.ok) {
            const pocData = await pocResponse.json();
            setPocOptions(
              pocData.map((poc: any) => ({
                value: poc.path,
                label: poc.metadata?.title || poc.path,
              }))
            );
          }
        } catch (pocError) {
          console.warn("Failed to fetch PoCs:", pocError);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleChange = (id: string | number, field: keyof User, value: any) => {
    setUsers((prev) =>
      prev.map((u) => 
        (u.user_id === id) ? { ...u, [field]: value } : u
      )
    );
    if (field === "user_roles") {
      if (value.includes("ADMINISTRATOR") || value.includes("DEVELOPER")) {
        handleChange(id, "accessLevel", "full");
      } else {
        handleChange(id, "accessLevel", "view-only");
      }
    }
  };

  const handleSave = async (user: User) => {
    setError("");
    setSuccess("");
    
    // Get the user's selected timezone
    const tz = tzMap[user.user_id] || "America/New_York";
    
    // Validate time range if partial access is selected
    // if (user.accessLevel === "partial" && 
    //     user.accessStartTime && 
    //     user.accessEndTime && 
    //     !validateTimeRange(user.accessStartTime, user.accessEndTime)) {
    //   setError("End time must be after start time");
    //   return;
    // }
    
    // Clear time and page restrictions if not using partial access
    const updatedUser = { ...user };
    
    if (updatedUser.accessLevel !== "partial") {
      updatedUser.accessStartTime = "";
      updatedUser.accessEndTime = "";
      updatedUser.pageAccess = {};
    }
    
    // Convert access times to UTC before sending to API
    const accessStartTimeUTC = updatedUser.accessStartTime 
      ? convertLocalToUTC(updatedUser.accessStartTime, tz)
      : "";
    
    const accessEndTimeUTC = updatedUser.accessEndTime
      ? convertLocalToUTC(updatedUser.accessEndTime, tz)
      : "";
    
    // Set loading state for this specific user
    setSaveLoading(user.user_id);
    
    try {
      const result = await makeAuthenticatedRequest("/api/admin/updateUserAccess", {
        method: "POST",
        body: JSON.stringify({
          id: user.user_id, // Use user_id for AWS backend
          roles: updatedUser.user_roles, // Send roles array
          accessLevel: updatedUser.accessLevel,
          accessStartTime: accessStartTimeUTC,
          accessEndTime: accessEndTimeUTC,
          pageAccess: updatedUser.pageAccess,
        }),
      });
      
      // Update the local state with the new values
      setUsers(prev => 
        prev.map(u => (u.user_id === user.user_id) ? updatedUser : u)
      );
      
      setSuccess("Changes saved successfully!");
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      console.error("Error saving user:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaveLoading(null);
    }
  };

  // Handle user deletion with improved confirmation
  const handleDeleteUser = async (user: User) => {
    // If this is the first click, just mark for confirmation
    if (confirmDelete !== user.user_id) {
      setConfirmDelete(user.user_id);
      
      // Auto-reset confirmation after 5 seconds
      setTimeout(() => {
        setConfirmDelete(null);
      }, 5000);
      
      return;
    }
    
    // This is the confirmation click - proceed with deletion
    setConfirmDelete(null);
    setDeleteLoading(user.user_id);
    setError("");
    setSuccess("");
    
    try {
      const result = await makeAuthenticatedRequest(`/api/admin/deleteUser`, {
        method: "POST",
        body: JSON.stringify({ id: user.user_id }), // Use user_id for AWS backend
      });
      
      setUsers((prev) => prev.filter((u) => 
        (u.user_id !== user.user_id)
      ));
      setSuccess(`User ${user.email} deleted successfully`);
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filter users based on search term and active filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());    
    const matchesRoleFilter = !activeFilters.role || 
      (user.user_roles && user.user_roles.includes(activeFilters.role))
    const matchesAccessFilter = !activeFilters.accessLevel || user.accessLevel === activeFilters.accessLevel;
    
    return matchesSearch && matchesRoleFilter && matchesAccessFilter;
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary-light opacity-50 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  if (session && session.user.role !== "ADMINISTRATOR")
    return (
      <div className="glass-card my-8 mx-auto max-w-lg p-8 text-center">
        <div className="text-error text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-error mb-2">Access Denied</h1>
        <p className="text-medium-gray">You don't have permission to access this admin page.</p>
        <button 
          onClick={() => router.push('/')}
          className="btn-ai mt-6"
        >
          Return to Home
        </button>
      </div>
    );

  return (
    <div className="max-w-8xl mx-auto p-8 max-sm:p-4 animate-[fadeIn_0.3s_ease-in]">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 relative">
      <div className="absolute inset-0 pattern-circuit opacity-[0.03] pointer-events-none"></div>
        <h1 className="text-3xl font-bold mb-6 text-gradient flex items-center gap-3">
          <span className="inline-block bg-primary text-white rounded-full p-2 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
        User Access Management
      </h1>
        <p className="text-medium-gray mb-6">Manage user roles, access levels, and specific permissions for PoCs.</p>
        
        {/* Controls section */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-normal"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex max-sm:flex-col gap-3">
            <select
              id="role-filter"
              name="role-filter"
              value={activeFilters.role}
              onChange={(e) => setActiveFilters({...activeFilters, role: e.target.value})}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-normal"
            >
              <option value="">All Roles</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            
            <select
              id="access-level-filter"
              name="access-level-filter"
              value={activeFilters.accessLevel}
              onChange={(e) => setActiveFilters({...activeFilters, accessLevel: e.target.value})}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-normal"
            >
              <option value="">All Access Levels</option>
              {ACCESS_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border-l-4 border-error text-error p-4 mb-6 rounded shadow animate-[fadeIn_0.3s_ease-in] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-success text-success p-4 mb-6 rounded shadow animate-[fadeIn_0.3s_ease-in] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}
      </div>

      {/* User list table */}
      <div className="ai-card min-h-[60vh] overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto min-h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
          <thead>
              <tr className="bg-gradient-to-r from-primary/10 to-primary-light/10">
                <th className="px-6 py-4 text-left text-xs font-medium text-primary-dark uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-primary-dark uppercase tracking-wider">Email</th>
                {/* <th className="px-6 py-4 text-left text-xs font-medium text-primary-dark uppercase tracking-wider">Company</th> */}
                <th className="px-6 py-4 text-left text-xs font-medium text-primary-dark uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-primary-dark uppercase tracking-wider">Access Level</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-primary-dark uppercase tracking-wider">Access Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-primary-dark uppercase tracking-wider">Page Access</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-primary-dark uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-medium-gray">
                    <div className="flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg">No users found matching your filters</p>
                      <button 
                        onClick={() => {
                          setSearchTerm("");
                          setActiveFilters({ role: "", accessLevel: "" });
                        }}
                        className="mt-4 text-primary hover:text-primary-dark focus:outline-none"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
              <tr
                key={user.user_id}
                className={
                      "transition-colors duration-normal hover:bg-primary-light/5 " +
                      (idx % 2 === 0 ? "bg-white" : "bg-gray-50")
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-dark-gray">
                      {user.name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-primary">
                      {user.email}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-medium-gray">
                      {user.company}
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                  <select
                        className="form-select w-full rounded border-gray-200 text-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-fast"
                    value={user.user_roles?.[0] || 'VIEWER'}
                    onChange={(e) => {
                      handleChange(user.user_id, "user_roles", [e.target.value]);
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                  <select
                        className="form-select w-full rounded border-gray-200 text-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-fast"
                    value={user.accessLevel || "full"}
                    onChange={(e) => handleChange(user.user_id, "accessLevel", e.target.value)}
                  >
                    {ACCESS_LEVELS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      disabled={user.accessLevel !== "partial"}
                          className={`border rounded px-2 py-1.5 text-sm focus:ring focus:ring-primary/20 focus:border-primary transition-all duration-fast ${
                            user.accessLevel !== "partial" ? "bg-gray-100 text-gray-400" : "bg-white"
                          }`}
                      value={convertUTCToLocal(user.accessStartTime, tzMap[user.user_id])}
                      onChange={(e) => handleChange(user.user_id, "accessStartTime", e.target.value)}
                    />
                    <span className="mx-1 text-gray-400">-</span>
                    <input
                      type="time"
                      disabled={user.accessLevel !== "partial"}
                          className={`border rounded px-2 py-1.5 text-sm focus:ring focus:ring-primary/20 focus:border-primary transition-all duration-fast ${
                            user.accessLevel !== "partial" ? "bg-gray-100 text-gray-400" : "bg-white"
                          }`}
                      value={convertUTCToLocal(user.accessEndTime, tzMap[user.user_id])}
                      onChange={(e) => handleChange(user.user_id, "accessEndTime", e.target.value)}
                    />
                    <Select
                      options={TIMEZONES}
                      isDisabled={user.accessLevel !== "partial"}
                      value={TIMEZONES.find((tz) => tz.value === tzMap[user.user_id])}
                      onChange={(opt) => setTzMap((prev) => ({ ...prev, [user.user_id]: opt?.value || "America/New_York" }))}
                          className={`w-20 ml-2 ${user.accessLevel !== "partial" ? "opacity-60" : ""}`}
                      classNamePrefix="react-select"
                      isSearchable={false}
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: '#e5e7eb',
                              boxShadow: 'none',
                              '&:hover': {
                                borderColor: '#d1d5db'
                              }
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isSelected 
                                ? 'var(--color-primary)' 
                                : state.isFocused 
                                  ? 'var(--color-primary-light)' 
                                  : base.backgroundColor,
                              color: state.isSelected ? 'white' : state.isFocused ? 'white' : 'inherit'
                            })
                          }}
                    />
                  </div>
                </td>
                    <td className="px-6 py-4 min-w-[220px]">
                  <Select
                    isMulti
                    isDisabled={user.accessLevel !== "partial"}
                    options={pocOptions}
                    value={
                      pocOptions.filter(
                        (opt) => user.pageAccess && user.pageAccess[opt.value] === "full"
                      )
                    }
                    placeholder="Select PoCs..."
                    onChange={(selected) => {
                      // Set selected PoCs as full, others as view-only
                      const newPageAccess: Record<string, string> = {};
                      pocOptions.forEach((opt) => {
                        if (selected.some((s: any) => s.value === opt.value)) {
                          newPageAccess[opt.value] = "full";
                        }
                      });
                      handleChange(user.user_id, "pageAccess", newPageAccess);
                    }}
                    classNamePrefix="react-select"
                        className={user.accessLevel !== "partial" ? "opacity-60" : ""}
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#e5e7eb',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#d1d5db'
                            }
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: 'var(--color-primary-light)',
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: 'var(--color-primary-dark)',
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: 'var(--color-primary-dark)',
                            ':hover': {
                              backgroundColor: 'var(--color-primary)',
                              color: 'white',
                            },
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected 
                              ? 'var(--color-primary)' 
                              : state.isFocused 
                                ? 'var(--color-primary-light)' 
                                : base.backgroundColor,
                            color: state.isSelected ? 'white' : state.isFocused ? 'white' : 'inherit'
                          })
                        }}
                  />
                </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                  <button
                          className={`btn-ai py-1.5 px-4 text-sm flex items-center gap-1 ${saveLoading === user.user_id ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={() => handleSave(user)}
                    disabled={saveLoading === user.user_id}
                  >
                          {saveLoading === user.user_id ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                    Save
                  </button>
                  <button
                    className={`${
                      confirmDelete === user.user_id 
                        ? 'bg-red-600 hover:bg-red-800' 
                        : 'bg-red-500 hover:bg-red-700'
                    } text-white py-1.5 px-2 rounded shadow transition-colors duration-normal flex items-center justify-center ${
                      deleteLoading === user.user_id ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    onClick={() => handleDeleteUser(user)}
                    disabled={deleteLoading === user.user_id}
                  >
                    {deleteLoading === user.user_id ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : confirmDelete === user.user_id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                      </div>
                </td>
              </tr>
                ))
              )}
          </tbody>
        </table>
        </div>
        {users.length > 0 && filteredUsers.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-medium-gray">
            Showing {filteredUsers.length} of {users.length} total users
          </div>
        )}
      </div>
    </div>
  );
}
