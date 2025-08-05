const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🔧 API Service initialized with baseURL:', this.baseURL);
  }

  /**
   * Generic HTTP request handler
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      console.log(`🔗 API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails = null;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
          console.error('❌ API Error Details:', errorDetails);
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ API Response: ${data.success ? 'Success' : 'Error'}`);
        return data;
      } else {
        // For non-JSON responses (like file downloads), return the response object
        console.log(`✅ API Response: Non-JSON content (${contentType})`);
        return {
          success: true,
          response: response,
          contentType: contentType
        };
      }
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    console.log(`GET ${endpoint} with params:`, params);
    console.log(`Full URL: ${url}`);
    
    return this.request(url, {
      method: 'GET'
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Teams API
  async getTeams() {
    return this.get('/get-teams');
  }

  // Platforms API
  async getPlatforms() {
    return this.get('/get-platforms');
  }

  // Ad Accounts API
  async getAdAccounts(filters = {}) {
    // Handle both old format (string) and new format (object with filters)
    if (typeof filters === 'string') {
      return this.get('/get-accounts', { platform: filters });
    }
    return this.get('/get-accounts', filters);
  }

  // Campaigns API
  async getCampaigns(platform, accountIds, options = {}) {
    return this.post('/get-campaigns', {
      platform,
      accountIds,
      ...options
    });
  }

  // Ad Sets API
  async getAdSets(platform, campaignIds, options = {}) {
    return this.post('/get-adsets', {
      platform,
      campaignIds,
      ...options
    });
  }

  // Metrics API
  async getAvailableMetrics(platform) {
    return this.get('/get-metrics', { platform });
  }

  // Reports API
  async generateReport(config) {
    // Ensure we're sending the proper structure for long format data
    const reportConfig = {
      ...config,
      reportType: config.reportType || 'simple',
      startDate: config.dateRange?.start || config.startDate,
      endDate: config.dateRange?.end || config.endDate,
      groupBy: config.groupBy || 'date'
    };
    
    // Remove dateRange if we've extracted the dates
    if (reportConfig.dateRange) {
      delete reportConfig.dateRange;
    }
    
    // Log the config being sent for debugging
    console.log('📤 Sending report config:', JSON.stringify(reportConfig, null, 2));
    
    return this.post('/generate-report', reportConfig);
  }
  
  async generateReportPreview(config) {
    // Same as generateReport but with limit
    const previewConfig = {
      ...config,
      reportType: config.reportType || 'simple',
      startDate: config.dateRange?.start || config.startDate,
      endDate: config.dateRange?.end || config.endDate,
      groupBy: config.groupBy || 'date',
      limit: 10 // Preview only first 10 rows
    };
    
    // Remove dateRange if we've extracted the dates
    if (previewConfig.dateRange) {
      delete previewConfig.dateRange;
    }
    
    return this.post('/generate-report', previewConfig);
  }

  // Utility method to test connection
  async testConnection() {
    try {
      const health = await this.healthCheck();
      return {
        connected: true,
        status: health.status,
        services: health.services
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

export default new ApiService();