import { queryBigQuery } from './utils/bigquery.js';
import { successResponse, errorResponse } from './utils/response.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return successResponse({});
  }

  try {
    // Query to get teams with their account and campaign counts
    const query = `
      WITH team_stats AS (
        SELECT 
          team,
          COUNT(DISTINCT account) as account_count,
          COUNT(DISTINCT campaign) as campaign_count,
          ARRAY_AGG(DISTINCT account_name LIMIT 10) as account_names
        FROM \`${process.env.BIGQUERY_DATASET}.unified_data\`
        WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
          AND team IS NOT NULL
        GROUP BY team
      )
      SELECT 
        team as id,
        team as name,
        account_count as accountCount,
        campaign_count as campaignCount,
        account_names as accountNames
      FROM team_stats
      ORDER BY account_count DESC
    `;

    console.log('Executing teams query:', query);
    const teams = await queryBigQuery(query);
    console.log('Teams query result:', teams);

    // If no teams are found, return default teams
    if (!teams || teams.length === 0) {
      console.log('No teams found in database, returning default team');
      return successResponse([
        {
          id: 'default',
          name: 'Equipo Principal',
          accountCount: 0,
          campaignCount: 0,
          accountNames: []
        }
      ]);
    }

    return successResponse(
      teams.map(team => ({
        id: team.id,
        name: team.name,
        accountCount: team.accountCount || 0,
        campaignCount: team.campaignCount || 0,
        accountNames: team.accountNames || []
      }))
    );
  } catch (error) {
    return errorResponse(error);
  }
};