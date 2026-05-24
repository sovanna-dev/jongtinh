import { ConfigProvider, theme } from "antd";
import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";

type ColorModeContextType = {
  mode: string;
  setMode: (mode: string) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType
);

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const colorModeFromLocalStorage = localStorage.getItem("colorMode");
  const isSystemPreferenceDark = window?.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const systemPreference = isSystemPreferenceDark ? "dark" : "light";
  const [mode, setMode] = useState(
    colorModeFromLocalStorage || systemPreference
  );

  useEffect(() => {
    window.localStorage.setItem("colorMode", mode);
  }, [mode]);

  const setColorMode = () => {
    if (mode === "light") {
      setMode("dark");
    } else {
      setMode("light");
    }
  };

  const { darkAlgorithm, defaultAlgorithm } = theme;

  // JongTinh brand colors
  const jongTinhTheme = {
    token: {
      // Primary brand colors
      colorPrimary: "#FF006E",        // Pink - main brand color
      colorInfo: "#3A86FF",           // Blue - info/accent
      colorSuccess: "#4CAF50",        // Green - success
      colorWarning: "#FFBE0B",        // Yellow/Orange - warning
      colorError: "#E53935",          // Red - error

      // Link color
      colorLink: "#3A86FF",
      colorLinkHover: "#FF006E",

      // Border radius
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,

      // Font
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: 14,
      fontSizeHeading1: 32,
      fontSizeHeading2: 24,
      fontSizeHeading3: 20,
      fontSizeHeading4: 18,
      fontSizeHeading5: 16,

      // Padding
      paddingLG: 24,
      paddingMD: 20,
      paddingSM: 16,
      paddingXS: 12,
    },
    components: {
      // Button styling
      Button: {
        colorPrimary: "#FF006E",
        colorPrimaryHover: "#E0005E",
        colorPrimaryActive: "#CC0054",
        borderRadius: 8,
        controlHeight: 40,
        controlHeightLG: 48,
        controlHeightSM: 32,
        fontWeight: 600,
      },
      // Card styling
      Card: {
        borderRadiusLG: 16,
        paddingLG: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      },
      // Menu/Sidebar
      Menu: {
        itemBg: "transparent",
        itemSelectedBg: "rgba(255, 0, 110, 0.08)",
        itemSelectedColor: "#FF006E",
        itemHoverBg: "rgba(255, 0, 110, 0.04)",
        itemHoverColor: "#FF006E",
        itemActiveBg: "rgba(255, 0, 110, 0.12)",
        borderRadius: 8,
        itemMarginInline: 8,
        itemHeight: 44,
        iconSize: 18,
        collapsedIconSize: 20,
      },
      // Table
      Table: {
        headerBg: "#FAFAFA",
        headerColor: "#1A1A1A",
        headerSortActiveBg: "rgba(255, 0, 110, 0.06)",
        rowHoverBg: "rgba(255, 0, 110, 0.02)",
        borderRadiusLG: 12,
      },
      // Input
      Input: {
        activeBorderColor: "#FF006E",
        hoverBorderColor: "#FF006E",
        activeShadow: "0 0 0 2px rgba(255, 0, 110, 0.1)",
        borderRadius: 8,
      },
      // Select
      Select: {
        optionSelectedBg: "rgba(255, 0, 110, 0.08)",
        optionSelectedColor: "#FF006E",
      },
      // Tag
      Tag: {
        borderRadiusSM: 20,
      },
      // Steps
      Steps: {
        colorPrimary: "#FF006E",
        dotSize: 8,
      },
      // Modal
      Modal: {
        borderRadiusLG: 16,
      },
      // Layout
      Layout: {
        headerBg: "#FFFFFF",
        headerHeight: 64,
        siderBg: "#FFFFFF",
        bodyBg: "#F5F5F5",
      },
      // Breadcrumb
      Breadcrumb: {
        linkColor: "#3A86FF",
        linkHoverColor: "#FF006E",
        separatorColor: "#999999",
      },
      // Statistic
      Statistic: {
        contentFontSize: 28,
      },
      // Radio
      Radio: {
        colorPrimary: "#FF006E",
      },
      // Switch
      Switch: {
        colorPrimary: "#FF006E",
      },
      // Progress
      Progress: {
        colorSuccess: "#4CAF50",
      },
      // Badge
      Badge: {
        colorPrimary: "#FF006E",
      },
    },
  };

  return (
    <ColorModeContext.Provider
      value={{
        setMode: setColorMode,
        mode,
      }}
    >
      <ConfigProvider
        theme={{
          ...jongTinhTheme,
          algorithm: mode === "light" ? defaultAlgorithm : darkAlgorithm,
        }}
      >
        {children}
      </ConfigProvider>
    </ColorModeContext.Provider>
  );
};