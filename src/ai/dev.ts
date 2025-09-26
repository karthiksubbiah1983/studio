import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { registerFlows } from './flows';

genkit({
  plugins: [
    googleAI(),
  ],
  flows: [...registerFlows()],
  logLevel: 'debug',
  enableTracing: true,
});
