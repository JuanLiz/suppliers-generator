import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import esESIntl from "antd/lib/locale/es_ES";
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })

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
        className={`${inter.className} antialiased`}
      >
        <AntdRegistry>
          <ConfigProvider
            locale={esESIntl}
            theme={{

              token: {
                fontFamily: "inherit",
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
      </body>
    </html >
  );
}
