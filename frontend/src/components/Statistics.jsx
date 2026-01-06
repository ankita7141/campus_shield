import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Statistics = ({ data: initialData, timeframe = '7days' }) => {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState(initialData || {});
  const [timeRange, setTimeRange] = useState(timeframe);
  const [chartType, setChartType] = useState('bar');
  const [activeChart, setActiveChart] = useState('overview');

  useEffect(() => {
    if (!initialData) {
      fetchStatistics();
    } else {
      setData(initialData);
    }
  }, [initialData, timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      // This would be an API call in production
      // For now, we'll use mock data
      const mockData = generateMockData(timeRange);
      setData(mockData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (range) => {
    const now = new Date();
    const categories = ['harassment', 'safety-threat', 'misbehavior', 'emergency', 'other'];
    const statuses = ['pending', 'under-review', 'resolved', 'dismissed'];
    const severities = ['critical', 'high', 'medium', 'low'];
    
    // Generate daily data
    let days = 7;
    if (range === '30days') days = 30;
    if (range === '90days') days = 90;
    if (range === '365days') days = 365;
    
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dailyData.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 20) + 5
      });
    }
    
    // Category distribution
    const categoryData = categories.map(category => ({
      category,
      count: Math.floor(Math.random() * 50) + 10
    }));
    
    // Status distribution
    const statusData = statuses.map(status => ({
      status,
      count: Math.floor(Math.random() * 100) + 20
    }));
    
    // Severity distribution
    const severityData = severities.map(severity => ({
      severity,
      count: Math.floor(Math.random() * 80) + 10
    }));
    
    // Resolution time data
    const resolutionTimes = Array.from({ length: 50 }, () => Math.floor(Math.random() * 168) + 1); // 1-168 hours
    
    return {
      summary: {
        total: dailyData.reduce((sum, day) => sum + day.count, 0),
        pending: Math.floor(Math.random() * 100) + 20,
        resolved: Math.floor(Math.random() * 200) + 50,
        underReview: Math.floor(Math.random() * 80) + 15,
        avgResolutionTime: resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      },
      byCategory: categoryData.reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {}),
      byStatus: statusData.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      bySeverity: severityData.reduce((acc, item) => {
        acc[item.severity] = item.count;
        return acc;
      }, {}),
      dailyReports: dailyData,
      resolutionTimes,
      peakHours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 30) + (i >= 9 && i <= 17 ? 10 : 0)
      })),
      popularLocations: [
        { location: 'Library', count: 45 },
        { location: 'Cafeteria', count: 38 },
        { location: 'Hostel Area', count: 32 },
        { location: 'Parking Lot', count: 28 },
        { location: 'Academic Block', count: 25 }
      ]
    };
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case '365days': return 'Last 365 Days';
      default: return 'Last 7 Days';
    }
  };

  // Chart configurations
  const dailyReportsChart = {
    labels: data.dailyReports?.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Reports per Day',
        data: data.dailyReports?.map(day => day.count) || [],
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const categoryChart = {
    labels: Object.keys(data.byCategory || {}).map(cat => 
      cat.replace('-', ' ').charAt(0).toUpperCase() + cat.replace('-', ' ').slice(1)
    ),
    datasets: [
      {
        data: Object.values(data.byCategory || {}),
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',    // Red for harassment
          'rgba(249, 115, 22, 0.7)',   // Orange for safety-threat
          'rgba(234, 179, 8, 0.7)',    // Yellow for misbehavior
          'rgba(220, 38, 38, 0.7)',    // Dark red for emergency
          'rgba(107, 114, 128, 0.7)'   // Gray for other
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(249, 115, 22)',
          'rgb(234, 179, 8)',
          'rgb(220, 38, 38)',
          'rgb(107, 114, 128)'
        ],
        borderWidth: 2
      }
    ]
  };

  const statusChart = {
    labels: Object.keys(data.byStatus || {}).map(status => 
      status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)
    ),
    datasets: [
      {
        data: Object.values(data.byStatus || {}),
        backgroundColor: [
          'rgba(234, 179, 8, 0.7)',    // Yellow for pending
          'rgba(59, 130, 246, 0.7)',   // Blue for under-review
          'rgba(34, 197, 94, 0.7)',    // Green for resolved
          'rgba(156, 163, 175, 0.7)'   // Gray for dismissed
        ],
        borderColor: [
          'rgb(234, 179, 8)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(156, 163, 175)'
        ],
        borderWidth: 2
      }
    ]
  };

  const severityChart = {
    labels: Object.keys(data.bySeverity || {}).map(severity => 
      severity.charAt(0).toUpperCase() + severity.slice(1)
    ),
    datasets: [
      {
        data: Object.values(data.bySeverity || {}),
        backgroundColor: [
          'rgba(220, 38, 38, 0.7)',    // Red for critical
          'rgba(249, 115, 22, 0.7)',   // Orange for high
          'rgba(234, 179, 8, 0.7)',    // Yellow for medium
          'rgba(34, 197, 94, 0.7)'     // Green for low
        ],
        borderColor: [
          'rgb(220, 38, 38)',
          'rgb(249, 115, 22)',
          'rgb(234, 179, 8)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 2
      }
    ]
  };

  const peakHoursChart = {
    labels: data.peakHours?.map(hour => `${hour.hour}:00`) || [],
    datasets: [
      {
        label: 'Reports by Hour',
        data: data.peakHours?.map(hour => hour.count) || [],
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'nearest'
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  const charts = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-bar' },
    { id: 'categories', label: 'Categories', icon: 'fas fa-tags' },
    { id: 'status', label: 'Status', icon: 'fas fa-clipboard-check' },
    { id: 'severity', label: 'Severity', icon: 'fas fa-exclamation-triangle' },
    { id: 'timing', label: 'Timing', icon: 'fas fa-clock' },
    { id: 'locations', label: 'Locations', icon: 'fas fa-map-marker-alt' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Statistics Dashboard</h2>
            <p className="text-gray-600">Analytics and insights from reported incidents</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="365days">Last 365 Days</option>
            </select>
            
            {/* Chart Type Selector */}
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
            </select>
            
            <button
              onClick={fetchStatistics}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary - {getTimeRangeLabel()}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-3xl font-bold text-indigo-600">{data.summary?.total || 0}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
            <div className="mt-2 text-xs text-gray-500">
              {data.dailyReports?.reduce((sum, day) => sum + day.count, 0) || 0} this period
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-3xl font-bold text-yellow-600">{data.summary?.pending || 0}</div>
            <div className="text-sm text-gray-600">Pending</div>
            <div className="mt-2 text-xs text-gray-500">
              {Math.round((data.summary?.pending / data.summary?.total) * 100 || 0)}% of total
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-3xl font-bold text-green-600">{data.summary?.resolved || 0}</div>
            <div className="text-sm text-gray-600">Resolved</div>
            <div className="mt-2 text-xs text-gray-500">
              Avg. {Math.round(data.summary?.avgResolutionTime || 0)} hours to resolve
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-3xl font-bold text-red-600">
              {data.byCategory?.emergency || 0}
            </div>
            <div className="text-sm text-gray-600">Emergencies</div>
            <div className="mt-2 text-xs text-gray-500">
              {Math.round((data.byCategory?.emergency / data.summary?.total) * 100 || 0)}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          {charts.map(chart => (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeChart === chart.id 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className={`${chart.icon} mr-2`}></i>
              {chart.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {activeChart === 'overview' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Daily Reports Trend - {getTimeRangeLabel()}
              </h4>
              <div className="h-80">
                {chartType === 'line' ? (
                  <Line data={dailyReportsChart} options={chartOptions} />
                ) : chartType === 'pie' ? (
                  <Pie data={dailyReportsChart} options={pieOptions} />
                ) : chartType === 'doughnut' ? (
                  <Doughnut data={dailyReportsChart} options={pieOptions} />
                ) : (
                  <Bar data={dailyReportsChart} options={chartOptions} />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Reports by Category</h4>
                <div className="h-64">
                  <Doughnut data={categoryChart} options={pieOptions} />
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Reports by Status</h4>
                <div className="h-64">
                  <Doughnut data={statusChart} options={pieOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeChart === 'categories' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Reports by Category</h4>
              <div className="h-96">
                {chartType === 'pie' ? (
                  <Pie data={categoryChart} options={pieOptions} />
                ) : chartType === 'doughnut' ? (
                  <Doughnut data={categoryChart} options={pieOptions} />
                ) : chartType === 'line' ? (
                  <Line data={{
                    ...categoryChart,
                    datasets: [{
                      ...categoryChart.datasets[0],
                      type: 'line'
                    }]
                  }} options={chartOptions} />
                ) : (
                  <Bar data={categoryChart} options={chartOptions} />
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-700 mb-3">Category Breakdown</h5>
              <div className="space-y-2">
                {Object.entries(data.byCategory || {}).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        category === 'harassment' ? 'bg-red-500' :
                        category === 'safety-threat' ? 'bg-orange-500' :
                        category === 'misbehavior' ? 'bg-yellow-500' :
                        category === 'emergency' ? 'bg-red-700' : 'bg-gray-500'
                      }`}></div>
                      <span className="capitalize">{category.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-800 mr-3">{count}</span>
                      <span className="text-sm text-gray-600">
                        ({Math.round((count / data.summary?.total) * 100 || 0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeChart === 'status' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Reports by Status</h4>
              <div className="h-96">
                {chartType === 'pie' ? (
                  <Pie data={statusChart} options={pieOptions} />
                ) : chartType === 'doughnut' ? (
                  <Doughnut data={statusChart} options={pieOptions} />
                ) : chartType === 'line' ? (
                  <Line data={{
                    ...statusChart,
                    datasets: [{
                      ...statusChart.datasets[0],
                      type: 'line'
                    }]
                  }} options={chartOptions} />
                ) : (
                  <Bar data={statusChart} options={chartOptions} />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-yellow-50 rounded-lg p-4">
                <h5 className="font-semibold text-yellow-800 mb-3">Pending Reports</h5>
                <p className="text-3xl font-bold text-yellow-600 mb-2">{data.summary?.pending || 0}</p>
                <p className="text-sm text-yellow-700">
                  Average time pending: 2.3 days
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-semibold text-green-800 mb-3">Resolved Reports</h5>
                <p className="text-3xl font-bold text-green-600 mb-2">{data.summary?.resolved || 0}</p>
                <p className="text-sm text-green-700">
                  Average resolution time: {Math.round(data.summary?.avgResolutionTime || 0)} hours
                </p>
              </div>
            </div>
          </div>
        )}

        {activeChart === 'severity' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Reports by Severity Level</h4>
              <div className="h-96">
                {chartType === 'pie' ? (
                  <Pie data={severityChart} options={pieOptions} />
                ) : chartType === 'doughnut' ? (
                  <Doughnut data={severityChart} options={pieOptions} />
                ) : chartType === 'line' ? (
                  <Line data={{
                    ...severityChart,
                    datasets: [{
                      ...severityChart.datasets[0],
                      type: 'line'
                    }]
                  }} options={chartOptions} />
                ) : (
                  <Bar data={severityChart} options={chartOptions} />
                )}
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <h5 className="font-semibold text-red-800 mb-3">Critical & High Severity Reports</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {data.bySeverity?.critical || 0}
                  </p>
                  <p className="text-sm text-red-700">Critical Severity</p>
                  <p className="text-xs text-red-600 mt-1">
                    Requires immediate attention
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.bySeverity?.high || 0}
                  </p>
                  <p className="text-sm text-orange-700">High Severity</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Review within 4 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeChart === 'timing' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Reports by Time of Day</h4>
              <div className="h-80">
                <Bar data={peakHoursChart} options={chartOptions} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-semibold text-blue-800 mb-3">Peak Reporting Hours</h5>
                <div className="space-y-2">
                  {data.peakHours
                    ?.sort((a, b) => b.count - a.count)
                    .slice(0, 3)
                    .map((hour, index) => (
                      <div key={hour.hour} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{hour.hour}:00 - {hour.hour + 1}:00</p>
                            <p className="text-sm text-blue-700">{hour.count} reports</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h5 className="font-semibold text-purple-800 mb-3">Lowest Reporting Hours</h5>
                <div className="space-y-2">
                  {data.peakHours
                    ?.sort((a, b) => a.count - b.count)
                    .slice(0, 3)
                    .map((hour, index) => (
                      <div key={hour.hour} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                            <span className="text-purple-600 font-semibold">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{hour.hour}:00 - {hour.hour + 1}:00</p>
                            <p className="text-sm text-purple-700">{hour.count} reports</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeChart === 'locations' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Popular Incident Locations</h4>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-4">
                  {data.popularLocations?.map((location, index) => (
                    <div key={location.location} className="flex items-center">
                      <div className="w-10 text-center">
                        <span className="text-lg font-bold text-gray-800">#{index + 1}</span>
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-gray-800">{location.location}</span>
                          <span className="font-semibold text-gray-800">{location.count} reports</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ 
                              width: `${(location.count / (data.popularLocations?.[0]?.count || 1)) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-6">
              <h5 className="font-semibold text-yellow-800 mb-3">Safety Recommendations</h5>
              <ul className="text-yellow-700 space-y-2">
                <li className="flex items-start">
                  <i className="fas fa-lightbulb mt-1 mr-3 text-yellow-600"></i>
                  <span>Increase security patrols in Library and Cafeteria during peak hours (2-5 PM)</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-lightbulb mt-1 mr-3 text-yellow-600"></i>
                  <span>Install additional CCTV cameras in Parking Lot areas</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-lightbulb mt-1 mr-3 text-yellow-600"></i>
                  <span>Implement better lighting in Hostel Area after 10 PM</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-lightbulb mt-1 mr-3 text-yellow-600"></i>
                  <span>Schedule self-defense workshops for female students</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <h4 className="font-semibold text-gray-700 mb-3">Export Statistics</h4>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <i className="fas fa-file-pdf mr-2 text-red-500"></i>
            Export as PDF
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <i className="fas fa-file-excel mr-2 text-green-500"></i>
            Export as Excel
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <i className="fas fa-file-csv mr-2 text-blue-500"></i>
            Export as CSV
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <i className="fas fa-chart-line mr-2 text-purple-500"></i>
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Statistics;