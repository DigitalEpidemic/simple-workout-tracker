// Mock only what jest-expo doesn't already handle

// FIX: Mock Vector Icons to prevent "act(...)" warnings regarding font loading
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// Mock specific native modules that cause issues in Jest
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAwareScrollView: ({ children, style }) => (
    <div style={style}>{children}</div>
  ),
}));

// Fix for Expo Winter runtime globals
global.__ExpoImportMetaRegistry = {
  get: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
};

if (typeof global.structuredClone === "undefined") {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn(),
    withTransactionAsync: jest.fn(),
  })),
}));

// Mock expo-router (not included in jest-expo)
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => "/"),
  useFocusEffect: jest.fn((callback) => callback()),
  Link: "Link",
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock react-native-chart-kit (third-party library)
jest.mock("react-native-chart-kit", () => ({
  LineChart: "LineChart",
  BarChart: "BarChart",
}));
