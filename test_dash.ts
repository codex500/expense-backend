import { dashboardService } from './src/modules/dashboard/dashboard.service';
async function test() {
  try {
    const res = await dashboardService.getSummary('91904d88-fe32-4852-a0cf-198dcd5930b3');
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
test();
