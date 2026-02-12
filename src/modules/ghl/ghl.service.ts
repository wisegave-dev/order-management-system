import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "../config/config.service";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import {
  CreateGhlAccountDto,
  GhlAccountResponse,
  GhlAccountPermissions,
} from "./dto/create-ghl-account.dto";

interface CreateAccountOptions {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  businessName?: string;
}

interface GhlLocationResponse {
  id?: string;
  locationId?: string;
  name?: string;
}

interface GhlUserResponse {
  id?: string;
  userId?: string;
  email?: string;
}

@Injectable()
export class GhlService {
  private readonly logger = new Logger(GhlService.name);
  private readonly defaultPermissions: GhlAccountPermissions = {
    campaignsEnabled: true,
    campaignsReadOnly: false,
    contactsEnabled: true,
    workflowsEnabled: true,
    workflowsReadOnly: false,
    triggersEnabled: true,
    funnelsEnabled: true,
    websitesEnabled: true,
    opportunitiesEnabled: true,
    dashboardStatsEnabled: true,
    bulkRequestsEnabled: true,
    appointmentsEnabled: true,
    reviewsEnabled: true,
    onlineListingsEnabled: true,
    phoneCallEnabled: true,
    conversationsEnabled: true,
    assignedDataOnly: false,
    adwordsReportingEnabled: false,
    membershipEnabled: true,
    facebookAdsReportingEnabled: false,
    attributionsReportingEnabled: false,
    settingsEnabled: true,
    tagsEnabled: true,
    leadValueEnabled: true,
    marketingEnabled: true,
    agentReportingEnabled: true,
    botService: false,
    socialPlanner: true,
    bloggingEnabled: true,
    invoiceEnabled: true,
    affiliateManagerEnabled: true,
    contentAiEnabled: true,
    refundsEnabled: true,
    recordPaymentEnabled: true,
    cancelSubscriptionEnabled: true,
    paymentsEnabled: true,
    communitiesEnabled: true,
    exportPaymentsEnabled: true,
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new account in GoHighLevel - Two Step Process
   * Step 1: Create sub-account (location/company)
   * Step 2: Create user in that sub-account
   */
  async createAccount(
    options: CreateAccountOptions,
  ): Promise<GhlAccountResponse> {
    const {
      firstName,
      lastName = "",
      email,
      phone = "",
      businessName,
    } = options;

    // Use business name for the account name, otherwise use person's name
    const accountName = businessName || `${firstName} ${lastName}`.trim();

    // For GHL user: if business name exists, use it as firstName with empty lastName
    // Otherwise use person's firstName and lastName
    const firstNameForUser = firstName || businessName;
    const lastNameForUser = lastName || (businessName ? "" : lastName || "");

    const password = "WiseGave2026!";

    const headers = {
      Authorization: `Bearer ${this.configService.ghlApiKey}`,
      "Content-Type": "application/json",
      version: "2021-07-28",
    };

    this.logger.log(
      `Step 1: Creating GHL location/sub-account for: ${accountName}`,
    );

    try {
      // STEP 1: Create Location/Sub-Account (includes email, phone, country)
      const locationPayload = {
        name: accountName,
        email: email,
        phone: phone,
        country: "US",
        timezone: this.configService.ghlDefaultTimezone,
        companyId: this.configService.ghlCompanyId,
      };

      this.logger.log(`Location payload: ${JSON.stringify(locationPayload)}`);

      const locationResponse = await firstValueFrom<
        AxiosResponse<GhlLocationResponse>
      >(
        this.httpService.post<GhlLocationResponse>(
          "/locations/",
          locationPayload,
          {
            headers,
          },
        ),
      );

      this.logger.log(
        `Location response: ${JSON.stringify(locationResponse.data)}`,
      );

      const locationId =
        locationResponse.data?.locationId || locationResponse.data?.id;

      if (!locationId) {
        this.logger.error(
          `No location ID in response. Full response: ${JSON.stringify(locationResponse.data)}`,
        );
        throw new Error("No location ID returned from GHL");
      }

      this.logger.log(
        `Step 1 Success: Location created with ID: ${locationId}`,
      );

      // Add a small delay to ensure GHL has fully propagated the location
      // GHL API has eventual consistency - the location needs time to be available
      this.logger.log(`Waiting 2 seconds for GHL to propagate the location...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // STEP 2: Create User in the new Location
      this.logger.log(`Step 2: Creating user in location: ${locationId}`);

      const userPayload = {
        locationIds: [locationId],
        companyId: this.configService.ghlCompanyId,
        firstName: firstNameForUser,
        lastName: lastNameForUser,
        email,
        password,
        phone,
        type: "account",
        role: "admin",
        permissions: this.defaultPermissions,
        scopes: ["contacts.write", "campaigns.readonly"],
        scopesAssignedToOnly: ["contacts.write", "campaigns.readonly"],
        profilePhoto: "",
        platformLanguage: "en_US",
      };

      this.logger.log(
        `User payload: ${JSON.stringify({ ...userPayload, password: "***" })}`,
      );

      const userResponse = await firstValueFrom<AxiosResponse<GhlUserResponse>>(
        this.httpService.post<GhlUserResponse>("/users/", userPayload, {
          headers,
        }),
      );

      const userId = userResponse.data?.id || userResponse.data?.userId;

      this.logger.log(`Step 2 Success: User created with ID: ${userId}`);

      return {
        success: true,
        id: userId,
        accountId: userId,
        email,
        message: "Account created successfully",
        locationId: locationId,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to create GHL account for ${email}: ${error.message}`,
        error.stack,
      );
      this.logger.error(
        `Full error response: ${JSON.stringify(error.response?.data || error.response || error)}`,
      );

      // Return error details
      return {
        success: false,
        email,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Create account from order data
   * Called when order is paid
   */
  async createAccountFromOrder(
    customerName: string,
    customerEmail: string,
    customerPhone?: string,
    businessName?: string,
  ): Promise<GhlAccountResponse> {
    // Parse name into first and last name
    const nameParts = customerName.trim().split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    return this.createAccount({
      firstName,
      lastName,
      email: customerEmail,
      phone: customerPhone,
      businessName,
    });
  }

  /**
   * Create only a sub-account/location in GHL
   * Use this if you want to create the location first and user later
   */
  async createLocation(
    name: string,
    email?: string,
    phone?: string,
  ): Promise<GhlAccountResponse> {
    const payload: any = {
      name,
      country: "US",
      timezone: this.configService.ghlDefaultTimezone,
      companyId: this.configService.ghlCompanyId,
    };

    if (email) payload.email = email;
    if (phone) payload.phone = phone;

    this.logger.log(`Creating GHL location for: ${name}`);

    try {
      const headers = {
        Authorization: `Bearer ${this.configService.ghlApiKey}`,
        "Content-Type": "application/json",
        version: "2021-07-28",
      };

      const response = await firstValueFrom<AxiosResponse<GhlLocationResponse>>(
        this.httpService.post<GhlLocationResponse>("/locations/", payload, {
          headers,
        }),
      );

      const locationId = response.data?.locationId || response.data?.id;

      this.logger.log(`GHL location created: ${locationId}`);

      return {
        success: true,
        id: locationId,
        accountId: locationId,
        locationId: locationId,
        message: "Location created successfully",
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to create GHL location: ${error.message}`,
        error.stack,
      );
      this.logger.error(
        `Full error response: ${JSON.stringify(error.response?.data || error.response || error)}`,
      );

      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Create user in an existing location
   */
  async createUserInLocation(
    locationId: string,
    options: CreateAccountOptions,
  ): Promise<GhlAccountResponse> {
    const {
      firstName,
      lastName = "",
      email,
      phone = "",
      businessName,
    } = options;

    const accountName = businessName || `${firstName} ${lastName}`.trim();

    // For GHL user: if business name exists, use it as firstName with empty lastName
    // Otherwise use person's firstName and lastName
    const firstNameForUser = businessName || firstName;
    const lastNameForUser = businessName ? "" : lastName || "";

    const password = "WiseGave2026!";
    this.logger.log("LastName", lastNameForUser);

    const payload = {
      locationIds: [locationId],
      companyId: this.configService.ghlCompanyId,
      firstName: firstNameForUser,
      lastName: lastNameForUser,
      email,
      password,
      phone,
      type: "account",
      role: "admin",
      permissions: this.defaultPermissions,
      scopes: ["contacts.write", "campaigns.readonly"],
      scopesAssignedToOnly: ["contacts.write", "campaigns.readonly"],
      profilePhoto: "",
      platformLanguage: "en_US",
    };

    this.logger.log(`Creating user in location ${locationId} for ${email}`);

    try {
      const headers = {
        Authorization: `Bearer ${this.configService.ghlApiKey}`,
        "Content-Type": "application/json",
        version: "2021-07-28",
      };

      const response = await firstValueFrom<AxiosResponse<GhlUserResponse>>(
        this.httpService.post<GhlUserResponse>("/users/", payload, {
          headers,
        }),
      );

      const userId = response.data?.id || response.data?.userId;

      this.logger.log(`User created: ${userId}`);

      return {
        success: true,
        id: userId,
        accountId: userId,
        email,
        message: "User created successfully",
        locationId: locationId,
      };
    } catch (error: any) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      this.logger.error(
        `Full error response: ${JSON.stringify(error.response?.data || error.response || error)}`,
      );

      return {
        success: false,
        email,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get account details by ID
   */
  async getAccount(accountId: string): Promise<any> {
    try {
      const response = await firstValueFrom<AxiosResponse<any>>(
        this.httpService.get<any>(`/locations/${accountId}`, {
          headers: {
            Authorization: `Bearer ${this.configService.ghlApiKey}`,
            version: "2021-07-28",
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to get GHL account ${accountId}: ${error.message}`,
      );
      throw new HttpException(
        error.response?.data?.message || "Failed to fetch account",
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Delete a user from GHL by user ID
   */
  async deleteUser(userId: string): Promise<GhlAccountResponse> {
    this.logger.log(`Deleting GHL user: ${userId}`);

    try {
      const headers = {
        Authorization: `Bearer ${this.configService.ghlApiKey}`,
        "Content-Type": "application/json",
        version: "2021-07-28",
      };

      const response = await firstValueFrom<AxiosResponse<any>>(
        this.httpService.delete<any>(`/users/${userId}`, {
          headers,
        }),
      );

      this.logger.log(`GHL user deleted successfully: ${userId}`);

      return {
        success: true,
        id: userId,
        message: "User deleted successfully",
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to delete GHL user ${userId}: ${error.message}`,
        error.stack,
      );
      this.logger.error(
        `Full error response: ${JSON.stringify(error.response?.data || error.response || error)}`,
      );

      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Delete a location/sub-account from GHL by location ID
   */
  async deleteLocation(locationId: string): Promise<GhlAccountResponse> {
    this.logger.log(`Deleting GHL location: ${locationId}`);

    try {
      const headers = {
        Authorization: `Bearer ${this.configService.ghlApiKey}`,
        "Content-Type": "application/json",
        version: "2021-07-28",
      };

      const response = await firstValueFrom<AxiosResponse<any>>(
        this.httpService.delete<any>(`/locations/${locationId}`, {
          headers,
        }),
      );

      this.logger.log(`GHL location deleted successfully: ${locationId}`);

      return {
        success: true,
        id: locationId,
        locationId: locationId,
        message: "Location deleted successfully",
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to delete GHL location ${locationId}: ${error.message}`,
        error.stack,
      );
      this.logger.error(
        `Full error response: ${JSON.stringify(error.response?.data || error.response || error)}`,
      );

      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Delete both user and location from GHL
   * This is the recommended method for subscription cancellation
   */
  async deleteAccount(
    userId: string,
    locationId: string,
  ): Promise<GhlAccountResponse> {
    this.logger.log(
      `Deleting GHL account - User: ${userId}, Location: ${locationId}`,
    );

    const results = {
      userDeleted: false,
      locationDeleted: false,
      userError: null as string | null,
      locationError: null as string | null,
    };

    // First, delete the user
    if (userId) {
      const userResult = await this.deleteUser(userId);
      results.userDeleted = userResult.success;
      results.userError = userResult.success ? null : userResult.message;
    }

    // Then, delete the location
    if (locationId) {
      const locationResult = await this.deleteLocation(locationId);
      results.locationDeleted = locationResult.success;
      results.locationError = locationResult.success
        ? null
        : locationResult.message;
    }

    const success = results.userDeleted && results.locationDeleted;

    return {
      success,
      message: success
        ? "Account deleted successfully"
        : `Partial deletion - User: ${results.userDeleted ? "OK" : "Failed"}, Location: ${results.locationDeleted ? "OK" : "Failed"}`,
      id: userId,
      locationId: locationId,
    };
  }
}
