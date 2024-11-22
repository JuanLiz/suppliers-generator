'use client'
import tailwindConfig from '@/tailwind.config';
import { CssVarsProvider, extendTheme } from "@mui/joy";

import resolveConfig from 'tailwindcss/resolveConfig';

const twConfig = resolveConfig(tailwindConfig)

const joyTheme = extendTheme({
    colorSchemes: {
        light: {
            palette: {
                primary: twConfig.theme.colors.orange
            }
        }
    }
})

export default function JoyTheme({ children }: { children: React.ReactNode }) {
    return <CssVarsProvider theme={joyTheme}>
        {children}
    </CssVarsProvider>
}