import { ApiProperty } from '@nestjs/swagger';

export class GhlAccountPermissions {
  @ApiProperty()
  campaignsEnabled: boolean;

  @ApiProperty()
  campaignsReadOnly: boolean;

  @ApiProperty()
  contactsEnabled: boolean;

  @ApiProperty()
  workflowsEnabled: boolean;

  @ApiProperty()
  workflowsReadOnly: boolean;

  @ApiProperty()
  triggersEnabled: boolean;

  @ApiProperty()
  funnelsEnabled: boolean;

  @ApiProperty()
  websitesEnabled: boolean;

  @ApiProperty()
  opportunitiesEnabled: boolean;

  @ApiProperty()
  dashboardStatsEnabled: boolean;

  @ApiProperty()
  bulkRequestsEnabled: boolean;

  @ApiProperty()
  appointmentsEnabled: boolean;

  @ApiProperty()
  reviewsEnabled: boolean;

  @ApiProperty()
  onlineListingsEnabled: boolean;

  @ApiProperty()
  phoneCallEnabled: boolean;

  @ApiProperty()
  conversationsEnabled: boolean;

  @ApiProperty()
  assignedDataOnly: boolean;

  @ApiProperty()
  adwordsReportingEnabled: boolean;

  @ApiProperty()
  membershipEnabled: boolean;

  @ApiProperty()
  facebookAdsReportingEnabled: boolean;

  @ApiProperty()
  attributionsReportingEnabled: boolean;

  @ApiProperty()
  settingsEnabled: boolean;

  @ApiProperty()
  tagsEnabled: boolean;

  @ApiProperty()
  leadValueEnabled: boolean;

  @ApiProperty()
  marketingEnabled: boolean;

  @ApiProperty()
  agentReportingEnabled: boolean;

  @ApiProperty()
  botService: boolean;

  @ApiProperty()
  socialPlanner: boolean;

  @ApiProperty()
  bloggingEnabled: boolean;

  @ApiProperty()
  invoiceEnabled: boolean;

  @ApiProperty()
  affiliateManagerEnabled: boolean;

  @ApiProperty()
  contentAiEnabled: boolean;

  @ApiProperty()
  refundsEnabled: boolean;

  @ApiProperty()
  recordPaymentEnabled: boolean;

  @ApiProperty()
  cancelSubscriptionEnabled: boolean;

  @ApiProperty()
  paymentsEnabled: boolean;

  @ApiProperty()
  communitiesEnabled: boolean;

  @ApiProperty()
  exportPaymentsEnabled: boolean;
}

export class CreateGhlAccountDto {
  @ApiProperty()
  companyId: string;

  @ApiProperty({ type: [String] })
  locationIds: string[];

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: GhlAccountPermissions })
  permissions: GhlAccountPermissions;

  @ApiProperty({ type: [String], required: false })
  scopes?: string[];

  @ApiProperty({ type: [String], required: false })
  scopesAssignedToOnly?: string[];

  @ApiProperty({ required: false })
  profilePhoto?: string;

  @ApiProperty({ required: false })
  platformLanguage?: string;
}

export class GhlAccountResponse {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  success?: boolean;

  @ApiProperty()
  message?: string;

  @ApiProperty()
  accountId?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  locationId?: string;
}
