import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  OtpVerification: { phone: string };
  ForgotPassword: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  PetProfile: { petId: string };
  ProductDetail: { productId: string };
  AiAssistant: undefined;
  Passport: { petId?: string } | undefined;
  ConsentCenter: undefined;
  TwinDashboard: { petId?: string } | undefined;
  AgentCenter: undefined;
  Notifications: undefined;
  QRScanner: undefined;
  VerifyPassport: { code: string };
  VerificationRequest: { petId?: string } | undefined;
  DashboardLayout: undefined;
  Orders: undefined;
  Hub: undefined;
  HubList: { listing: string };
  HubEntry: { listing: string; entryId: string };
  HubAction: { listing: string; entryId: string };
  HubActivity: undefined;
  HubTool: { tool: string };
};

export type ShopStackParamList = {
  Catalog: { category?: string; collection?: string } | undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
};

export type ServicesStackParamList = {
  ServicesHome: { category?: string } | undefined;
  ProviderDetail: { providerId: string };
  Booking: { providerId: string };
};

export type CommunityStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
};

export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ShopTab: NavigatorScreenParams<ShopStackParamList>;
  ServicesTab: NavigatorScreenParams<ServicesStackParamList>;
  CommunityTab: NavigatorScreenParams<CommunityStackParamList>;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
};
