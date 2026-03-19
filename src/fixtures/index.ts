// src/fixtures/index.ts
import devData from './dev/data.json';
import stagingData from './staging/data.json';
import uatData from './uat/data.json';

// Get environment from process.env, defaulting to 'dev'
const ENV = process.env.TEST_ENV || 'dev';

// Fixture Hub: Exposes Data Dynamically Based on the Environment
export const testData: typeof devData = (() => {
    switch (ENV) {
        case 'staging':
            return stagingData as typeof devData;
        case 'uat':
            return uatData as typeof devData;
        default:
            return devData;
    }
})();
