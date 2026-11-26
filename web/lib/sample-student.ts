import mockStudent from "@/mocks/ravi.profile.json";
import apiStudent from "@/mocks/sample-student-api.profile.json";
import { usingMocks } from "@/lib/api";
import type { Profile } from "@/lib/types";

// The sample student is made up. With the built-in sample data (mock mode) the student is the OBC
// student the mock results were written for. With the API and the real scheme dataset the student
// is chosen by tools/persona_search.py, which searches profiles against data/schemes.json.
export const SAMPLE_STUDENT = (usingMocks ? mockStudent : apiStudent) as Profile;

// i18n key of the sample student's first name, which differs by mode.
export const SAMPLE_NAME_KEY = usingMocks ? "persona.mock" : "persona.api";
