import { LocalApiClient } from "@/lib/api/local-client";
import type { ApiClient } from "@/lib/api/client";

export const api: ApiClient = new LocalApiClient();
