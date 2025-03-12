'use client';
import { useState, useEffect } from "react";
import {
    DropdownMenu, DropdownMenuTrigger,
    DropdownMenuLabel, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, SunMoon } from "lucide-react";



const ModeToggle = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    // const toggle = () => {
    //     setTheme(theme === 'dark' ? 'light' : 'dark');
    // }
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;
    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
                variant="ghost"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
            >
                {theme === 'system' ? (
                    <SunMoon />
                ) : theme === 'dark' ? (
                    <MoonIcon />
                ) : (
                    <SunIcon />
                )}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
                checked={theme === 'system'}
                onClick={() => setTheme('system')}
            >
                System
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
                checked={theme === 'dark'}
                onClick={() => setTheme('dark')}
            >
                Dark
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
                checked={theme === 'light'}
                onClick={() => setTheme('light')}
            >
                Light
            </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
    </DropdownMenu>
}

export default ModeToggle;

//Component Description:
//This is the ModeToggle component. It is used to toggle the theme of the application.
//It uses the useTheme hook from the next-themes library to get the current theme and set the theme.
//It uses the DropdownMenu component from the shadcn/ui library to display the theme options.
//It uses the Button component from the shadcn/ui library to display the theme icon.
//It uses the MoonIcon, SunIcon, and SunMoon icons from the lucide-react library to display the theme icons.
//It is used in the Menu component to toggle the theme of the application.