import { analyticsService } from './src/modules/analytics/analytics.service';
async function test() {
  try {
    const res = await analyticsService.getAnalytics('91904d88-fe32-4852-a0cf-198dcd5930b3', 6);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
test();
