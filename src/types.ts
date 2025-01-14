export interface PlatformStatus {
  google: boolean;
  bing: boolean;
  youtube: boolean;
}

export interface PlatformDates {
  google: string | null;
  bing: string | null;
  youtube: string | null;
}

export interface KeywordTracking {
  id: string;
  baseKeyword: string;  // The keyword to search for
  targetResult: string;  // The result we want to see in autosuggest
  status: PlatformStatus;
  firstAppearance: PlatformDates;
  lastChecked: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  platforms: PlatformStatus;
  keywordTracking: KeywordTracking[];
}
