'use client'; // Add this line to make it a Client Component

import Link from "next/link";
import { useState, useEffect } from 'react';

// Define the expected type for user data from the /api/user/r-all endpoint
interface UserInfo {
  id: number;
  email: string;
  name?: string;
  userrank: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Define the expected type for the API error response
interface ApiErrorResponse {
  error: string;
  details?: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false); // State to control table visibility

  // State for the update modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentUserToUpdate, setCurrentUserToUpdate] = useState<UserInfo | null>(null);
  const [updateFormData, setUpdateFormData] = useState<Partial<UserInfo>>({}); // State for form inputs
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Optional: Fetch current user info to potentially hide/show elements based on rank
  // This is similar to the logic in src/app/page.tsx
  const [currentUser, setCurrentUser] = useState<any>(null); // Use 'any' or define a specific type if needed
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/jwt');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data);
        } else {
          const errorData: ApiErrorResponse = await response.json();
          setUserError(errorData.error || 'Failed to fetch current user info');
          setCurrentUser(null);
        }
      } catch (err: any) {
        console.error('Error fetching current user info:', err);
        setUserError('An unexpected error occurred.');
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, []);


  const handleListAllUsers = async () => {
    setLoading(true);
    setError(null);
    setUsers([]); // Clear previous results
    setShowTable(true); // Show the table area

    try {
      const response = await fetch('/api/user/r-all');
      const data: UserInfo[] | ApiErrorResponse = await response.json(); // Cast data to expected types

      if (response.ok) {
        setUsers(data as UserInfo[]); // Cast again for state update if needed, though TypeScript should infer from the above line
      } else {
        // Handle API errors (e.g., 401 Unauthorized, 403 Forbidden)
        setError((data as ApiErrorResponse).error || 'Failed to fetch users.');
        setUsers([]); // Ensure users list is empty on error
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('An unexpected error occurred while fetching users.');
      setUsers([]); // Ensure users list is empty on error
    } finally {
      setLoading(false);
    }
  };

  // Function to open the update modal and populate the form
  const openUpdateModal = (user: UserInfo) => {
    setCurrentUserToUpdate(user);
    // Initialize form data with current user info, excluding sensitive/non-editable fields
    setUpdateFormData({ id: user.id, name: user.name, userrank: user.userrank, is_active: user.is_active });
    setIsUpdateModalOpen(true);
  };

  // Function to close the update modal
  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setCurrentUserToUpdate(null);
    setUpdateFormData({});
    setUpdateError(null);
  };

  // Handle form input changes in the modal
  const handleUpdateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setUpdateFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle the update form submission
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserToUpdate) return;

    setUpdateLoading(true);
    setUpdateError(null);
  
    try {
      const response = await fetch('/api/user/u', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateFormData),
      });
  
      const result: UserInfo | ApiErrorResponse = await response.json();
  
      if (response.ok) {
        closeUpdateModal();
        alert('User updated successfully!');
        // Refresh the user list after alert is dismissed
        await handleListAllUsers(); 
      } else {
        setUpdateError((result as ApiErrorResponse).error || 'Failed to update user.');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setUpdateError('An unexpected error occurred during update.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Optional: Function to handle logout (can be added if needed on admin page)
  // const handleLogout = async () => { /* ... logout logic ... */ };


  // Optional: Render a message or redirect if the user is not an admin
  if (!loadingUser && (!currentUser || currentUser.userrank !== 3)) {
      return (
          <div className="container mx-auto px-4 py-8 text-center">
              <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
              <p className="text-gray-700">You do not have the necessary permissions to view this page.</p>
              <Link href="/" passHref>
                  <button className="mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
                      Go to Home
                  </button>
              </Link>
          </div>
      );
  }


  return (
    <div>
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          {/* Site Title or Logo */}
          <div className="text-2xl font-bold">
            Admin Panel
          </div>

          {/* Navigation Links/Buttons */}
          <div className="flex items-center space-x-4">
            {/* Link back to Home */}
            <Link href="/" passHref>
              <span className="text-white hover:underline cursor-pointer">Home</span>
            </Link>

            {/* List All Users Button */}
            <button
              onClick={handleListAllUsers}
              className="bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 disabled:opacity-50"
              disabled={loading} // Disable button while loading
            >
              {loading ? 'Loading Users...' : 'List All Users'}
            </button>

            {/* Optional: Add other admin buttons here (e.g., Logout) */}
             {/* {currentUser && (
                 <button
                   onClick={handleLogout}
                   className="bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-300"
                 >
                   Logout
                 </button>
             )} */}
          </div>
        </div>
      </nav>

      {/* Main Content - User List */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">User Management</h1>

        {/* Display loading, error, or table */}
        {loading && <p className="text-center text-blue-600">Loading users...</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {showTable && !loading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">ID</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Name</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Rank</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Active</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Created At</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Updated At</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Actions</th> {/* New Actions header */}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-sm text-gray-700">{user.id}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-700">{user.email}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-700">{user.name || '-'}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-700">{user.userrank}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-700">{user.is_active ? 'Yes' : 'No'}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-700">{new Date(user.created_at).toLocaleString()}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-700">{new Date(user.updated_at).toLocaleString()}</td>
                    <td className="py-2 px-4 border-b text-sm text-gray-700">
                      <button
                        onClick={() => openUpdateModal(user)}
                        className="bg-yellow-500 text-white font-semibold py-1 px-3 rounded-md shadow-sm hover:bg-yellow-600 transition duration-300"
                      >
                        Update
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                            try {
                              const response = await fetch(`/api/user/d`, {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ id: user.id }),
                              });
                              if (response.ok) {
                                alert('User deleted successfully!');
                                await handleListAllUsers(); // Refresh the user list
                              } else {
                                alert('Failed to delete user.');
                              }
                            } catch (err) {
                              console.error('Error deleting user:', err);
                              alert('An unexpected error occurred while deleting the user.');
                            }
                          }
                        }}
                        className="bg-red-500 text-white font-semibold py-1 px-3 rounded-md shadow-sm hover:bg-red-600 transition duration-300 ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showTable && !loading && !error && users.length === 0 && (
             <p className="text-center text-gray-600">No users found.</p>
        )}

      </div>

      {/* Update User Modal */}
      {isUpdateModalOpen && currentUserToUpdate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Update User: {currentUserToUpdate.email}</h2>
            {updateError && <p className="text-red-600 mb-4">Error: {updateError}</p>}
            <form onSubmit={handleUpdateSubmit}>
              {/* Example form fields - add more as needed */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={updateFormData.name || ''}
                  onChange={handleUpdateFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userrank">User Rank:</label>
                 {/* Consider using a select dropdown for userrank */}
                <input
                  type="number"
                  id="userrank"
                  name="userrank"
                  value={updateFormData.userrank ?? ''}
                  onChange={handleUpdateFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
               <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="is_active">Is Active:</label>
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={updateFormData.is_active ?? false}
                  onChange={handleUpdateFormChange}
                  className="mr-2 leading-tight"
                />
              </div>
              {/* Add other fields like password (with caution), etc. */}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}