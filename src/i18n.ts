import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          home: "Home",
          students: "Students",
          employees: "Employees",
          profile: "Profile",
          hello: "Hello",
          overview: "Overview",
          recentContacts: "Recent Contacts",
          viewAll: "View All",
          searchPlaceholder: "Search by name, roll or phone...",
          allClasses: "All Classes",
          serial: "Serial",
          name: "Name",
          pendingUsers: "Pending Users",
          syncData: "Sync Data",
          settings: "Settings",
          signOut: "Sign Out",
          developerInfo: "Developer Info",
          lessonPlans: "Lesson Plans",
          classes: "Classes",
          teachers: "Teachers",
          student: "Student",
          teacher: "Teacher",
          admin: "Admin",
          pending: "Pending",
          call: "Call",
          whatsapp: "WhatsApp",
          uploadLesson: "Upload Lesson",
          noData: "No data found",
          loading: "Loading...",
          studentFeatureRestricted: "Student can not use this feature.",
          downloading: "Downloading...",
          offlineError: "Please turn on internet and try again.",
        }
      },
      bn: {
        translation: {
          home: "হোম",
          students: "শিক্ষার্থী",
          employees: "কর্মকর্তা",
          profile: "প্রোফাইল",
          hello: "হ্যালো",
          overview: "ওভারভিউ",
          recentContacts: "সাম্প্রতিক কন্টাক্ট",
          viewAll: "সব দেখুন",
          searchPlaceholder: "নাম, রোল বা ফোন দিয়ে খুঁজুন...",
          allClasses: "সব ক্লাস",
          serial: "সিরিয়াল",
          name: "নাম",
          pendingUsers: "পেন্ডিং ইউজার",
          syncData: "ডেটা সিঙ্ক",
          settings: "সেটিংস",
          signOut: "সাইন আউট",
          developerInfo: "ডেভেলপার তথ্য",
          lessonPlans: "লেসন প্ল্যান",
          classes: "ক্লাস",
          teachers: "শিক্ষক",
          student: "শিক্ষার্থী",
          teacher: "শিক্ষক",
          admin: "অ্যাডমিন",
          pending: "পেন্ডিং",
          call: "কল",
          whatsapp: "হোয়াটসঅ্যাপ",
          uploadLesson: "লেসন আপলোড",
          noData: "কোনো তথ্য পাওয়া যায়নি",
          loading: "লোড হচ্ছে...",
          studentFeatureRestricted: "শিক্ষার্থীরা অন্য শিক্ষার্থীর তথ্য ব্যবহার করতে পারবেনা।",
          downloading: "ডাউনলোড হচ্ছে।",
          offlineError: "অনুগ্রহ করে ইন্টারনেট চালু করে আবার চেষ্টা করুন।",
        }
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
