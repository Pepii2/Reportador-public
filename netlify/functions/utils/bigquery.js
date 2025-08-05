import { BigQuery } from '@google-cloud/bigquery';
import { resolve } from 'path';

let bigqueryClient = null;

const initBigQuery = () => {
  if (!bigqueryClient) {
    // Use keyFilename option which handles the credentials file directly
    if (process.env.GOOGLE_CLOUD_CREDENTIALS_FILE) {
      const credentialsPath = resolve(process.cwd(), process.env.GOOGLE_CLOUD_CREDENTIALS_FILE);
      
      bigqueryClient = new BigQuery({
        projectId: process.env.BIGQUERY_PROJECT_ID,
        keyFilename: credentialsPath
      });
    } else if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      // Fallback to environment variable
      const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
      bigqueryClient = new BigQuery({
        projectId: process.env.BIGQUERY_PROJECT_ID,
        credentials: credentials
      });
    } else {
      throw new Error('No BigQuery credentials provided');
    }
  }
  
  return bigqueryClient;
};

const queryBigQuery = async (query, params = []) => {
  try {
    const bigquery = initBigQuery();
    
    const options = {
      query,
      params,
      useLegacySql: false,
      location: process.env.BIGQUERY_LOCATION || 'US'
    };

    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('BigQuery Error:', error);
    throw new Error(`BigQuery query failed: ${error.message}`);
  }
};

const getDatePartition = (startDate, endDate) => {
  return `DATE(date) BETWEEN @startDate AND @endDate`;
};

export {
  initBigQuery,
  queryBigQuery,
  getDatePartition
};