"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "ru" | "uz";

type TranslationValue = string | TranslationTree;
interface TranslationTree {
  [key: string]: TranslationValue;
}

const LOCALE_STORAGE_KEY = "assettrack.locale";
const LOCALE_COOKIE_KEY = "assettrack-locale";

const dictionaries: Record<Locale, TranslationTree> = {
  en: {
    common: {
      loading: "Loading...",
      retry: "Retry",
      cancel: "Cancel",
      allStatuses: "All Statuses",
      allCategories: "All Categories",
      allAssets: "All Assets",
      from: "From:",
      to: "To:",
      clearFilters: "Clear filters",
      actions: "Actions",
      notes: "Notes",
      date: "Date",
      status: "Status",
      profile: "Profile",
      roleAdmin: "Admin",
      roleEmployee: "Employee",
    },
    nav: {
      dashboard: "Dashboard",
      assets: "Assets",
      requests: "Requests",
      myRequests: "My Requests",
      employees: "Employees",
      audit: "Audit Log",
      analytics: "Analytics",
      profile: "Profile",
    },
    dashboard: {
      title: "Dashboard",
      adminSubtitle: "Operational visibility for traceability and accountability",
      employeeSubtitle: "Track your requests and assignment updates",
      addAsset: "Add Asset",
      addEmployee: "Add Employee",
      requestAsset: "Request Asset",
      viewAll: "View All",
      totalAssets: "Total Assets",
      assigned: "Assigned",
      inRepair: "In Repair",
      lost: "Lost",
      writtenOff: "Written Off",
      pendingRequests: "Pending Requests",
      assetsByCategory: "Assets by Category",
      assetsByStatus: "Assets by Status",
      myRecentRequests: "My Recent Requests",
      recentActivity: "Recent Activity",
    },
    assets: {
      titleAdmin: "Assets",
      titleEmployee: "My Assets",
      subtitleAdmin: "Manage inventory with accountable custody tracking",
      subtitleEmployee: "Assets currently assigned to you",
      addAsset: "Add Asset",
      searchPlaceholder: "Search by name or serial number...",
      loadingTitle: "Loading your assets",
      loadingDescription: "Retrieving currently assigned assets.",
      unavailableAdmin: "Asset list unavailable",
      unavailableEmployee: "My Assets unavailable",
      noAssignedTitle: "No active assets assigned",
      noAssignedFiltered: "No assigned assets match your current filters.",
      noAssigned: "You do not currently have any actively assigned assets.",
      name: "Name",
      category: "Category",
      serialNumber: "Serial Number",
      assignedTo: "Assigned To",
      assignedOn: "Assigned On",
      lastUpdated: "Last Updated",
      noAssetsFiltered: "No assets match the current filters",
      noAssets: "No assets registered yet",
      view: "View",
      edit: "Edit",
      changeStatus: "Change Status",
      qrCode: "QR Code",
    },
    requests: {
      titleAdmin: "Asset Requests",
      titleEmployee: "My Requests",
      subtitleAdmin: "Review requests with clear decision accountability",
      subtitleEmployee: "Submit and track request decisions",
      newRequest: "New Request",
      requester: "Requester",
      requestType: "Request Type",
      assetName: "Asset Name",
      target: "Target",
      requestedStatus: "Requested Status",
      rationale: "Rationale",
      noRequestsAdmin: "No requests submitted yet",
      noRequestsEmployee: "You have not submitted any requests yet",
      noRequestsFiltered: "No requests match this status filter",
      adminFeedback: "Admin Feedback",
      approve: "Approve",
      reject: "Reject",
      approveRequest: "Approve Request",
      rejectRequest: "Reject Request",
      targetAsset: "Target Asset:",
      requestedBy: "Requested by:",
      adminNotes: "Admin Notes",
      adminNotesRequired: "Admin Notes (required)",
      approveNotesPlaceholder: "Any notes for the requester...",
      rejectNotesPlaceholder: "Reason for rejection...",
      processing: "Processing...",
      byPrefix: "by",
      requestApprovedSuccess: "Request approved successfully",
      requestRejectedSuccess: "Request rejected successfully",
    },
    employees: {
      title: "Employees",
      subtitleAdmin: "Manage employee records and asset assignments",
      subtitleEmployee: "View employee records",
      addEmployee: "Add Employee",
      fullName: "Full Name",
      email: "Email",
      phone: "Phone",
      department: "Department",
      branch: "Branch",
      assetsAssigned: "Assets Assigned",
      noEmployees: "No employees found",
    },
    audit: {
      title: "Audit Log",
      subtitle: "Traceable timeline of asset status decisions for compliance reviews",
      exportCsv: "Export CSV",
      asset: "Asset",
      oldStatus: "Old Status",
      newStatus: "New Status",
      changedBy: "Changed By",
      dateTime: "Date/Time",
      reason: "Reason",
      noEntriesFiltered: "No audit entries match current filters",
      noEntries: "No audit entries recorded yet",
    },
    analytics: {
      title: "Analytics",
      subtitle: "Advanced insights and risk analysis",
      assetAgingDistribution: "Asset Aging Distribution",
      assetsByDepartment: "Assets by Department",
      statusTrends: "Status Trends Over Time",
      topReassigned: "Top 5 Most Reassigned Assets",
      totalAssignments: "Total Assignments",
    },
    profile: {
      title: "Profile",
      subtitleAdmin: "View account details and review profile updates.",
      subtitleEmployee: "View account details and request profile changes.",
      account: "Account",
      email: "Email",
      role: "Role",
      fullName: "Full Name",
      phone: "Phone",
      department: "Department",
      branch: "Branch",
      notAvailable: "Not available",
      logout: "Logout",
      signingOut: "Signing out...",
      security: "Security",
      openSecuritySettings: "Open Supabase Security Settings",
      requestProfileUpdate: "Request Profile Update",
      requestedName: "Requested Name",
      requestedPhone: "Requested Phone",
      requestedDepartment: "Requested Department",
      requestedBranch: "Requested Branch",
      reason: "Reason",
      requestReasonPlaceholder: "Provide a brief reason for these profile updates...",
      submitting: "Submitting...",
      submitUpdateRequest: "Submit Update Request",
      requestsAdmin: "Profile Update Requests",
      requestsEmployee: "My Profile Update Requests",
      noRequestsAdmin: "No profile update requests yet.",
      noRequestsEmployee: "You have not submitted profile update requests yet.",
      yourRequest: "Your request",
      submittedOn: "Submitted",
      adminNotes: "Admin notes:",
      approveUpdate: "Approve Profile Update",
      rejectUpdate: "Reject Profile Update",
      adminNotesRequired: "Admin Notes (required)",
      adminNotesOptionalPlaceholder: "Optional guidance for employee...",
      adminNotesRejectPlaceholder: "Reason for rejecting this update...",
      provideAtLeastOne: "Please provide at least one profile field to update",
      provideReason: "Please provide the reason for this request",
      requestSubmitted: "Profile update request submitted",
      loadFailed: "Failed to load profile",
      submitFailed: "Failed to submit profile update request",
      reviewFailed: "Failed to review request",
      signOutFailed: "Failed to sign out",
      signOutSuccess: "Signed out successfully",
      requestApproved: "Request approved",
      requestRejected: "Request rejected",
    },
    login: {
      subtitle: "Bank Office Asset Management System",
      checkEmail: "Check your email",
      checkEmailMessage: "We sent a confirmation link to",
      checkEmailMessageEnd: "Click the link to verify your account, then come back to sign in.",
      backToSignIn: "Back to Sign In",
      createAccount: "Create Account",
      signIn: "Sign In",
      signUp: "Sign Up",
      registerDescription: "Register a new account to get started",
      loginDescription: "Enter your credentials to access the system",
      email: "Email",
      password: "Password",
      creatingAccount: "Creating account...",
      signingIn: "Signing in...",
      hasAccount: "Already have an account?",
      noAccount: "Don't have an account?",
      confirmationEmailSent: "Confirmation email sent! Check your inbox.",
      welcomeBack: "Welcome back!",
      genericError: "An error occurred",
    },
    language: {
      label: "Language",
      en: "English",
      ru: "Русский",
      uz: "Oʻzbekcha",
    },
  },
  ru: {
    nav: {
      dashboard: "Панель",
      assets: "Активы",
      requests: "Запросы",
      myRequests: "Мои запросы",
      employees: "Сотрудники",
      audit: "Аудит",
      analytics: "Аналитика",
      profile: "Профиль",
    },
    dashboard: {
      title: "Панель",
      addAsset: "Добавить актив",
      addEmployee: "Добавить сотрудника",
      requestAsset: "Запросить актив",
      viewAll: "Смотреть все",
      totalAssets: "Всего активов",
      assigned: "Назначено",
      inRepair: "В ремонте",
      lost: "Утеряно",
      writtenOff: "Списано",
      pendingRequests: "Ожидающие запросы",
      assetsByCategory: "Активы по категории",
      assetsByStatus: "Активы по статусу",
      myRecentRequests: "Мои недавние запросы",
      recentActivity: "Последняя активность",
    },
    assets: {
      titleAdmin: "Активы",
      titleEmployee: "Мои активы",
      addAsset: "Добавить актив",
      searchPlaceholder: "Поиск по названию или серийному номеру...",
      name: "Название",
      category: "Категория",
      serialNumber: "Серийный номер",
      assignedTo: "Назначено",
      assignedOn: "Дата назначения",
      lastUpdated: "Обновлено",
      view: "Просмотр",
      edit: "Изменить",
      changeStatus: "Сменить статус",
      qrCode: "QR-код",
      noAssets: "Активы пока не зарегистрированы",
      noAssetsFiltered: "Нет активов по текущим фильтрам",
    },
    requests: {
      titleAdmin: "Запросы на активы",
      titleEmployee: "Мои запросы",
      newRequest: "Новый запрос",
      requester: "Заявитель",
      requestType: "Тип запроса",
      assetName: "Название актива",
      target: "Цель",
      requestedStatus: "Запрошенный статус",
      rationale: "Обоснование",
      noRequestsAdmin: "Запросов пока нет",
      noRequestsEmployee: "Вы еще не отправляли запросы",
      noRequestsFiltered: "Нет запросов для этого фильтра",
      adminFeedback: "Комментарий администратора",
      approve: "Одобрить",
      reject: "Отклонить",
      approveRequest: "Одобрить запрос",
      rejectRequest: "Отклонить запрос",
      targetAsset: "Целевой актив:",
      requestedBy: "Запросил:",
      adminNotes: "Заметки администратора",
      adminNotesRequired: "Заметки администратора (обязательно)",
      approveNotesPlaceholder: "Комментарий для заявителя...",
      rejectNotesPlaceholder: "Причина отклонения...",
      processing: "Обработка...",
      byPrefix: "кем",
    },
    employees: {
      title: "Сотрудники",
      addEmployee: "Добавить сотрудника",
      fullName: "ФИО",
      email: "Email",
      phone: "Телефон",
      department: "Отдел",
      branch: "Филиал",
      assetsAssigned: "Назначено активов",
      noEmployees: "Сотрудники не найдены",
    },
    audit: {
      title: "Журнал аудита",
      exportCsv: "Экспорт CSV",
      asset: "Актив",
      oldStatus: "Старый статус",
      newStatus: "Новый статус",
      changedBy: "Изменил",
      dateTime: "Дата/время",
      reason: "Причина",
      noEntriesFiltered: "Нет записей по текущим фильтрам",
      noEntries: "Записи аудита отсутствуют",
    },
    analytics: {
      title: "Аналитика",
      subtitle: "Расширенная аналитика и оценка рисков",
      assetAgingDistribution: "Распределение по возрасту активов",
      assetsByDepartment: "Активы по отделам",
      statusTrends: "Тренды статусов по времени",
      topReassigned: "Топ-5 часто переназначаемых активов",
      totalAssignments: "Всего назначений",
    },
    profile: {
      title: "Профиль",
      account: "Аккаунт",
      email: "Email",
      role: "Роль",
      fullName: "ФИО",
      phone: "Телефон",
      department: "Отдел",
      branch: "Филиал",
      notAvailable: "Недоступно",
      logout: "Выйти",
      signingOut: "Выход...",
      requestProfileUpdate: "Запрос на обновление профиля",
      submitUpdateRequest: "Отправить запрос",
      requestsAdmin: "Запросы на обновление профиля",
      requestsEmployee: "Мои запросы на обновление профиля",
      yourRequest: "Ваш запрос",
      submittedOn: "Отправлено",
      approveUpdate: "Одобрить обновление профиля",
      rejectUpdate: "Отклонить обновление профиля",
    },
    login: {
      subtitle: "Система управления активами банковского офиса",
      createAccount: "Создать аккаунт",
      signIn: "Войти",
      signUp: "Регистрация",
      email: "Email",
      password: "Пароль",
      creatingAccount: "Создание аккаунта...",
      signingIn: "Вход...",
      hasAccount: "Уже есть аккаунт?",
      noAccount: "Нет аккаунта?",
      backToSignIn: "Назад ко входу",
      checkEmail: "Проверьте почту",
      welcomeBack: "С возвращением!",
    },
    language: {
      label: "Язык",
      en: "English",
      ru: "Русский",
      uz: "Oʻzbekcha",
    },
  },
  uz: {
    nav: {
      dashboard: "Boshqaruv",
      assets: "Aktivlar",
      requests: "So‘rovlar",
      myRequests: "Mening so‘rovlarim",
      employees: "Xodimlar",
      audit: "Audit",
      analytics: "Tahlil",
      profile: "Profil",
    },
    dashboard: {
      title: "Boshqaruv",
      addAsset: "Aktiv qo‘shish",
      addEmployee: "Xodim qo‘shish",
      requestAsset: "Aktiv so‘rash",
      viewAll: "Barchasini ko‘rish",
      totalAssets: "Jami aktivlar",
      assigned: "Biriktirilgan",
      inRepair: "Ta’mirda",
      lost: "Yo‘qolgan",
      writtenOff: "Hisobdan chiqarilgan",
      pendingRequests: "Kutilayotgan so‘rovlar",
      assetsByCategory: "Kategoriya bo‘yicha aktivlar",
      assetsByStatus: "Holat bo‘yicha aktivlar",
      myRecentRequests: "So‘nggi so‘rovlarim",
      recentActivity: "So‘nggi faollik",
    },
    assets: {
      titleAdmin: "Aktivlar",
      titleEmployee: "Mening aktivlarim",
      addAsset: "Aktiv qo‘shish",
      searchPlaceholder: "Nomi yoki seriya raqami bo‘yicha qidiring...",
      name: "Nomi",
      category: "Kategoriya",
      serialNumber: "Seriya raqami",
      assignedTo: "Biriktirilgan xodim",
      assignedOn: "Biriktirilgan sana",
      lastUpdated: "Oxirgi yangilanish",
      view: "Ko‘rish",
      edit: "Tahrirlash",
      changeStatus: "Holatni o‘zgartirish",
      qrCode: "QR-kod",
      noAssets: "Hali aktivlar kiritilmagan",
      noAssetsFiltered: "Joriy filtrlarga mos aktiv topilmadi",
    },
    requests: {
      titleAdmin: "Aktiv so‘rovlari",
      titleEmployee: "Mening so‘rovlarim",
      newRequest: "Yangi so‘rov",
      requester: "So‘rovchi",
      requestType: "So‘rov turi",
      assetName: "Aktiv nomi",
      target: "Nishon",
      requestedStatus: "So‘ralgan holat",
      rationale: "Asos",
      noRequestsAdmin: "Hali so‘rovlar yo‘q",
      noRequestsEmployee: "Siz hali so‘rov yubormagansiz",
      noRequestsFiltered: "Bu filtrga mos so‘rovlar yo‘q",
      adminFeedback: "Administrator izohi",
      approve: "Tasdiqlash",
      reject: "Rad etish",
      approveRequest: "So‘rovni tasdiqlash",
      rejectRequest: "So‘rovni rad etish",
      targetAsset: "Nishon aktiv:",
      requestedBy: "So‘rov yuborgan:",
      adminNotes: "Administrator izohi",
      adminNotesRequired: "Administrator izohi (majburiy)",
      approveNotesPlaceholder: "So‘rovchi uchun izoh...",
      rejectNotesPlaceholder: "Rad etish sababi...",
      processing: "Qayta ishlanmoqda...",
      byPrefix: "tomonidan",
    },
    employees: {
      title: "Xodimlar",
      addEmployee: "Xodim qo‘shish",
      fullName: "F.I.Sh.",
      email: "Email",
      phone: "Telefon",
      department: "Bo‘lim",
      branch: "Filial",
      assetsAssigned: "Biriktirilgan aktivlar",
      noEmployees: "Xodimlar topilmadi",
    },
    audit: {
      title: "Audit jurnali",
      exportCsv: "CSV eksport",
      asset: "Aktiv",
      oldStatus: "Eski holat",
      newStatus: "Yangi holat",
      changedBy: "O‘zgartirgan",
      dateTime: "Sana/vaqt",
      reason: "Sabab",
      noEntriesFiltered: "Joriy filtrlarga mos audit yozuvi yo‘q",
      noEntries: "Audit yozuvlari hali yo‘q",
    },
    analytics: {
      title: "Tahlil",
      subtitle: "Kengaytirilgan tahlil va risklar bahosi",
      assetAgingDistribution: "Aktivlarning eskirish taqsimoti",
      assetsByDepartment: "Bo‘limlar bo‘yicha aktivlar",
      statusTrends: "Vaqt bo‘yicha holat trendi",
      topReassigned: "Eng ko‘p qayta biriktirilgan 5 ta aktiv",
      totalAssignments: "Jami biriktirishlar",
    },
    profile: {
      title: "Profil",
      account: "Hisob",
      email: "Email",
      role: "Rol",
      fullName: "F.I.Sh.",
      phone: "Telefon",
      department: "Bo‘lim",
      branch: "Filial",
      notAvailable: "Mavjud emas",
      logout: "Chiqish",
      signingOut: "Chiqilmoqda...",
      requestProfileUpdate: "Profilni yangilash so‘rovi",
      submitUpdateRequest: "So‘rovni yuborish",
      requestsAdmin: "Profil yangilash so‘rovlari",
      requestsEmployee: "Mening profil yangilash so‘rovlarim",
      yourRequest: "Sizning so‘rovingiz",
      submittedOn: "Yuborilgan",
      approveUpdate: "Profil yangilashni tasdiqlash",
      rejectUpdate: "Profil yangilashni rad etish",
    },
    login: {
      subtitle: "Bank ofisi aktivlarini boshqarish tizimi",
      createAccount: "Hisob yaratish",
      signIn: "Kirish",
      signUp: "Ro‘yxatdan o‘tish",
      email: "Email",
      password: "Parol",
      creatingAccount: "Hisob yaratilmoqda...",
      signingIn: "Kirilmoqda...",
      hasAccount: "Hisobingiz bormi?",
      noAccount: "Hisobingiz yo‘qmi?",
      backToSignIn: "Kirishga qaytish",
      checkEmail: "Emailni tekshiring",
      welcomeBack: "Xush kelibsiz!",
    },
    language: {
      label: "Til",
      en: "English",
      ru: "Русский",
      uz: "Oʻzbekcha",
    },
  },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE_KEY}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.split("=")[1] || "");
  return value === "ru" || value === "uz" || value === "en" ? value : null;
}

function writeCookieLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_KEY}=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;
}

function resolveTranslation(tree: TranslationTree, key: string): string | null {
  const value = key.split(".").reduce<TranslationValue | undefined>((acc, part) => {
    if (!acc || typeof acc === "string") return undefined;
    return (acc as Record<string, TranslationValue>)[part];
  }, tree);
  return typeof value === "string" ? value : null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const fromStorage =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null)
        : null;
    const fromCookie = readCookieLocale();
    const saved = fromStorage || fromCookie;
    if (saved === "ru" || saved === "uz" || saved === "en") {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
    writeCookieLocale(nextLocale);
  };

  const t = useMemo(
    () => (key: string) => {
      const localized = resolveTranslation(dictionaries[locale], key);
      if (localized) return localized;
      const fallback = resolveTranslation(dictionaries.en, key);
      return fallback || key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
