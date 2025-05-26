'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import Link from 'next/link';

interface LendingWithBookData {
  lending_id: number;
  user_id: number;
  book_id: number;
  borrowed_date: string;
  due_date: string; // Added due_date based on previous context
  returned_date: string | null;
  status: string;
  book_title: string;
  book_author: string;
  book_publication_year: number;
  book_isbn: string;
  book_genre: string;
  book_stock: number;
  book_is_available: boolean;
}

interface UpdateApiResponse {
  message?: string;
  error?: string;
}

// Define interface for fetch error response
interface FetchErrorResponse {
  error?: string;
}

interface SuccessResponse {
  data: LendingWithBookData[];
  message?: string; // message is present in the no data case
}

interface ErrorResponse {
  error: string;
  details?: string;
}

type LendiROneApiResponse = SuccessResponse | ErrorResponse;

export default function LendiROnePage() {
  const router = useRouter(); // Initialize router
  const [userId, setUserId] = useState('');
  const [lendingData, setLendingData] = useState<LendingWithBookData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for the update modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentLendingRecord, setCurrentLendingRecord] = useState<LendingWithBookData | null>(null);
  const [updateFormData, setUpdateFormData] = useState({
    returned_date: '',
    status: '',
  });
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleFetchLendingRecords = async () => {
    if (!userId) {
      setError('Please enter a User ID');
      setLendingData([]);
      return;
    }

    setLoading(true);
    setError(null);
    setLendingData([]);

    try {
      const response = await fetch(`/api/lendi/r-one?user_id=${userId}`);
      const result = await response.json(); // Use a different variable name to avoid confusion
      console.log("data@lendi-r-one===", result);

      if (response.ok) {
        // If response is ok, cast result to SuccessResponse
        const successData = result as SuccessResponse;
        setLendingData(successData.data);
        // Optionally display message if no data found
        if (successData.data.length === 0 && successData.message) {
            setError(successData.message);
        }
      } else {
        // If response is not ok, cast result to ErrorResponse
        const errorData = result as ErrorResponse;
        setError(errorData.error || 'Failed to fetch lending records');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle click on the Update button
  const handleUpdateClick = (record: LendingWithBookData) => {
    setCurrentLendingRecord(record);
    // Pre-populate the form with current record data
    setUpdateFormData({
      returned_date: record.returned_date || '', // Use empty string for date input if null
      status: record.status,
    });
    setIsUpdateModalOpen(true);
    setUpdateMessage(null);
    setUpdateError(null);
  };

  // Function to handle changes in the update form
  const handleUpdateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Function to handle submission of the update form
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLendingRecord) return;

    setLoading(true);
    setUpdateMessage(null);
    setUpdateError(null);

    try {
      const response = await fetch('/api/lendi/up', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lending_id: currentLendingRecord.lending_id,
          returned_date: updateFormData.returned_date || null, // Send null if empty
          status: updateFormData.status,
        }),
      });

      const result: UpdateApiResponse = await response.json();

      if (response.ok) {
        setUpdateMessage(result.message || 'Update successful');
        setIsUpdateModalOpen(false); // Close modal on success
        // Navigate back to the same page to refresh data
        router.push('/borrowpg/lendi-r-one');
      } else {
        setUpdateError(result.error || 'Update failed');
      }
    } catch (error: any) {
      setUpdateError(error.message || 'An error occurred during update');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date
  function formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">Lending Records</div>
          <div>
            <ul className="flex space-x-4">
              <li>
              <Link href="/" className="px-3 py-1 rounded shadow bg-white text-blue-700 hover:bg-gray-100 transition-colors w-32 h-10 flex items-center justify-center font-bold">
                  Home
                </Link>
              </li>
              <li>
              <Link href="/borrowpg" className="px-3 py-1 rounded shadow bg-white text-blue-700 hover:bg-gray-100 transition-colors w-32 h-10 flex items-center justify-center font-bold">
              Back to Borrow Page
                </Link>
              </li>
              
            </ul>
          </div>
          {/* <div>
            <a href="/" className="mr-4 font-bold bg-white text-blue-700 px-3 py-1 rounded shadow hover:bg-gray-200">Home</a>
            <a href="/borrowpg" className="font-bold bg-white text-blue-700 px-3 py-1 rounded shadow hover:bg-gray-200">Back to Borrow Page</a>
          </div> */}
        </div>
      </nav>

      <main className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8">View Lending Records by User ID</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Enter User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleFetchLendingRecords}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Fetching...' : 'Fetch Records'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {lendingData.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lending ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrowed Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th> {/* Added Due Date header */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> {/* Added Actions column */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lendingData.map((record) => (
                  <tr key={record.lending_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">{record.lending_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">{record.user_id}</td> {/* Added User ID cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">{record.book_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">{formatDate(record.borrowed_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">{record.due_date ? formatDate(record.due_date) : 'N/A'}</td> {/* Added Due Date cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">{record.returned_date ? formatDate(record.returned_date) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' : record.status === 'returned' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {record.status}
                        </span>
                    </td>
                    {/* Add a new column for the Update button */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleUpdateClick(record)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Update Modal */}
        {isUpdateModalOpen && currentLendingRecord && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Update Lending Record</h3>
                <div className="mt-2 px-7 py-3">
                  <form onSubmit={handleUpdateSubmit}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="returned_date">
                        Returned Date
                      </label>
                      <input
                        type="date"
                        id="returned_date"
                        name="returned_date"
                        value={updateFormData.returned_date}
                        onChange={handleUpdateFormChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={updateFormData.status}
                        onChange={handleUpdateFormChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="">Select Status</option>
                        <option value="borrowed">Borrowed</option>
                        <option value="returned">Returned</option>
                        <option value="overdue">Overdue</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Update Record'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUpdateModalOpen(false)}
                        className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                  {updateMessage && <p className="mt-4 text-green-500">{updateMessage}</p>}
                  {updateError && <p className="mt-4 text-red-500">{updateError}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}
