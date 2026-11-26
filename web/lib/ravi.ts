import mockRavi from "@/mocks/ravi.profile.json";
import realRavi from "@/mocks/ravi-api.profile.json";
import { usingMocks } from "@/lib/api";
import type { Profile } from "@/lib/types";

// Ravi is a sample student with made-up data. With the built-in sample data he is the OBC student
// the mock results were written for. With the API and the real scheme dataset he is a Scheduled
// Caste student with a 5 lakh income, chosen by searching profiles against the real schemes.
export const RAVI = (usingMocks ? mockRavi : realRavi) as Profile;
