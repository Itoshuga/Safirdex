import type account from "../../messages/fr/account.json";
import type admin from "../../messages/fr/admin.json";
import type auth from "../../messages/fr/auth.json";
import type cards from "../../messages/fr/cards.json";
import type common from "../../messages/fr/common.json";
import type community from "../../messages/fr/community.json";
import type dashboard from "../../messages/fr/dashboard.json";
import type home from "../../messages/fr/home.json";
import type navigation from "../../messages/fr/navigation.json";
import type profile from "../../messages/fr/profile.json";
import type { formats } from "@/i18n/formats";
import type { AppLocale } from "@/lib/i18n/locales";

type AppMessages = typeof common &
  typeof navigation &
  typeof home &
  typeof auth &
  typeof account &
  typeof dashboard &
  typeof cards &
  typeof admin &
  typeof community &
  typeof profile;

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: AppMessages;
    Formats: typeof formats;
  }
}
