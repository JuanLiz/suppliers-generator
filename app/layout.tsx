import { AntdRegistry } from "@ant-design/nextjs-registry";
import '@fontsource/inter';
import { ConfigProvider } from "antd";
import esESIntl from "antd/lib/locale/es_ES";
import type { Metadata } from "next";
import "./globals.css";
import JoyTheme from "./joyTheme";


export const metadata: Metadata = {
  title: "Listas de proveedores",
  description: "Generador de listas de proveedores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body
        className={`antialiased`}
      >
        <JoyTheme>
          <AntdRegistry>
            <ConfigProvider
              locale={esESIntl}
              theme={{
                
                token: {
                  fontFamily: "Inter",
                  borderRadius: 8,
                  colorPrimary: "#f97316",
                  colorBorder: "#cdd6e2",
                  colorTextDescription: "#7b7e83",
                  colorIcon: "#7b7e83",
                  colorBgMask: "#7b7e83",
                  colorTextQuaternary: "#7b7e83",

                  // colorInfo: "#f21b07",
                  // colorLink: "#f21b07",
                  // colorTextBase: "#0B1215",
                  // //colorBgBase: "#f7fff6",
                },
              }}
            >

              {children}
            </ConfigProvider>
          </AntdRegistry>
        </JoyTheme>
      </body>
    </html >
  );
}
