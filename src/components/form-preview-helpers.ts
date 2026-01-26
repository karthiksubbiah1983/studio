

import {
    evaluateRule,
} from "@/lib/utils";

// This file now re-exports the consolidated rule evaluation logic
// from the single source of truth in `lib/utils.ts` to prevent
// inconsistencies. All components that previously imported from here
// will now receive the corrected logic without needing their own code changed.

export { evaluateRule };
